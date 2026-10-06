"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, getSessionUser, hashPassword, verifyPassword } from "@/lib/auth";
import { loginSchema, registerSchema, retailerApplicationSchema } from "@/lib/validation";
import { failure, success, type ActionState } from "@/lib/action-types";
import { normalisePhone } from "@/lib/whatsappPhone";
import { scoreLead } from "@/lib/crm";
import { resolveLeadSource } from "@/lib/campaign-server";

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return failure("Check your email and password.", {
      ...Object.fromEntries(
        parsed.error.issues.map((i) => [String(i.path[0] ?? "form"), i.message]),
      ),
    });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user) {
    // Do not reveal which half was wrong.
    return failure("Those details do not match our records.");
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return failure("Those details do not match our records.");
  }

  await createSession(user.id, user.role);
  const next = String(formData.get("next") ?? "");
  const target = safeRedirect(next, user.role === "ADMIN" ? "/admin" : "/account");
  return success(`Debug: session created. Would redirect to: ${target}`);
}

export async function registerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return failure("Please correct the highlighted fields.", {
      ...Object.fromEntries(
        parsed.error.issues.map((i) => [String(i.path[0] ?? "form"), i.message]),
      ),
    });
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return failure("An account with that email already exists. Try signing in instead.", {
      email: "Already registered",
    });
  }

  const user = await prisma.user.create({
    data: {
      email,
      fullName: parsed.data.fullName,
      phone: normalisePhone(parsed.data.phone),
      passwordHash: await hashPassword(parsed.data.password),
      role: "CUSTOMER",
    },
  });

  await createSession(user.id, user.role);
  redirect("/account?welcome=1");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) return failure("Please sign in to continue.");

  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (fullName.length < 2) return failure("Enter your full name.", { fullName: "Enter your full name" });
  if (!/^[0-9+\s()-]{7,20}$/.test(phone)) {
    return failure("Enter a valid phone number.", { phone: "Enter a valid phone number" });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { fullName, phone: normalisePhone(phone) },
  });

  revalidatePath("/account", "layout");
  return success("Profile updated");
}

export async function addAddressAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) return failure("Please sign in to continue.");

  const line1 = String(formData.get("line1") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "Bayelsa").trim();

  if (line1.length < 4) return failure("Enter your street address.", { line1: "Enter your street address" });
  if (city.length < 2) return failure("Enter your city.", { city: "Enter your city" });

  await prisma.address.create({
    data: { userId: user.id, line1, city, state, label: String(formData.get("label") ?? "Home") },
  });

  revalidatePath("/account/profile");
  return success("Address saved");
}

export async function deleteAddressAction(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;

  const id = String(formData.get("id") ?? "");
  await prisma.address.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/account/profile");
}

/**
 * Wholesale application. Creates the application for review and, when a password
 * is supplied, an account the applicant can already sign in with so they can
 * track the status. The account stays unprivileged until an admin approves it.
 */
export async function applyRetailerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const categories = formData.getAll("categories").map(String).filter(Boolean);

  const parsed = retailerApplicationSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    businessName: formData.get("businessName"),
    businessType: formData.get("businessType"),
    shopAddress: formData.get("shopAddress"),
    city: formData.get("city"),
    state: formData.get("state") || "Bayelsa",
    yearsInBusiness: formData.get("yearsInBusiness") || undefined,
    monthlyVolume: formData.get("monthlyVolume") || undefined,
    categories,
    note: formData.get("note") || undefined,
    password: formData.get("password") || undefined,
  });

  if (!parsed.success) {
    return failure("Please correct the highlighted fields.", {
      ...Object.fromEntries(
        parsed.error.issues.map((i) => [String(i.path[0] ?? "form"), i.message]),
      ),
    });
  }

  const data = parsed.data;
  const email = data.email.toLowerCase();

  const alreadyApplied = await prisma.retailerApplication.findFirst({
    where: { email, status: { in: ["PENDING", "APPROVED"] } },
  });
  if (alreadyApplied) {
    return failure(
      alreadyApplied.status === "APPROVED"
        ? "That business already has an approved account. Sign in to see your price list."
        : "You already have an application with us and it is still being reviewed.",
    );
  }

  const passwordHash = data.password ? await hashPassword(data.password) : null;

  await prisma.$transaction(async (tx) => {
    const application = await tx.retailerApplication.create({
      data: {
        email,
        fullName: data.fullName,
        phone: normalisePhone(data.phone),
        businessName: data.businessName,
        businessType: data.businessType,
        shopAddress: data.shopAddress,
        city: data.city,
        state: data.state,
        yearsInBusiness: data.yearsInBusiness ?? null,
        monthlyVolume: data.monthlyVolume ?? null,
        categories: data.categories,
        note: data.note,
        status: "PENDING",
      },
    });

    const user = await tx.user.upsert({
      where: { email },
      update: {
        fullName: data.fullName,
        phone: normalisePhone(data.phone),
        ...(passwordHash ? { passwordHash } : {}),
      },
      create: {
        email,
        fullName: data.fullName,
        phone: normalisePhone(data.phone),
        passwordHash: passwordHash ?? (await hashPassword(crypto.randomUUID())),
        role: "RETAILER",
      },
    });

    await tx.retailerProfile.upsert({
      where: { userId: user.id },
      update: {
        businessName: data.businessName,
        businessType: data.businessType,
        shopAddress: data.shopAddress,
        city: data.city,
        state: data.state,
        yearsInBusiness: data.yearsInBusiness ?? null,
        monthlyVolume: data.monthlyVolume ?? null,
        productCategories: data.categories,
        status: "PENDING",
        applicationId: application.id,
      },
      create: {
        userId: user.id,
        businessName: data.businessName,
        businessType: data.businessType,
        shopAddress: data.shopAddress,
        city: data.city,
        state: data.state,
        yearsInBusiness: data.yearsInBusiness ?? null,
        monthlyVolume: data.monthlyVolume ?? null,
        productCategories: data.categories,
        status: "PENDING",
        applicationId: application.id,
      },
    });

    // The application itself is a sales lead until it converts.
    const existingLead = await tx.lead.findFirst({ where: { phone: normalisePhone(data.phone) } });
    if (!existingLead) {
      const lead = await tx.lead.create({
        data: {
          fullName: data.fullName,
          email,
          phone: normalisePhone(data.phone),
          city: data.city,
          state: data.state,
          source: (await resolveLeadSource("WHATSAPP")) as never,
          stage: "QUALIFIED",
          interestedIn: `Wholesale account: ${data.businessName}`,
          notes: `Applied for wholesale. ${data.note ?? ""}`.trim(),
          tags: ["wholesale", "application"],
        },
      });

      const score = scoreLead({
        stage: lead.stage,
        source: lead.source,
        interestedIn: lead.interestedIn,
        notes: lead.notes,
        orderValueEstimate: 500_000,
      });
      await tx.lead.update({ where: { id: lead.id }, data: { score } });
      await tx.leadActivity.create({
        data: {
          leadId: lead.id,
          type: "WHOLESALE_APPLICATION",
          summary: `${data.businessName} applied for wholesale prices`,
        },
      });
    }
  });

  revalidatePath("/wholesale");
  return success(
    "Application received. We review every application personally and will message you on WhatsApp within one working day.",
  );
}

/** Only allows same-origin relative paths, so ?next= cannot become an open redirect. */
function safeRedirect(next: string, fallback: string): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}
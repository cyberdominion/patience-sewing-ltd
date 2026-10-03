"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { slugify, toKobo } from "@/lib/money";
import { productSchema, orderStatusSchema, reviewSchema } from "@/lib/validation";
import { failure, success, type ActionState } from "@/lib/action-types";
import { normalisePhone } from "@/lib/whatsappPhone";
import { scoreLead } from "@/lib/crm";
import { resolveLeadSource } from "@/lib/campaign-server";

/* ------------------------------------------------------------------ *
 * Products
 * ------------------------------------------------------------------ */

export async function saveProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const productId = String(formData.get("productId") ?? "");
  const raw = {
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    subtitle: formData.get("subtitle") || undefined,
    description: formData.get("description"),
    category: formData.get("category"),
    fabric: formData.get("fabric") || undefined,
    colourways: formData.getAll("colourways").map((c) => String(c).trim()).filter(Boolean),
    sizes: formData.getAll("sizes").map((s) => String(s).trim()).filter(Boolean),
    styleCode: formData.get("styleCode") || undefined,
    bespoke: formData.get("bespoke") === "on",
    retailPrice: formData.get("retailPrice"),
    wholesalePrice: formData.get("wholesalePrice"),
    wholesaleMinQty: formData.get("wholesaleMinQty") || 6,
    compareAtPrice: formData.get("compareAtPrice") || null,
    stock: formData.get("stock") || 0,
    lowStockAlert: formData.get("lowStockAlert") || 5,
    leadTimeDays: formData.get("leadTimeDays") || 14,
    images: formData.getAll("images").map(String).filter(Boolean),
    status: formData.get("status") || "DRAFT",
    featured: formData.get("featured") === "on",
    tags: formData.getAll("tags").map((t) => String(t).trim().toLowerCase()).filter(Boolean),
    seoTitle: formData.get("seoTitle") || undefined,
    seoDescription: formData.get("seoDescription") || undefined,
  };

  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    return failure("Please correct the highlighted fields.", {
      ...Object.fromEntries(
        parsed.error.issues.map((i) => [String(i.path[0] ?? "form"), i.message]),
      ),
    });
  }

  const data = parsed.data;

  // Wholesale must be below retail, or retailers would pay more than customers.
  if (data.wholesalePrice >= data.retailPrice) {
    return failure("The wholesale price must be lower than the retail price.", {
      wholesalePrice: "Wholesale must be below retail",
    });
  }

  const slug = data.slug ? slugify(data.slug) : slugify(data.name);

  if (!productId) {
    const clash = await prisma.product.findUnique({ where: { slug } });
    if (clash) return failure("That slug is already taken.", { slug: "Slug already in use" });

    await prisma.product.create({
      data: {
        name: data.name,
        slug,
        subtitle: data.subtitle,
        description: data.description,
        category: data.category,
        fabric: data.fabric,
        colourways: data.colourways,
        sizes: data.sizes,
        styleCode: data.styleCode,
        bespoke: data.bespoke,
        retailPrice: toKobo(data.retailPrice),
        wholesalePrice: toKobo(data.wholesalePrice),
        wholesaleMinQty: data.wholesaleMinQty,
        compareAtPrice: data.compareAtPrice ? toKobo(data.compareAtPrice) : null,
        stock: data.stock,
        lowStockAlert: data.lowStockAlert,
        leadTimeDays: data.leadTimeDays,
        status: data.status,
        featured: data.featured,
        tags: data.tags,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        images: { create: data.images.map((url, i) => ({ url, position: i })) },
      },
    });

    revalidatePath("/admin/products");
    revalidatePath("/shop");
    return success(`${data.name} created`);
  }

  const existing = await prisma.product.findUnique({ where: { id: productId } });
  if (!existing) return failure("That product no longer exists.");

  const clash = await prisma.product.findFirst({
    where: { slug, id: { not: productId } },
  });
  if (clash) return failure("That slug is already taken.", { slug: "Slug already in use" });

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productId },
      data: {
        name: data.name,
        slug,
        subtitle: data.subtitle,
        description: data.description,
        category: data.category,
        fabric: data.fabric,
        colourways: data.colourways,
        sizes: data.sizes,
        styleCode: data.styleCode,
        bespoke: data.bespoke,
        retailPrice: toKobo(data.retailPrice),
        wholesalePrice: toKobo(data.wholesalePrice),
        wholesaleMinQty: data.wholesaleMinQty,
        compareAtPrice: data.compareAtPrice ? toKobo(data.compareAtPrice) : null,
        stock: data.stock,
        lowStockAlert: data.lowStockAlert,
        leadTimeDays: data.leadTimeDays,
        status: data.status,
        featured: data.featured,
        tags: data.tags,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
      },
    });

    // Replace the image set wholesale; positions are managed by form order.
    await tx.productImage.deleteMany({ where: { productId } });
    if (data.images.length > 0) {
      await tx.productImage.createMany({
        data: data.images.map((url, i) => ({ productId, url, position: i })),
      });
    }
  });

  revalidatePath("/admin/products");
  revalidatePath(`/shop/${slug}`);
  return success(`${data.name} updated`);
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("productId") ?? "");
  const mode = String(formData.get("mode") ?? "archive");

  if (!id) return;

  if (mode === "delete") {
    // Order history must survive a deleted product, so cascade through reviews
    // and images but keep orderItems with a null product reference.
    await prisma.product.delete({ where: { id } }).catch(async () => {
      // If a relation blocks the hard delete, archive instead so no data is lost.
      await prisma.product.update({ where: { id }, data: { status: "ARCHIVED" } });
    });
  } else {
    await prisma.product.update({ where: { id }, data: { status: "ARCHIVED" } });
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");
}

export async function toggleProductStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("productId") ?? "");
  const next = String(formData.get("status") ?? "ACTIVE");

  await prisma.product.update({
    where: { id },
    data: { status: next as never },
  });

  revalidatePath("/admin/products");
  revalidatePath("/shop");
}

export async function toggleFeaturedAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("productId") ?? "");
  const product = await prisma.product.findUnique({ where: { id }, select: { featured: true } });
  if (!product) return;

  await prisma.product.update({ where: { id }, data: { featured: !product.featured } });
  revalidatePath("/admin/products");
}

export async function adjustStockAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = String(formData.get("productId") ?? "");
  const delta = Number(formData.get("delta") ?? 0);
  if (!id || !Number.isFinite(delta) || delta === 0) {
    return failure("Enter a stock adjustment.");
  }

  const product = await prisma.product.findUnique({ where: { id }, select: { name: true, stock: true } });
  if (!product) return failure("That product no longer exists.");

  const next = Math.max(0, product.stock + delta);
  await prisma.product.update({ where: { id }, data: { stock: next } });

  revalidatePath("/admin/products");
  revalidatePath("/admin/orders");
  return success(`${product.name} stock set to ${next}`);
}

/* ------------------------------------------------------------------ *
 * Orders
 * ------------------------------------------------------------------ */

export async function updateOrderStatusAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = orderStatusSchema.safeParse({
    orderId: formData.get("orderId"),
    status: formData.get("status"),
  });

  if (!parsed.success) return failure("Choose a valid status.");

  const { orderId, status } = parsed.data;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return failure("That order no longer exists.");

  await prisma.$transaction(async (tx) => {
    // Restock if an order is cancelled before it shipped, so the units sell again.
    const restocking =
      (order.status === "PENDING" || order.status === "PAID" || order.status === "IN_PRODUCTION") &&
      (status === "CANCELLED" || status === "REFUNDED");

    if (restocking) {
      for (const item of order.items) {
        if (!item.productId) continue;
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    await tx.order.update({ where: { id: orderId }, data: { status } });
  });

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath("/account");

  void admin;
  return success(`Order ${order.reference} marked ${status.toLowerCase().replace(/_/g, " ")}`);
}

/* ------------------------------------------------------------------ *
 * Retailer approvals
 * ------------------------------------------------------------------ */

export async function reviewRetailerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();

  const applicationId = String(formData.get("applicationId") ?? "");
  const decision = String(formData.get("decision") ?? "APPROVED") as
    | "APPROVED"
    | "REJECTED"
    | "SUSPENDED";
  const discountPercent = Math.max(0, Math.min(60, Number(formData.get("discountPercent") ?? 20)));
  const creditLimitNaira = Math.max(0, Number(formData.get("creditLimit") ?? 0));
  const reviewNote = String(formData.get("reviewNote") ?? "").trim();

  if (!applicationId) return failure("Missing application.");

  const application = await prisma.retailerApplication.findUnique({
    where: { id: applicationId },
    include: { profile: true },
  });
  if (!application) return failure("That application no longer exists.");

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.retailerApplication.update({
      where: { id: applicationId },
      data: {
        status: decision,
        reviewedBy: admin.email,
        reviewedAt: now,
        reviewNote: reviewNote || null,
      },
    });

    if (application.profile) {
      await tx.retailerProfile.update({
        where: { id: application.profile.id },
        data: {
          status: decision,
          discountPercent: decision === "APPROVED" ? discountPercent : 0,
          creditLimit: decision === "APPROVED" ? toKobo(creditLimitNaira) : 0,
          reviewedBy: admin.email,
          reviewedAt: now,
          reviewNote: reviewNote || null,
        },
      });

      // Approving a retailer converts their lead to won.
      const lead = await tx.lead.findFirst({ where: { email: application.email } });
      if (lead) {
        await tx.lead.update({
          where: { id: lead.id },
          data: {
            stage: decision === "APPROVED" ? "WON" : "LOST",
            score: decision === "APPROVED" ? 100 : scoreLead({
              stage: "LOST",
              source: lead.source,
              budgetRange: lead.budgetRange,
              orderValueEstimate: 0,
            }),
            lostReason: decision === "APPROVED" ? null : reviewNote || "Application declined",
          },
        });
        await tx.leadActivity.create({
          data: {
            leadId: lead.id,
            actorId: admin.id,
            type: "WHOLESALE_" + decision,
            summary:
              decision === "APPROVED"
                ? `Wholesale approved at ${discountPercent}% discount`
                : `Wholesale application ${decision.toLowerCase()}`,
          },
        });
      }
    }
  });

  revalidatePath("/admin/retailers");
  return success(
    decision === "APPROVED"
      ? `${application.businessName} approved at ${discountPercent}% discount`
      : `${application.businessName} ${decision.toLowerCase()}`,
  );
}

export async function setRetailerStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("profileId") ?? "");
  const status = String(formData.get("status") ?? "APPROVED");

  await prisma.retailerProfile.update({
    where: { id },
    data: { status: status as never, reviewedAt: new Date() },
  });

  revalidatePath("/admin/retailers");
}

/* ------------------------------------------------------------------ *
 * CRM
 * ------------------------------------------------------------------ */

export async function updateLeadStageAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("leadId") ?? "");
  const stage = String(formData.get("stage") ?? "NEW");

  await prisma.lead.update({ where: { id }, data: { stage: stage as never } });
  revalidatePath("/admin/crm");
}

export async function saveLeadNotesAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  const leadId = String(formData.get("leadId") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!leadId || body.length < 2) return failure("Write a note before saving.");

  await prisma.$transaction([
    prisma.crmNote.create({ data: { leadId, userId: admin.id, body } }),
    prisma.leadActivity.create({
      data: { leadId, actorId: admin.id, type: "NOTE", summary: body.slice(0, 300) },
    }),
  ]);

  revalidatePath(`/admin/crm/${leadId}`);
  return success("Note saved");
}

export async function createFollowUpAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  const leadId = String(formData.get("leadId") ?? "");
  const channel = String(formData.get("channel") ?? "WHATSAPP");
  const scheduledAt = new Date(String(formData.get("scheduledAt") ?? new Date()));
  const finalMessage = String(formData.get("finalMessage") ?? "").trim();

  if (!leadId) return failure("Missing lead.");

  if (Number.isNaN(scheduledAt.getTime())) {
    return failure("Choose a valid date and time.");
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, fullName: true },
  });
  if (!lead) return failure("That lead no longer exists.");

  await prisma.followUp.create({
    data: {
      leadId,
      userId: admin.id,
      channel: channel as never,
      status: "PENDING",
      scheduledAt,
      finalMessage: finalMessage || null,
    },
  });

  await prisma.lead.update({
    where: { id: leadId },
    data: { nextFollowUpAt: scheduledAt, lastContactedAt: new Date() },
  });

  revalidatePath("/admin/crm");
  revalidatePath(`/admin/crm/${leadId}`);
  return success(`Follow-up scheduled for ${lead.fullName}`);
}

export async function markFollowUpSentAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("followUpId") ?? "");

  const followUp = await prisma.followUp.findUnique({ where: { id } });
  if (!followUp) return;

  await prisma.followUp.update({
    where: { id },
    data: { status: "SENT", sentAt: new Date() },
  });

  await prisma.lead.update({
    where: { id: followUp.leadId },
    data: { lastContactedAt: new Date() },
  });

  revalidatePath(`/admin/crm/${followUp.leadId}`);
  revalidatePath("/admin/crm");
}

export async function recordFollowUpOutcomeAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("followUpId") ?? "");
  const outcome = String(formData.get("outcome") ?? "").trim();

  const followUp = await prisma.followUp.findUnique({ where: { id } });
  if (!followUp) return;

  const replied = /answered|replied|reached|yes|interested/i.test(outcome);

  await prisma.followUp.update({
    where: { id },
    data: {
      outcome,
      status: replied ? "REPLIED" : "NO_RESPONSE",
      outcomeScore: replied ? 1 : 0,
    },
  });

  await prisma.lead.update({
    where: { id: followUp.leadId },
    data: {
      lastContactedAt: new Date(),
      stage: replied && followUp.channel !== "IN_PERSON" ? "CONTACTED" : undefined,
    },
  });

  await prisma.leadActivity.create({
    data: {
      leadId: followUp.leadId,
      type: "FOLLOW_UP",
      summary: outcome.slice(0, 300),
    },
  });

  revalidatePath(`/admin/crm/${followUp.leadId}`);
}

export async function markLeadWonAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("leadId") ?? "");

  await prisma.lead.update({
    where: { id },
    data: { stage: "WON", score: 100, lostReason: null },
  });
  revalidatePath("/admin/crm");
}

export async function deleteLeadAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("leadId") ?? "");
  await prisma.lead.delete({ where: { id } }).catch(() => undefined);
  revalidatePath("/admin/crm");
  redirect("/admin/crm");
}

/* ------------------------------------------------------------------ *
 * Settings
 * ------------------------------------------------------------------ */

export async function saveSettingsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const businessName = String(formData.get("businessName") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim();
  const whatsappNumber = String(formData.get("whatsappNumber") ?? "").trim();
  const supportEmail = String(formData.get("supportEmail") ?? "").trim();
  const supportPhone = String(formData.get("supportPhone") ?? "").trim();
  const deliveryFee = Number(formData.get("deliveryFee") ?? 0);
  const freeDeliveryThreshold = Number(formData.get("freeDeliveryThreshold") ?? 0);
  const aiEnabled = formData.get("aiEnabled") === "on";

  if (businessName.length < 2) return failure("Enter the business name.");
  if (whatsappNumber.replace(/\D/g, "").length < 11) {
    return failure("Enter the WhatsApp number with the country code, e.g. 2348000000000.");
  }
  if (!/^\S+@\S+\.\S+$/.test(supportEmail)) return failure("Enter a valid support email.");
  if (!Number.isFinite(deliveryFee) || deliveryFee < 0) return failure("Enter a valid delivery fee.");
  if (!Number.isFinite(freeDeliveryThreshold) || freeDeliveryThreshold < 0) {
    return failure("Enter a valid free delivery threshold.");
  }

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {
      businessName,
      tagline,
      whatsappNumber: normalisePhone(whatsappNumber),
      supportEmail,
      supportPhone,
      instagramHandle: String(formData.get("instagramHandle") ?? "") || null,
      facebookUrl: String(formData.get("facebookUrl") ?? "") || null,
      tiktokHandle: String(formData.get("tiktokHandle") ?? "") || null,
      deliveryFee: toKobo(deliveryFee),
      freeDeliveryThreshold: toKobo(freeDeliveryThreshold),
      bankName: String(formData.get("bankName") ?? "") || null,
      bankAccountNumber: String(formData.get("bankAccountNumber") ?? "") || null,
      bankAccountName: String(formData.get("bankAccountName") ?? "") || null,
      aiModel: String(formData.get("aiModel") ?? "gpt-4o-mini"),
      aiEnabled,
    },
    create: {
      id: "singleton",
      businessName,
      tagline,
      whatsappNumber: normalisePhone(whatsappNumber),
      supportEmail,
      supportPhone,
      deliveryFee: toKobo(deliveryFee),
      freeDeliveryThreshold: toKobo(freeDeliveryThreshold),
      aiEnabled,
    },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  return success("Settings saved");
}

/* ------------------------------------------------------------------ *
 * Reviews & enquiries
 * ------------------------------------------------------------------ */

export async function submitReviewAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = reviewSchema.safeParse({
    productId: formData.get("productId"),
    authorName: formData.get("authorName"),
    rating: formData.get("rating"),
    title: formData.get("title") || undefined,
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return failure("Please complete your review.", {
      ...Object.fromEntries(
        parsed.error.issues.map((i) => [String(i.path[0] ?? "form"), i.message]),
      ),
    });
  }

  await prisma.review.create({ data: parsed.data });
  revalidatePath(`/shop/${String(formData.get("productSlug") ?? "")}`);
  return success("Thank you. Your review is published.");
}

export async function toggleReviewPublishedAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("reviewId") ?? "");
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) return;

  await prisma.review.update({ where: { id }, data: { isPublished: !review.isPublished } });
  revalidatePath("/admin/reviews");
}

export async function markContactHandledAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("messageId") ?? "");
  await prisma.contactMessage.update({ where: { id }, data: { isHandled: true } });
  revalidatePath("/admin/inbox");
}

export async function createManualLeadAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (fullName.length < 2) return failure("Enter the lead name.");
  if (phone.replace(/\D/g, "").length < 11) return failure("Enter a valid phone number.");

  const existing = await prisma.lead.findFirst({ where: { phone: normalisePhone(phone) } });
  if (existing) return failure("That phone number is already in the pipeline.");

  const created = await prisma.lead.create({
    data: {
      fullName,
      phone: normalisePhone(phone),
      email: String(formData.get("email") ?? "") || null,
      city: String(formData.get("city") ?? "") || null,
      state: String(formData.get("state") ?? "Bayelsa"),
      source: (await resolveLeadSource(String(formData.get("source") ?? undefined)) as never),
      stage: "NEW",
      interestedIn: String(formData.get("interestedIn") ?? "") || null,
      budgetRange: String(formData.get("budgetRange") ?? "") || null,
      timeline: String(formData.get("timeline") ?? "") || null,
      notes: String(formData.get("notes") ?? "") || null,
      tags: formData.getAll("tags").map(String).filter(Boolean),
    },
  });

  revalidatePath("/admin/crm");
  redirect(`/admin/crm/${created.id}`);
}



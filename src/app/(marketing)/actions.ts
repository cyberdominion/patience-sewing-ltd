"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { fieldErrors, newsletterSchema } from "@/lib/validation";
import { failure, success, type ActionState } from "@/lib/action-types";
import { resolveLeadSource } from "@/lib/campaign-server";

export async function subscribeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = newsletterSchema.safeParse({
    email: formData.get("email"),
    source: formData.get("source") ?? "footer",
  });

  if (!parsed.success) {
    return failure("Check the email address and try again.", fieldErrors(parsed.error));
  }

  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  if (existing) {
    return success("You are already on the list. Thank you.");
  }

  await prisma.newsletterSubscriber.create({
    data: { email: parsed.data.email.toLowerCase(), source: parsed.data.source },
  });

  return success("Welcome to the list. Watch your inbox for new arrivals.");
}

/**
 * Records a public enquiry as a CRM lead. Every contact made through the site
 * lands in the pipeline so nothing is lost in a WhatsApp thread.
 */
export async function captureLeadAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const explicitSource = String(formData.get("source") ?? "");
  const source = await resolveLeadSource(explicitSource || undefined);

  if (name.length < 2) return failure("Please enter your name.", { fullName: "Enter your name" });
  if (!/^[0-9+\s()-]{7,20}$/.test(phone)) {
    return failure("Enter a phone number we can reach you on.", { phone: "Enter a valid phone number" });
  }

  const existing = await prisma.lead.findFirst({ where: { phone } });

  if (existing) {
    await prisma.$transaction([
      prisma.leadActivity.create({
        data: {
          leadId: existing.id,
          type: "ENQUIRY",
          summary: message.slice(0, 500) || "Website enquiry",
          metadata: { source },
        },
      }),
      prisma.lead.update({
        where: { id: existing.id },
        data: { lastContactedAt: new Date(), stage: existing.stage === "NEW" ? "CONTACTED" : existing.stage },
      }),
    ]);
  } else {
    const lead = await prisma.lead.create({
      data: {
        fullName: name,
        phone,
        email: email || null,
        source: source as never,
        stage: "NEW",
        notes: message.slice(0, 2000),
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: "ENQUIRY",
        summary: message.slice(0, 500) || "Website enquiry",
        metadata: { source },
      },
    });
  }

  return success("Thank you. Our team will contact you shortly.");
}

export async function trackPageView(path: string) {
  const list = await headers();
  void list;
  // Hook for analytics; intentionally a no-op until a provider is configured.
  return { ok: true, path };
}
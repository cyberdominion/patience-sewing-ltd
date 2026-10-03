"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser, normalisePhone } from "@/lib/auth";
import { getPricedCart, clearCart } from "@/lib/cart";
import { checkoutSchema } from "@/lib/validation";
import { initialiseTransaction } from "@/lib/paystack";
import { orderReference, formatNaira } from "@/lib/money";
import { BRAND } from "@/lib/brand";
import { failure, type ActionState } from "@/lib/action-types";
import { buildBrief, generateFollowUp, scoreLead } from "@/lib/crm";

function isPaystackConfigured(): boolean {
  return Boolean(process.env.PAYSTACK_SECRET_KEY && !process.env.PAYSTACK_SECRET_KEY.includes("replace_me"));
}

export async function beginCheckoutAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getSessionUser();
  const parsed = checkoutSchema.safeParse({
    customerName: formData.get("customerName"),
    customerEmail: formData.get("customerEmail"),
    customerPhone: formData.get("customerPhone"),
    shippingLine1: formData.get("shippingLine1"),
    shippingCity: formData.get("shippingCity"),
    shippingState: formData.get("shippingState") || "Bayelsa",
    shippingCountry: formData.get("shippingCountry") || "Nigeria",
    deliveryNotes: formData.get("deliveryNotes") || undefined,
    isCustomBespoke: formData.get("isCustomBespoke") === "on" || formData.get("isCustomBespoke") === "true",
    designBrief: formData.get("designBrief") || undefined,
    measurements: formData.get("measurements") || undefined,
    saveDetails: formData.get("saveDetails") === "on",
  });

  if (!parsed.success) {
    return failure("Please correct the highlighted fields.", {
      ...Object.fromEntries(
        parsed.error.issues.map((i) => [String(i.path[0] ?? "form"), i.message]),
      ),
    });
  }

  const { lines, totals } = await getPricedCart(user?.id ?? null);
  if (lines.length === 0 || !totals) {
    return failure("Your cart is empty.");
  }

  // Re-read stock inside the transaction and refuse to oversell.
  const products = await prisma.product.findMany({
    where: { id: { in: lines.map((l) => l.productId) } },
    select: { id: true, stock: true, name: true },
  });
  const stockById = new Map(products.map((p) => [p.id, p]));

  for (const line of lines) {
    const product = stockById.get(line.productId);
    if (!product || product.stock < line.quantity) {
      return failure(
        `${line.name} no longer has ${line.quantity} units available. Please reduce the quantity in your cart.`,
      );
    }
  }

  const data = parsed.data;
  const reference = orderReference();

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        reference,
        userId: user?.id ?? null,
        retailerId: user?.isApprovedRetailer ? (user.id ?? null) : null,
        status: "PENDING",
        subtotalRetail: totals.retailSubtotal,
        subtotalWholesale: totals.wholesaleSubtotal,
        discountAmount: totals.discount,
        deliveryFee: totals.deliveryFee,
        totalAmount: totals.total,
        pricingTier: totals.hasWholesaleLines ? "WHOLESALE" : "RETAIL",
        customerName: data.customerName,
        customerEmail: data.customerEmail.toLowerCase(),
        customerPhone: normalisePhone(data.customerPhone),
        shippingLine1: data.shippingLine1,
        shippingCity: data.shippingCity,
        shippingState: data.shippingState,
        shippingCountry: data.shippingCountry,
        deliveryNotes: data.deliveryNotes,
        isCustomBespoke: data.isCustomBespoke,
        designBrief: data.designBrief,
        measurements: data.measurements ? { raw: data.measurements } : undefined,
        items: {
          create: lines.map((line) => ({
            productId: line.productId,
            name: line.name,
            slug: line.slug,
            imageUrl: line.imageUrl,
            size: line.size,
            colourway: line.colourway,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            lineTotal: line.lineTotal,
            tier: line.tier,
          })),
        },
      },
    });

    // Reserve stock so a second checkout cannot take the last units.
    for (const line of lines) {
      await tx.product.update({
        where: { id: line.productId },
        data: { stock: { decrement: line.quantity } },
      });
    }

    if (data.saveDetails && user) {
      await tx.address.create({
        data: {
          userId: user.id,
          label: "Delivery address",
          line1: data.shippingLine1,
          city: data.shippingCity,
          state: data.shippingState,
          country: data.shippingCountry,
        },
      });
    }

    return created;
  });

  // Log the order as a CRM touchpoint so the pipeline reflects reality.
  const lead = await prisma.lead.findFirst({ where: { email: data.customerEmail } });
  if (lead) {
    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: "ORDER_PLACED",
        summary: `Placed ${reference} for ${formatNaira(totals.total)}`,
        metadata: { orderId: order.id },
      },
    });
  }

  if (!isPaystackConfigured()) {
    // Local development without live keys: mark paid so the flow can be tested end to end.
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        paystackReference: `DEV-${reference}`,
        amountPaid: totals.total,
        paidAt: new Date(),
      },
    });
    await clearCart();
    redirect(`/checkout/verify?reference=${reference}&dev=1`);
  }

  const headerList = await headers();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    headerList.get("origin") ??
    "http://localhost:3000";

  try {
    const payment = await initialiseTransaction({
      email: data.customerEmail,
      amountKobo: totals.total,
      reference,
      callbackUrl: `${origin}/checkout/verify?reference=${reference}`,
      metadata: {
        order_id: order.id,
        order_reference: reference,
        customer_name: data.customerName,
        customer_phone: normalisePhone(data.customerPhone),
        pricing_tier: totals.hasWholesaleLines ? "wholesale" : "retail",
        items: lines.map((l) => `${l.name} x${l.quantity}`).join(", "),
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { paystackAccessCode: payment.accessCode },
    });

    if (!payment.authorizationUrl) {
      return failure("Paystack did not return a payment link. Please try again or use WhatsApp.");
    }

    await clearCart();
    redirect(payment.authorizationUrl);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;

    await prisma.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });
    // Put the stock back since payment never started.
    await prisma.$transaction(
      lines.map((line) =>
        prisma.product.update({
          where: { id: line.productId },
          data: { stock: { increment: line.quantity } },
        }),
      ),
    );

    return failure(
      error instanceof Error
        ? `Payment could not start: ${error.message}`
        : "Payment could not start. Please try again.",
    );
  }
}

/**
 * Records a WhatsApp enquiry as a lead and drafts the first follow-up, so a
 * conversation started on WhatsApp never falls out of the pipeline.
 */
export async function captureEnquiryAction(
  lead: {
    fullName: string;
    phone: string;
    email?: string;
    city?: string;
    interestedIn?: string;
    notes?: string;
    source?: string;
  },
): Promise<{ ok: boolean; message: string }> {
  const phone = normalisePhone(lead.phone);
  if (!lead.fullName || phone.length < 11) {
    return { ok: false, message: "Name and phone are required." };
  }

  const record = await prisma.lead.upsert({
    where: { id: `${phone}` },
    update: {
      lastContactedAt: new Date(),
      interestedIn: lead.interestedIn ?? undefined,
    },
    create: {
      fullName: lead.fullName,
      phone,
      email: lead.email ?? null,
      city: lead.city ?? null,
      source: (lead.source as never) ?? "WHATSAPP",
      stage: "NEW",
      interestedIn: lead.interestedIn,
      notes: lead.notes,
    },
  }).catch(async () => {
    const existing = await prisma.lead.findFirst({ where: { phone } });
    if (existing) return existing;
    return prisma.lead.create({
      data: {
        fullName: lead.fullName,
        phone,
        email: lead.email ?? null,
        city: lead.city ?? null,
        source: (lead.source as never) ?? "WHATSAPP",
        stage: "NEW",
        interestedIn: lead.interestedIn,
        notes: lead.notes,
      },
    });
  });

  const score = scoreLead({
    stage: record.stage,
    source: record.source,
    budgetRange: record.budgetRange,
    timeline: record.timeline,
    orderValueEstimate: record.orderValueEstimate,
    interestedIn: record.interestedIn,
    notes: record.notes,
  });

  await prisma.lead.update({ where: { id: record.id }, data: { score } });

  const suggestion = await generateFollowUp(
    buildBrief({ ...record, followUps: [] }),
  );

  await prisma.followUp.create({
    data: {
      leadId: record.id,
      channel: suggestion.channel,
      scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      aiSummary: suggestion.summary,
      aiSuggestedMessage: suggestion.suggestedMessage,
      aiTone: suggestion.tone,
      aiModel: suggestion.model,
    },
  });

  await prisma.leadActivity.create({
    data: {
      leadId: record.id,
      type: "ENQUIRY",
      summary: `WhatsApp enquiry${lead.interestedIn ? ` about ${lead.interestedIn}` : ""}`,
    },
  });

  return {
    ok: true,
    message: `Logged ${record.fullName} and drafted a follow-up (${BRAND.shortName}).`,
  };
}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/paystack";
import { scoreLead } from "@/lib/crm";

export const dynamic = "force-dynamic";

/**
 * Paystack webhook. This is the authoritative signal that an order is paid,
 * because the browser redirect can be blocked or lost.
 *
 * The raw body must stay untouched so the HMAC check is meaningful.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  }

  let event: {
    event: string;
    data?: { reference?: string; amount?: number; status?: string; channel?: string };
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ message: "Malformed payload" }, { status: 400 });
  }

  const reference = event.data?.reference;
  if (!reference) {
    return NextResponse.json({ message: "No reference in payload" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { reference },
    include: { items: true },
  });

  if (!order) {
    return NextResponse.json({ message: "Unknown order" }, { status: 404 });
  }

  if (event.event === "charge.success") {
    const amount = event.data?.amount ?? order.totalAmount;
    const channel = event.data?.channel?.toUpperCase() ?? null;

    // Guard against a mismatched amount: never mark paid for less than owed.
    if (amount < order.totalAmount) {
      return NextResponse.json(
        { message: "Amount mismatch, order left pending for review" },
        { status: 202 },
      );
    }

    await prisma.$transaction(async (tx) => {
      // Idempotency: only deduct stock on the first successful charge event.
      if (order.status === "PENDING") {
        for (const item of order.items) {
          if (!item.productId) continue;
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          amountPaid: amount,
          paidAt: new Date(),
          paystackReference: reference,
          paystackChannel: channel as never,
        },
      });
    });

    const lead = await prisma.lead.findFirst({
      where: { OR: [{ email: order.customerEmail }, { phone: order.customerPhone }] },
    });

    if (lead) {
      const score = scoreLead({
        stage: lead.stage,
        source: lead.source,
        budgetRange: lead.budgetRange,
        timeline: lead.timeline,
        orderValueEstimate: order.totalAmount,
        interestedIn: lead.interestedIn,
        notes: lead.notes,
      });

      await prisma.$transaction([
        prisma.lead.update({
          where: { id: lead.id },
          data: {
            stage: lead.stage === "WON" ? "WON" : "WON",
            score,
            orderValueEstimate: order.totalAmount,
            lastContactedAt: new Date(),
          },
        }),
        prisma.leadActivity.create({
          data: {
            leadId: lead.id,
            type: "ORDER_PAID",
            summary: `Order ${reference} paid and confirmed in production`,
            metadata: { orderId: order.id, amount: order.totalAmount },
          },
        }),
      ]);
    }
  }

  if (event.event === "charge.failed" || event.event === "charge.abandoned") {
    // Abandoned checkouts are often retried, so only a hard failure cancels.
    if (event.event === "charge.failed" && order.status === "PENDING") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
      });
    }
  }

  return NextResponse.json({ received: true });
}

export async function GET() {
  return NextResponse.json({
    service: "patience-sewing-paystack-webhook",
    status: "ok",
  });
}
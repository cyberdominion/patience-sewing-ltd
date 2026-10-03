import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatNaira, formatDateTime } from "@/lib/money";
import { formatPhoneForDisplay } from "@/lib/whatsappPhone";
import { waLink } from "@/lib/whatsapp";
import { CustomerNav } from "@/components/customer-nav";
import { MessageCircle, Truck, Package, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Order detail",
  robots: { index: false, follow: false },
};

const STEPS = [
  { status: "PENDING", label: "Order placed", detail: "We have your order and are confirming it on WhatsApp." },
  { status: "PAID", label: "Payment confirmed", detail: "Payment received. Your order is booked in." },
  { status: "IN_PRODUCTION", label: "In production", detail: "Your pieces are on the cutting table." },
  { status: "READY_TO_SHIP", label: "Finished and checked", detail: "Hand-finished and inspected, ready to go." },
  { status: "SHIPPED", label: "Dispatched", detail: "On the way to you." },
  { status: "DELIVERED", label: "Delivered", detail: "Enjoy it." },
];

export default async function CustomerOrderPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const order = await prisma.order.findUnique({
    where: { reference },
    include: { items: true },
  });

  if (!order) notFound();

  const activeIndex = STEPS.findIndex((s) => s.status === order.status);
  const cancelled = order.status === "CANCELLED" || order.status === "REFUNDED";

  return (
    <div className="container-luxe py-12">
      <header>
        <p className="eyebrow">Order detail</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-royal-950">{order.reference}</h1>
        <div className="gold-rule mt-4" />
        <p className="mt-4 text-sm text-royal-900/60">
          Placed {formatDateTime(order.createdAt)}
          {order.pricingTier === "WHOLESALE" && " &middot; wholesale pricing"}
        </p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[16rem_1fr]">
        <CustomerNav isRetailer={order.pricingTier === "WHOLESALE"} retailerStatus="APPROVED" />

        <div className="space-y-8">
          {cancelled ? (
            <section className="card border-red-200 p-6">
              <h2 className="font-display text-xl font-semibold text-red-800">
                This order was {order.status.toLowerCase()}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-red-700">
                If you were charged, message us on WhatsApp with your reference and we will resolve
                it straight away.
              </p>
            </section>
          ) : (
            <section className="card p-6">
              <h2 className="font-display text-xl font-semibold text-royal-950">Progress</h2>
              <ol className="mt-6 space-y-5">
                {STEPS.map((step, i) => {
                  const done = activeIndex >= i;
                  const current = activeIndex === i;
                  return (
                    <li key={step.status} className="flex gap-4">
                      <span
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          done ? "bg-royal-900 text-white" : "bg-royal-100 text-royal-900/40"
                        } ${current ? "ring-4 ring-gold-200" : ""}`}
                      >
                        {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                      </span>
                      <span>
                        <span
                          className={`block text-sm font-semibold ${
                            done ? "text-royal-950" : "text-royal-900/45"
                          }`}
                        >
                          {step.label}
                        </span>
                        <span
                          className={`mt-0.5 block text-sm ${
                            done ? "text-royal-900/65" : "text-royal-900/35"
                          }`}
                        >
                          {step.detail}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          <section className="card p-6">
            <h2 className="font-display text-xl font-semibold text-royal-950">Items</h2>
            <ul className="mt-5 divide-y divide-royal-900/8">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 py-4">
                  <Link
                    href={`/shop/${item.slug}`}
                    className="relative h-24 w-18 shrink-0 overflow-hidden rounded-lg bg-royal-50"
                    style={{ width: "4.5rem" }}
                  >
                    {item.imageUrl && (
                      <Image src={item.imageUrl} alt="" fill sizes="72px" className="object-cover" />
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/shop/${item.slug}`}
                      className="block font-medium text-royal-950 hover:underline"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-0.5 text-sm text-royal-900/55">
                      {[item.size, item.colourway].filter(Boolean).join(" / ") || "One size"} &times;{" "}
                      {item.quantity}
                      {item.tier === "WHOLESALE" && (
                        <span className="ml-1 font-semibold text-emerald-700">wholesale price</span>
                      )}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold text-royal-950">
                    {formatNaira(item.lineTotal)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-5 space-y-2 border-t border-royal-900/10 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-royal-900/65">Subtotal</dt>
                <dd>{formatNaira(order.subtotalRetail + order.subtotalWholesale)}</dd>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <dt>Your retailer discount</dt>
                  <dd>&minus;{formatNaira(order.discountAmount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-royal-900/65">Delivery</dt>
                <dd>{order.deliveryFee === 0 ? "Free" : formatNaira(order.deliveryFee)}</dd>
              </div>
              <div className="flex justify-between border-t border-royal-900/10 pt-2 text-base font-semibold text-royal-950">
                <dt>Total</dt>
                <dd>{formatNaira(order.totalAmount)}</dd>
              </div>
            </dl>
          </section>

          <div className="grid gap-6 sm:grid-cols-2">
            <section className="card p-6">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-royal-950">
                <Package className="h-4 w-4 text-gold-600" /> Delivery address
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-royal-900/75">
                {order.customerName}
                <br />
                {[order.shippingLine1, order.shippingCity, order.shippingState, order.shippingCountry]
                  .filter(Boolean)
                  .join(", ")}
                <br />
                {formatPhoneForDisplay(order.customerPhone)}
              </p>
              {order.deliveryNotes && (
                <p className="mt-3 rounded-lg bg-royal-50 p-3 text-xs italic text-royal-900/65">
                  &ldquo;{order.deliveryNotes}&rdquo;
                </p>
              )}
            </section>

            <section className="card p-6">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-royal-950">
                <Truck className="h-4 w-4 text-gold-600" /> Payment
              </h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-royal-900/60">Reference</dt>
                  <dd className="font-mono text-xs">{order.paystackReference ?? "Not paid"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-royal-900/60">Channel</dt>
                  <dd>{order.paystackChannel?.replace(/_/g, " ").toLowerCase() ?? "Not paid"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-royal-900/60">Paid</dt>
                  <dd>{order.amountPaid > 0 ? formatNaira(order.amountPaid) : "Pending"}</dd>
                </div>
              </dl>
            </section>
          </div>

          <section className="rounded-card border border-gold-300 bg-gold-50 p-6">
            <h2 className="font-display text-xl font-semibold text-royal-950">
              Something not right?
            </h2>
            <p className="mt-1.5 text-sm text-royal-900/70">
              We offer one free adjustment within seven days of delivery. Message us with your
              reference.
            </p>
            <a
              href={waLink(
                `Good day Patience Sewing Ltd, I need help with order ${order.reference}. My reference is ${order.reference}.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary mt-4"
            >
              <MessageCircle className="h-4 w-4" /> Message us about this order
            </a>
          </section>
        </div>
      </div>
    </div>
  );
}
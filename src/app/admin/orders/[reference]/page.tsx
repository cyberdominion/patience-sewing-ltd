import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatNaira, formatDateTime } from "@/lib/money";
import { formatPhoneForDisplay } from "@/lib/whatsappPhone";
import { waLink } from "@/lib/whatsapp";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { ArrowLeft, MessageCircle, Mail, Truck, Ruler } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Order detail" };

export default async function AdminOrderPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const order = await prisma.order.findUnique({
    where: { reference },
    include: {
      items: true,
      user: { select: { email: true, fullName: true } },
      retailer: { select: { businessName: true, discountPercent: true } },
    },
  });

  if (!order) notFound();

  const timeline = [
    { status: "PENDING", label: "Order placed", at: order.createdAt },
    { status: "PAID", label: "Payment confirmed", at: order.paidAt },
    { status: "IN_PRODUCTION", label: "On the cutting table", at: null },
    { status: "READY_TO_SHIP", label: "Finished and checked", at: null },
    { status: "SHIPPED", label: "Dispatched", at: null },
    { status: "DELIVERED", label: "Delivered", at: null },
  ];
  const currentIndex = timeline.findIndex((t) => t.status === order.status);

  return (
    <div className="space-y-6">
      <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-sm text-royal-900/65 hover:text-royal-900">
        <ArrowLeft className="h-4 w-4" /> All orders
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-sm font-bold text-royal-900/60">{order.reference}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-royal-950">
            {order.customerName}
          </h1>
          <p className="mt-1 text-sm text-royal-900/60">
            Placed {formatDateTime(order.createdAt)}
            {order.retailer?.businessName && (
              <> &middot; {order.retailer.businessName} ({order.retailer.discountPercent}% trade)</>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl font-semibold text-royal-950">
            {formatNaira(order.totalAmount)}
          </p>
          <p className="text-xs text-royal-900/50">
            {order.pricingTier === "WHOLESALE" ? "Wholesale pricing" : "Retail pricing"}
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="font-display text-lg font-semibold text-royal-950">Items</h2>
            <ul className="mt-4 divide-y divide-royal-900/8">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 py-3">
                  <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded bg-royal-50">
                    {item.imageUrl && (
                      <Image src={item.imageUrl} alt="" fill sizes="48px" className="object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/shop/${item.slug}`}
                      className="block truncate text-sm font-medium text-royal-950 hover:underline"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-royal-900/55">
                      {[item.size, item.colourway].filter(Boolean).join(" / ") || "One size"} &times;{" "}
                      {item.quantity} at {formatNaira(item.unitPrice)}
                      {item.tier === "WHOLESALE" && (
                        <span className="ml-1 font-semibold text-emerald-700">wholesale</span>
                      )}
                    </p>
                    {item.notes && <p className="mt-1 text-xs italic text-royal-900/50">{item.notes}</p>}
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-royal-950">
                    {formatNaira(item.lineTotal)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2 border-t border-royal-900/10 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-royal-900/65">Subtotal</dt>
                <dd>{formatNaira(order.subtotalRetail + order.subtotalWholesale)}</dd>
              </div>
              {order.subtotalWholesale > 0 && (
                <div className="flex justify-between text-xs text-royal-900/50">
                  <dt>Retail portion</dt>
                  <dd>{formatNaira(order.subtotalRetail)}</dd>
                </div>
              )}
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <dt>Retailer discount</dt>
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
              <div className="flex justify-between text-emerald-700">
                <dt>Paid</dt>
                <dd>{formatNaira(order.amountPaid)}</dd>
              </div>
            </dl>
          </section>

          {(order.designBrief || order.measurements) && (
            <section className="card border-gold-300 bg-gold-50 p-5">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-royal-950">
                <Ruler className="h-4 w-4 text-gold-700" /> Bespoke commission details
              </h2>
              {order.designBrief && (
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gold-700">
                    Design brief
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-royal-900/80">
                    {order.designBrief}
                  </p>
                </div>
              )}
              {order.measurements && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gold-700">
                    Measurements
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-royal-900/80">
                    {typeof order.measurements === "object" &&
                    order.measurements !== null &&
                    "raw" in order.measurements
                      ? String(order.measurements.raw)
                      : JSON.stringify(order.measurements)}
                  </p>
                </div>
              )}
            </section>
          )}

          <section className="card p-5">
            <h2 className="font-display text-lg font-semibold text-royal-950">Fulfilment</h2>
            <ol className="mt-5 space-y-4">
              {timeline.map((step, i) => {
                const done = currentIndex >= i && currentIndex !== -1;
                const isCurrent = currentIndex === i;
                return (
                  <li key={step.status} className="flex gap-4">
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        done ? "bg-royal-900 text-white" : "bg-royal-100 text-royal-900/40"
                      } ${isCurrent ? "ring-4 ring-gold-200" : ""}`}
                    >
                      {i + 1}
                    </span>
                    <span>
                      <span
                        className={`block text-sm font-medium ${
                          done ? "text-royal-950" : "text-royal-900/45"
                        }`}
                      >
                        {step.label}
                      </span>
                      {step.at && (
                        <span className="block text-xs text-royal-900/45">
                          {formatDateTime(step.at)}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card p-5">
            <h2 className="font-display text-lg font-semibold text-royal-950">Update status</h2>
            <div className="mt-4">
              <OrderStatusSelect orderId={order.id} current={order.status} />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-royal-900/50">
              Cancelling or refunding an order that has not shipped returns its units to stock
              automatically.
            </p>
          </section>

          <section className="card p-5">
            <h2 className="font-display text-lg font-semibold text-royal-950">Customer</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-gold-600" />
                <a
                  href={waLink(
                    `Good day ${order.customerName}, this is Patience Sewing Ltd about your order ${order.reference}.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-royal-900/75 hover:text-royal-800 hover:underline"
                >
                  {formatPhoneForDisplay(order.customerPhone)}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gold-600" />
                <a href={`mailto:${order.customerEmail}`} className="truncate text-royal-900/75 hover:underline">
                  {order.customerEmail}
                </a>
              </li>
              {order.shippingLine1 && (
                <li className="flex items-start gap-2 text-royal-900/75">
                  <Truck className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" />
                  <span>
                    {[order.shippingLine1, order.shippingCity, order.shippingState, order.shippingCountry]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </li>
              )}
            </ul>
            {order.deliveryNotes && (
              <p className="mt-4 rounded-lg bg-royal-50 p-3 text-xs italic text-royal-900/65">
                &ldquo;{order.deliveryNotes}&rdquo;
              </p>
            )}
            {order.user && (
              <p className="mt-4 text-xs text-royal-900/50">
                Registered customer:{" "}
                <Link href={`/admin/crm?q=${order.user.email}`} className="underline underline-offset-2">
                  view in CRM
                </Link>
              </p>
            )}
          </section>

          <section className="card p-5">
            <h2 className="font-display text-lg font-semibold text-royal-950">Payment</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-royal-900/60">Reference</dt>
                <dd className="font-mono text-xs">{order.paystackReference ?? "Not paid"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-royal-900/60">Channel</dt>
                <dd>{order.paystackChannel?.replace(/_/g, " ").toLowerCase() ?? "Not paid"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-royal-900/60">Access code</dt>
                <dd className="font-mono text-xs">{order.paystackAccessCode ?? "Not paid"}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}
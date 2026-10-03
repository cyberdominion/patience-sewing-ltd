import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatNaira, formatDateTime } from "@/lib/money";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { formatPhoneForDisplay } from "@/lib/whatsappPhone";
import { waLink } from "@/lib/whatsapp";
import { Search, ShoppingCart } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Orders" };

const STATUSES = [
  "PENDING",
  "PAID",
  "IN_PRODUCTION",
  "READY_TO_SHIP",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

type SearchParams = Promise<{ q?: string; status?: string }>;

export default async function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const status = params.status ?? "";

  const where = {
    ...(query
      ? {
          OR: [
            { reference: { contains: query, mode: "insensitive" as const } },
            { customerName: { contains: query, mode: "insensitive" as const } },
            { customerEmail: { contains: query, mode: "insensitive" as const } },
            { customerPhone: { contains: query } },
          ],
        }
      : {}),
    ...(status ? { status: status as never } : {}),
  };

  const [orders, counts] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 80,
      include: { items: true },
    }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));
  const revenue = orders
    .filter((o) => ["PAID", "IN_PRODUCTION", "READY_TO_SHIP", "SHIPPED", "DELIVERED"].includes(o.status))
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold text-royal-950">Orders</h1>
        <p className="mt-1 text-sm text-royal-900/60">
          {orders.length} shown &middot; {formatNaira(revenue)} paid value in this view
        </p>
      </header>

      <section className="card p-5">
        <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-royal-900/40" />
            <input
              name="q"
              defaultValue={query}
              placeholder="Search reference, name, email or phone"
              className="input pl-9"
              aria-label="Search orders"
            />
          </div>
          <select name="status" defaultValue={status} className="input" aria-label="Filter by status">
            <option value="">Any status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")} ({countMap[s] ?? 0})
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-outline">
            Apply
          </button>
        </form>
      </section>

      {orders.length === 0 ? (
        <section className="card p-12 text-center">
          <ShoppingCart className="mx-auto h-8 w-8 text-royal-900/25" />
          <p className="mt-4 text-sm text-royal-900/55">No orders match those filters.</p>
        </section>
      ) : (
        <section className="space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="card overflow-hidden">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-royal-900/8 bg-royal-50/40 px-5 py-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/orders/${order.reference}`}
                      className="font-mono text-sm font-bold text-royal-900 hover:underline"
                    >
                      {order.reference}
                    </Link>
                    <span className={statusPill(order.status)}>{humanise(order.status)}</span>
                    {order.pricingTier === "WHOLESALE" && (
                      <span className="status-pill bg-gold-100 text-gold-800">Wholesale</span>
                    )}
                    {order.isCustomBespoke && (
                      <span className="status-pill bg-royal-900 text-gold-200">Bespoke</span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-royal-900/55">
                    {formatDateTime(order.createdAt)} &middot;{" "}
                    {order.items.reduce((s, i) => s + i.quantity, 0)} units
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-display text-2xl font-semibold text-royal-950">
                    {formatNaira(order.totalAmount)}
                  </p>
                  {order.paystackReference && (
                    <p className="mt-0.5 font-mono text-[0.65rem] text-royal-900/45">
                      {order.paystackReference}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-5 px-5 py-4 lg:grid-cols-[1fr_18rem]">
                <div className="min-w-0">
                  <p className="font-medium text-royal-950">{order.customerName}</p>
                  <p className="text-sm text-royal-900/60">
                    {order.customerEmail} &middot;{" "}
                    {formatPhoneForDisplay(order.customerPhone)}
                  </p>
                  {order.shippingLine1 && (
                    <p className="mt-1 text-sm text-royal-900/55">
                      {[order.shippingLine1, order.shippingCity, order.shippingState]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}

                  <ul className="mt-3 space-y-1.5">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex gap-2 text-sm">
                        <span className="min-w-0 flex-1 truncate text-royal-900/75">{item.name}</span>
                        <span className="shrink-0 text-royal-900/50">
                          {[item.size, item.colourway].filter(Boolean).join(" / ")} &times;{item.quantity}
                        </span>
                        <span className="shrink-0 font-medium text-royal-950">
                          {formatNaira(item.lineTotal)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  <OrderStatusSelect orderId={order.id} current={order.status} />
                  <a
                    href={waLink(
                      `Good day ${order.customerName}, this is Patience Sewing Ltd about your order ${order.reference}.`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline w-full !py-2 text-xs"
                  >
                    Message customer
                  </a>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

function statusPill(status: string): string {
  const map: Record<string, string> = {
    PENDING: "status-pill bg-amber-100 text-amber-900",
    PAID: "status-pill bg-emerald-50 text-emerald-800",
    IN_PRODUCTION: "status-pill bg-royal-100 text-royal-800",
    READY_TO_SHIP: "status-pill bg-royal-200 text-royal-900",
    SHIPPED: "status-pill bg-gold-100 text-gold-800",
    DELIVERED: "status-pill bg-emerald-100 text-emerald-900",
    CANCELLED: "status-pill bg-red-50 text-red-700",
    REFUNDED: "status-pill bg-red-100 text-red-800",
  };
  return map[status] ?? "status-pill bg-royal-50 text-royal-800";
}

function humanise(status: string): string {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^./, (c) => c.toUpperCase());
}

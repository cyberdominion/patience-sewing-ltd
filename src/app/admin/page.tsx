import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const now = new Date();

  const [revenueAgg, orderCounts, previousRevenue, lowStock, leads] = await Promise.all([
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { status: { in: ["PAID", "IN_PRODUCTION", "READY_TO_SHIP", "SHIPPED", "DELIVERED"] } },
    }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        status: { in: ["PAID", "IN_PRODUCTION", "READY_TO_SHIP", "SHIPPED", "DELIVERED"] },
        createdAt: { lt: new Date(now.getTime() - 30 * 86_400_000) },
      },
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE", stock: { lte: 8 } },
      orderBy: { stock: "asc" },
      take: 8,
    }),
    prisma.lead.groupBy({ by: ["stage"], _count: { _all: true } }),
  ]);

  const revenue = revenueAgg._sum.totalAmount ?? 0;
  const previous = previousRevenue._sum.totalAmount ?? 0;
  const growth = previous > 0 ? Math.round(((revenue - previous) / previous) * 100) : 0;

  const [pipelineAgg, pendingApps, dueFollowUps, recentOrders, topProducts] = await Promise.all([
    prisma.lead.aggregate({
      _sum: { orderValueEstimate: true },
      where: { stage: { in: ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION"] } },
    }),
    prisma.retailerApplication.count({ where: { status: "PENDING" } }),
    prisma.followUp.count({ where: { status: "PENDING" } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { items: { take: 3 } },
    }),
    prisma.orderItem.groupBy({
      by: ["productId", "name"],
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 6,
    }),
  ]);

  const leadsByStage = Object.fromEntries(leads.map((l) => [l.stage, l._count._all]));
  const ordersByStatus = Object.fromEntries(orderCounts.map((o) => [o.status, o._count._all]));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-semibold text-royal-950">Dashboard</h1>
        <p className="mt-1 text-sm text-royal-900/60">
          Revenue is counted on paid orders. Today is{" "}
          {now.toLocaleDateString("en-NG", { dateStyle: "long" })}.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue from paid orders"
          value={fmt(revenue)}
          sub={previous > 0 ? `${growth >= 0 ? "+" : ""}${growth}% vs 30 days ago` : "No prior period yet"}
          tone={growth >= 0 ? "up" : "down"}
        />
        <StatCard
          label="Open pipeline value"
          value={fmt(pipelineAgg._sum.orderValueEstimate ?? 0)}
          sub={`${(leadsByStage.NEW ?? 0) + (leadsByStage.QUALIFIED ?? 0) + (leadsByStage.PROPOSAL_SENT ?? 0) + (leadsByStage.NEGOTIATION ?? 0)} active leads`}
        />
        <StatCard
          label="Orders to fulfil"
          value={String(
            (ordersByStatus.PAID ?? 0) +
              (ordersByStatus.IN_PRODUCTION ?? 0) +
              (ordersByStatus.READY_TO_SHIP ?? 0),
          )}
          sub={`${ordersByStatus.SHIPPED ?? 0} in transit, ${ordersByStatus.DELIVERED ?? 0} delivered`}
        />
        <StatCard
          label="Pending retailer applications"
          value={String(pendingApps)}
          sub={`${dueFollowUps} follow-ups scheduled`}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-royal-950">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm font-semibold text-royal-800 underline underline-offset-4">
              View all
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="mt-6 text-sm text-royal-900/55">No orders yet.</p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[34rem] text-sm">
                <thead>
                  <tr className="border-b border-royal-900/10 text-left text-xs uppercase tracking-wider text-royal-900/45">
                    <th className="py-2 pr-4 font-semibold">Reference</th>
                    <th className="px-4 py-2 font-semibold">Customer</th>
                    <th className="px-4 py-2 font-semibold">Status</th>
                    <th className="py-2 pl-4 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-royal-900/5 last:border-0">
                      <td className="py-3 pr-4">
                        <a
                          href={`/admin/orders/${order.reference}`}
                          className="font-mono text-xs font-semibold text-royal-800 hover:underline"
                        >
                          {order.reference}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <span className="block font-medium text-royal-950">{order.customerName}</span>
                        <span className="block text-xs text-royal-900/50">
                          {order.items.length} {order.items.length === 1 ? "item" : "items"} ·{" "}
                          {order.pricingTier === "WHOLESALE" ? "Wholesale" : "Retail"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={statusClass(order.status)}>{label(order.status)}</span>
                      </td>
                      <td className="py-3 pl-4 text-right font-semibold text-royal-950">
                        {fmt(order.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card p-6">
          <h2 className="font-display text-xl font-semibold text-royal-950">Pipeline</h2>
          <ul className="mt-5 space-y-3">
            {[
              { stage: "NEW", label: "New", tone: "bg-royal-500" },
              { stage: "CONTACTED", label: "Contacted", tone: "bg-royal-600" },
              { stage: "QUALIFIED", label: "Qualified", tone: "bg-royal-700" },
              { stage: "PROPOSAL_SENT", label: "Proposal sent", tone: "bg-gold-500" },
              { stage: "NEGOTIATION", label: "Negotiation", tone: "bg-gold-600" },
              { stage: "WON", label: "Won", tone: "bg-emerald-600" },
              { stage: "LOST", label: "Lost", tone: "bg-royal-900/40" },
            ].map((row) => {
              const count = leadsByStage[row.stage] ?? 0;
              const max = Math.max(1, ...Object.values(leadsByStage));
              return (
                <li key={row.stage}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-royal-900/75">{row.label}</span>
                    <span className="font-semibold text-royal-950">{count}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-royal-100">
                    <div
                      className={`h-full rounded-full ${row.tone}`}
                      style={{ width: `${(count / max) * 100}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          <Link
            href="/admin/crm"
            className="btn btn-outline mt-6 w-full !py-2 text-sm"
          >
            Open the CRM
          </Link>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-royal-950">
              Best selling styles
            </h2>
<Link
            href="/admin/products"
            className="text-sm font-semibold text-royal-800 underline underline-offset-4"
          >
            Products
          </Link>
          </div>
          {topProducts.length === 0 ? (
            <p className="mt-6 text-sm text-royal-900/55">No sales yet.</p>
          ) : (
            <ul className="mt-5 space-y-3">
              {topProducts.map((row, i) => (
                <li key={`${row.productId}-${i}`} className="flex items-center justify-between gap-4">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-royal-950">{row.name}</span>
                    <span className="block text-xs text-royal-900/50">
                      {row._sum.quantity} units sold
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-gold-700">
                    {fmt(row._sum.lineTotal ?? 0)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-royal-950">Low stock</h2>
            <Link href="/admin/products" className="text-sm font-semibold text-royal-800 underline underline-offset-4">
              Restock
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="mt-6 text-sm text-royal-900/55">Every style is well stocked.</p>
          ) : (
            <ul className="mt-5 space-y-3">
              {lowStock.map((product) => (
                <li key={product.id} className="flex items-center justify-between gap-4">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-royal-950">
                    {product.name}
                  </span>
                  <span
                    className={`status-pill shrink-0 ${
                      product.stock === 0
                        ? "bg-red-50 text-red-700"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {product.stock} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "up" | "down";
}) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-royal-900/50">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-royal-950">{value}</p>
      <p
        className={`mt-1 text-xs ${
          tone === "up" ? "text-emerald-700" : tone === "down" ? "text-red-600" : "text-royal-900/50"
        }`}
      >
        {sub}
      </p>
    </div>
  );
}

function fmt(kobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

function label(status: string): string {
  return status.replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());
}

function statusClass(status: string): string {
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

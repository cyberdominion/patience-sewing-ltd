import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatNaira, formatDate, relativeDays } from "@/lib/money";
import { waLink } from "@/lib/whatsapp";
import { logoutAction } from "@/app/(auth)/actions";
import { CustomerNav } from "@/components/customer-nav";
import { Package, Store, CheckCircle2, Clock, Truck } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "My account",
  robots: { index: false, follow: false },
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/account");

  const { welcome } = await searchParams;

  const [orders, retailer, addresses] = await Promise.all([
    prisma.order.findMany({
      where: user.role === "ADMIN" ? {} : { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { items: { take: 4 } },
    }),
    prisma.retailerProfile.findUnique({ where: { userId: user.id } }),
    prisma.address.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
  ]);

  const spent = orders
    .filter((o) => !["CANCELLED", "PENDING"].includes(o.status))
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="container-luxe py-12">
      {welcome && (
        <div className="mb-8 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          Your account is ready. Welcome to Patience Sewing.
        </div>
      )}

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">My account</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-royal-950">
            Good day, {user.fullName.split(" ")[0]}
          </h1>
          <div className="gold-rule mt-4" />
        </div>
        <form action={logoutAction}>
          <button type="submit" className="btn btn-ghost text-sm">
            Sign out
          </button>
        </form>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[16rem_1fr]">
        <CustomerNav
          isRetailer={Boolean(retailer)}
          retailerStatus={retailer?.status ?? null}
        />

        <div className="space-y-8">
          {retailer && (
            <section className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-royal-950">
                    <Store className="h-4 w-4 text-gold-600" /> {retailer.businessName}
                  </h2>
                  <p className="mt-1 text-sm text-royal-900/60">
                    {retailer.businessType} &middot; {retailer.city}, {retailer.state}
                  </p>
                </div>
                <span
                  className={`status-pill ${
                    retailer.status === "APPROVED"
                      ? "bg-emerald-50 text-emerald-800"
                      : retailer.status === "PENDING"
                        ? "bg-amber-100 text-amber-900"
                        : "bg-red-50 text-red-700"
                  }`}
                >
                  {retailer.status === "APPROVED"
                    ? "Wholesale active"
                    : retailer.status === "PENDING"
                      ? "Awaiting approval"
                      : retailer.status}
                </span>
              </div>

              {retailer.status === "APPROVED" ? (
                <div className="mt-5 grid gap-4 border-t border-royal-900/8 pt-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-royal-900/50">Your discount</p>
                    <p className="text-2xl font-semibold text-gold-700">{retailer.discountPercent}%</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-royal-900/50">Credit limit</p>
                    <p className="text-2xl font-semibold text-royal-950">
                      {formatNaira(retailer.creditLimit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-royal-900/50">Wholesale tiers</p>
                    <p className="text-sm text-royal-900/70 mt-1.5">
                      Applied automatically per line once you meet the minimum.
                    </p>
                  </div>
                </div>
              ) : retailer.status === "PENDING" ? (
                <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm leading-relaxed text-amber-900">
                  We are reviewing your wholesale application. You will get a message on WhatsApp
                  within one working day, and your wholesale prices will appear here as soon as it is
                  approved.
                </p>
              ) : (
                <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm leading-relaxed text-red-800">
                  This account is not approved for wholesale. Message us on WhatsApp if you would
                  like to discuss it.
                </p>
              )}
            </section>
          )}

          <section>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-semibold text-royal-950">Your orders</h2>
                <p className="mt-1 text-sm text-royal-900/60">
                  {orders.length} order{orders.length === 1 ? "" : "s"} &middot;{" "}
                  {formatNaira(spent)} spent
                </p>
              </div>
              <Link href="/shop" className="btn btn-outline !py-2 text-sm">
                Shop again
              </Link>
            </div>

            {orders.length === 0 ? (
              <div className="card mt-5 p-10 text-center">
                <Package className="mx-auto h-8 w-8 text-royal-900/25" />
                <p className="mt-4 font-display text-xl font-semibold text-royal-950">
                  No orders yet
                </p>
                <p className="mt-2 text-sm text-royal-900/60">
                  When you order, you will be able to track production here.
                </p>
                <Link href="/shop" className="btn btn-primary mt-6">
                  Start shopping
                </Link>
              </div>
            ) : (
              <ul className="mt-5 space-y-3">
                {orders.map((order) => (
                  <li key={order.id}>
                    <Link
                      href={`/account/orders/${order.reference}`}
                      className="card flex flex-wrap items-center justify-between gap-4 p-5 transition-colors hover:bg-royal-50"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-royal-950">
                            {order.reference}
                          </span>
                          <span className={statusPill(order.status)}>{humanise(order.status)}</span>
                          {order.pricingTier === "WHOLESALE" && (
                            <span className="status-pill bg-gold-100 text-gold-800">Wholesale</span>
                          )}
                        </div>
                        <p className="mt-1.5 truncate text-sm text-royal-900/60">
                          {order.items
                            .map((i) => `${i.name} x${i.quantity}`)
                            .join(", ")}
                        </p>
                        <p className="mt-1 text-xs text-royal-900/45">
                          Placed {formatDate(order.createdAt)} ({relativeDays(order.createdAt)})
                        </p>
                      </div>
                      <p className="font-display text-xl font-semibold text-royal-950">
                        {formatNaira(order.totalAmount)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-royal-950">Saved addresses</h2>
            {addresses.length === 0 ? (
              <p className="mt-2 text-sm text-royal-900/60">
                No saved addresses.{" "}
                <Link href="/account/profile" className="underline underline-offset-2">
                  Add one
                </Link>{" "}
                for faster checkout.
              </p>
            ) : (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {addresses.map((address) => (
                  <li key={address.id} className="card p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-royal-900/45">
                      {address.label}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-royal-900/80">
                      {[address.line1, address.city, address.state, address.country]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <section className="mt-12 rounded-card border border-gold-300 bg-gold-50 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-royal-950">
              Need help with an order?
            </h2>
            <p className="mt-1 text-sm text-royal-900/70">
              Message us with your reference and we will pick it up from there.
            </p>
          </div>
          <a
            href={waLink("Good day Patience Sewing Ltd, I need help with my order. My reference is:")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-gold"
          >
            <Truck className="h-4 w-4" /> Message us
          </a>
        </div>
        <p className="mt-4 flex items-center gap-2 text-xs text-royal-900/60">
          <Clock className="h-3.5 w-3.5" /> We reply Monday to Saturday, 9am to 6pm.
        </p>
      </section>
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
  return status.replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());
}
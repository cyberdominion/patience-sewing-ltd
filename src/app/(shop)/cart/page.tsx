import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { formatNaira } from "@/lib/money";
import { getPricedCart } from "@/lib/cart";
import { CartTable } from "@/components/cart-table";
import { ArrowRight, Lock, Truck, Store } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const user = await getSessionUser();
  const { lines, totals, issues } = await getPricedCart(user?.id ?? null);

  if (lines.length === 0) {
    return (
      <div className="container-luxe py-20">
        <div className="mx-auto max-w-md text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-royal-50">
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-royal-900/40" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 7h12l-1 13H7L6 7zM9 7V5a3 3 0 0 1 6 0v2" />
            </svg>
          </span>
          <h1 className="mt-6 font-display text-4xl font-semibold text-royal-950">
            Your cart is empty
          </h1>
          <p className="mt-3 leading-relaxed text-royal-900/65">
            Browse the collection, or tell us what you are sewing for and we will advise you on
            WhatsApp.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/shop" className="btn btn-primary">
              Shop the collection
            </Link>
            <Link href="/bespoke" className="btn btn-outline">
              Commission bespoke
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-luxe py-12 md:py-16">
      <header>
        <p className="eyebrow">Your order</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-royal-950">Shopping cart</h1>
        <div className="gold-rule mt-4" />
      </header>

      {user?.isApprovedRetailer && (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-gold-300 bg-gold-50 px-4 py-3 text-sm">
          <Store className="h-4 w-4 text-gold-700" />
          <span>
            <span className="font-semibold">Wholesale account active.</span> Lines that meet their
            minimum quantity are priced at wholesale automatically.
          </span>
        </div>
      )}

      {issues.length > 0 && (
        <ul className="mt-6 space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          {issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <CartTable
          lines={lines}
          deliveryFee={totals?.deliveryFee ?? 0}
          freeThreshold={2_000_000}
        />

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="card p-6">
            <h2 className="font-display text-xl font-semibold text-royal-950">Order summary</h2>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-royal-900/65">
                  Subtotal ({totals?.units ?? 0} {totals?.units === 1 ? "item" : "items"})
                </dt>
                <dd className="font-medium text-royal-950">{formatNaira(totals?.subtotal ?? 0)}</dd>
              </div>

              {totals?.hasWholesaleLines && (
                <div className="flex justify-between text-xs text-royal-900/50">
                  <dt>of which wholesale lines</dt>
                  <dd>{formatNaira(totals.wholesaleSubtotal)}</dd>
                </div>
              )}

              {totals && totals.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <dt>Retailer discount</dt>
                  <dd>&minus;{formatNaira(totals.discount)}</dd>
                </div>
              )}

              <div className="flex justify-between">
                <dt className="text-royal-900/65">Delivery</dt>
                <dd className="font-medium text-royal-950">
                  {totals?.deliveryFee === 0 ? (
                    <span className="text-emerald-700">Free</span>
                  ) : (
                    formatNaira(totals?.deliveryFee ?? 0)
                  )}
                </dd>
              </div>

              <div className="flex items-baseline justify-between border-t border-royal-900/10 pt-3">
                <dt className="font-display text-lg font-semibold text-royal-950">Total</dt>
                <dd className="text-2xl font-semibold text-royal-950">
                  {formatNaira(totals?.total ?? 0)}
                </dd>
              </div>
            </dl>

            <Link href="/checkout" className="btn btn-primary mt-6 w-full !py-3">
              <Lock className="h-4 w-4" /> Proceed to secure checkout
            </Link>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-royal-900/50">
              <Truck className="h-3.5 w-3.5" />
              Free delivery on orders above NGN 20,000
            </p>

            <Link
              href="/shop"
              className="btn btn-ghost mt-3 w-full text-sm"
            >
              Continue shopping <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
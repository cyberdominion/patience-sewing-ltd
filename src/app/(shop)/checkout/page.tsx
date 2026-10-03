import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getPricedCart } from "@/lib/cart";
import { formatNaira } from "@/lib/money";
import { CheckoutForm } from "@/components/checkout-form";
import { Lock, Truck, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Secure checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const user = await getSessionUser();
  const { lines, totals } = await getPricedCart(user?.id ?? null);

  if (lines.length === 0 || !totals) {
    redirect("/cart");
  }

  const [settings, address] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: "singleton" } }),
    user
      ? prisma.address.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } })
      : Promise.resolve(null),
  ]);

  return (
    <div className="container-luxe py-12 md:py-16">
      <header className="max-w-2xl">
        <p className="eyebrow">Secure checkout</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-royal-950">
          Confirm your order
        </h1>
        <div className="gold-rule mt-4" />
        <p className="mt-5 leading-relaxed text-royal-900/70">
          We will confirm your order on WhatsApp before we start cutting. Payment is handled by
          Paystack, so your card details never touch our servers.
        </p>
      </header>

      {user?.isApprovedRetailer && (
        <div className="mt-6 rounded-xl border border-gold-300 bg-gold-50 px-4 py-3 text-sm text-royal-900">
          <span className="font-semibold">Wholesale checkout.</span>{" "}
          {totals.hasWholesaleLines
            ? "Wholesale lines are included at their minimum quantity."
            : "No line has met its minimum quantity yet, so retail pricing is applied."}
        </div>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <CheckoutForm
          defaultValues={{
            customerName: user?.fullName ?? "",
            customerEmail: user?.email ?? "",
            customerPhone: user?.businessName ? "" : "",
            shippingLine1: address?.line1 ?? "",
            shippingCity: address?.city ?? "",
            shippingState: address?.state ?? "Bayelsa",
          }}
          signedIn={Boolean(user)}
        />

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="card p-6">
            <h2 className="font-display text-xl font-semibold text-royal-950">
              Your order ({totals.units} {totals.units === 1 ? "item" : "items"})
            </h2>

            <ul className="mt-5 space-y-3 border-b border-royal-900/10 pb-5">
              {lines.map((line) => (
                <li key={`${line.productId}-${line.size}-${line.colourway}`} className="flex gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-royal-950">{line.name}</p>
                    <p className="text-xs text-royal-900/55">
                      {[line.size, line.colourway].filter(Boolean).join(" · ")} &times;{line.quantity}
                      {line.tier === "WHOLESALE" && (
                        <span className="ml-1 font-semibold text-emerald-700">wholesale</span>
                      )}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-royal-950">
                    {formatNaira(line.lineTotal)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-royal-900/65">Subtotal</dt>
                <dd className="font-medium">{formatNaira(totals.subtotal)}</dd>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <dt>Retailer discount</dt>
                  <dd>&minus;{formatNaira(totals.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-royal-900/65">Delivery</dt>
                <dd className="font-medium">
                  {totals.deliveryFee === 0 ? (
                    <span className="text-emerald-700">Free</span>
                  ) : (
                    formatNaira(totals.deliveryFee)
                  )}
                </dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-royal-900/10 pt-3">
                <dt className="font-display text-lg font-semibold text-royal-950">Total</dt>
                <dd className="text-2xl font-semibold text-royal-950">
                  {formatNaira(totals.total)}
                </dd>
              </div>
            </dl>

            <ul className="mt-6 space-y-2.5 text-xs text-royal-900/55">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-gold-600" /> Card, bank, USSD and transfer via Paystack
              </li>
              <li className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-gold-600" />
                Dispatched within 24 hours of payment
              </li>
              <li className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-gold-600" /> 256-bit encrypted payment
              </li>
            </ul>

            {settings?.bankAccountNumber && (
              <p className="mt-5 border-t border-royal-900/10 pt-4 text-xs leading-relaxed text-royal-900/55">
                Prefer bank transfer? Use {settings.bankName}, account{" "}
                {settings.bankAccountNumber} ({settings.bankAccountName}) and quote your order
                reference. We confirm by WhatsApp.
              </p>
            )}

            <Link href="/cart" className="btn btn-ghost mt-4 w-full text-sm">
              Back to cart
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
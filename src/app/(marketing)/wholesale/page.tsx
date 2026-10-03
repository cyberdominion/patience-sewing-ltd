import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/money";
import { ALL_CATEGORIES, CATEGORY_LABELS } from "@/lib/categories";
import { RetailerApplicationForm } from "@/components/retailer-application-form";
import { formatPhoneForDisplay } from "@/lib/whatsappPhone";
import { waLink } from "@/lib/whatsapp";
import {
  Check,
  Percent,
  Package,
  Truck,
  TrendingUp,
  MessageCircle,
  FileText,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Wholesale for boutiques and retailers",
  description:
    "Open a wholesale account with Patience Sewing Ltd. Wholesale unit prices, clear minimum quantities, your agreed discount applied at checkout, and nationwide delivery for your boutique.",
  alternates: { canonical: "/wholesale" },
};

export default async function WholesalePage() {
  const [settings, products] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: "singleton" } }),
    prisma.product.findMany({
      where: { status: "ACTIVE", bespoke: false },
      select: {
        id: true,
        name: true,
        category: true,
        retailPrice: true,
        wholesalePrice: true,
        wholesaleMinQty: true,
        stock: true,
      },
      orderBy: [{ category: "asc" }, { retailPrice: "asc" }],
    }),
  ]);

  const whatsapp = settings?.whatsappNumber ?? process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "2348000000000";
  const savings = products.map((p) => ({
    ...p,
    savePercent: Math.round(((p.retailPrice - p.wholesalePrice) / p.retailPrice) * 100),
    minimumValue: p.wholesalePrice * p.wholesaleMinQty,
  }));

  const avgSaving = savings.length
    ? Math.round(savings.reduce((s, p) => s + p.savePercent, 0) / savings.length)
    : 0;

  return (
    <>
      {/* hero */}
      <section className="relative overflow-hidden bg-royal-950">
        <div className="absolute inset-0 bg-gradient-to-br from-royal-900 via-royal-950 to-royal-900" />
        <div className="container-luxe relative py-20">
          <div className="max-w-3xl">
            <p className="eyebrow">Trade account</p>
            <h1 className="mt-3 font-display text-5xl font-semibold leading-tight text-white text-balance md:text-6xl">
              Wholesale prices for your boutique, without the runaround
            </h1>
            <div className="gold-rule mt-5" />
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-royal-100/85">
              Apply once. We review every application personally. Once approved you see the
              wholesale unit price and minimum quantity for every style, and your agreed discount
              is applied automatically at checkout.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#apply" className="btn btn-gold">
                Apply for wholesale
              </a>
              <a
                href={waLink(
                  "Good day Patience Sewing Ltd, I am a retailer interested in your wholesale prices. Please share your price list and the minimum order quantity.",
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="btn border border-gold-300/50 text-gold-200 hover:bg-gold-300/10"
              >
                <MessageCircle className="h-4 w-4" /> Chat about pricing
              </a>
            </div>

            <dl className="mt-12 grid gap-6 sm:grid-cols-3">
              <div>
                <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-gold-400">
                  Average saving
                </dt>
                <dd className="mt-1 font-display text-4xl font-semibold text-white">{avgSaving}%</dd>
                <dd className="text-sm text-royal-200/70">against retail</dd>
              </div>
              <div>
                <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-gold-400">
                  Lowest minimum
                </dt>
                <dd className="mt-1 font-display text-4xl font-semibold text-white">
                  {Math.min(...savings.map((s) => s.wholesaleMinQty))}
                </dd>
                <dd className="text-sm text-royal-200/70">units per style</dd>
              </div>
              <div>
                <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-gold-400">
                  Review time
                </dt>
                <dd className="mt-1 font-display text-4xl font-semibold text-white">1 day</dd>
                <dd className="text-sm text-royal-200/70">working day</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* how it works */}
      <section className="container-luxe py-20">
        <div className="text-center">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-3 font-display text-4xl font-semibold text-royal-950">
            Four steps, no paperwork
          </h2>
          <div className="gold-rule mx-auto mt-4" />
        </div>

        <ol className="mt-12 grid gap-6 md:grid-cols-4">
          {[
            {
              step: "01",
              title: "Apply",
              body: "Tell us your shop, your location and how much you typically sell. Five minutes.",
              icon: FileText,
            },
            {
              step: "02",
              title: "We review",
              body: "A real person checks your details and confirms your discount percentage.",
              icon: Check,
            },
            {
              step: "03",
              title: "Price list unlocks",
              body: "Sign in and every wholesale price, minimum quantity and margin is visible.",
              icon: Percent,
            },
            {
              step: "04",
              title: "Order and track",
              body: "Order at wholesale rates. Your discount is applied automatically at checkout.",
              icon: Package,
            },
          ].map((step) => (
            <li key={step.step} className="card p-6">
              <div className="flex items-center justify-between">
                <span className="font-display text-3xl font-semibold text-gold-400">{step.step}</span>
                <step.icon className="h-5 w-5 text-royal-900/30" />
              </div>
              <p className="mt-4 font-display text-xl font-semibold text-royal-950">{step.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-royal-900/65">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* pricing table */}
      <section id="pricing" className="bg-white py-20">
        <div className="container-luxe">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Indicative price list</p>
              <h2 className="mt-3 font-display text-4xl font-semibold text-royal-950">
                What you will pay
              </h2>
              <div className="gold-rule mt-4" />
              <p className="mt-5 max-w-2xl leading-relaxed text-royal-900/70">
                This is our published wholesale list. Your approved account shows your own agreed
                discount on top of these figures at checkout.
              </p>
            </div>
            <a href="#apply" className="btn btn-primary">
              Get these prices
            </a>
          </div>

          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[46rem] border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-royal-900/15 text-left">
                  <th className="py-3 pr-4 font-semibold text-royal-900/60">Style</th>
                  <th className="px-4 py-3 font-semibold text-royal-900/60">Category</th>
                  <th className="px-4 py-3 text-right font-semibold text-royal-900/60">Retail</th>
                  <th className="px-4 py-3 text-right font-semibold text-royal-900/60">
                    Wholesale
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-royal-900/60">Min</th>
                  <th className="py-3 pl-4 text-right font-semibold text-royal-900/60">
                    Min order value
                  </th>
                </tr>
              </thead>
              <tbody>
                {savings.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-royal-900/8 transition-colors hover:bg-royal-50/50"
                  >
                    <td className="py-3.5 pr-4 font-medium text-royal-950">{p.name}</td>
                    <td className="px-4 py-3.5 text-royal-900/60">
                      {CATEGORY_LABELS[p.category as keyof typeof CATEGORY_LABELS]}
                    </td>
                    <td className="px-4 py-3.5 text-right text-royal-900/45">
                      {formatNaira(p.retailPrice)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-gold-700">
                      {formatNaira(p.wholesalePrice)}
                      <span className="ml-1.5 text-xs font-normal text-emerald-700">
                        &minus;{p.savePercent}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right text-royal-900/60">{p.wholesaleMinQty}</td>
                    <td className="py-3.5 pl-4 text-right font-medium text-royal-950">
                      {formatNaira(p.minimumValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* terms */}
      <section id="terms" className="container-luxe py-20">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Retailer terms</p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-royal-950">
              What we ask, what we offer
            </h2>
            <div className="gold-rule mt-4" />
            <div className="mt-8 space-y-6">
              <TermsBlock
                title="What we ask of you"
                items={[
                  "Minimum order quantity per style, shown on every line before you order.",
                  "Payment in full before production starts, via Paystack or bank transfer.",
                  "48 hours to confirm the order and flag any sizing problem before we cut.",
                  "A trade account in your business name, not a personal one.",
                ]}
              />
              <TermsBlock
                title="What you get"
                items={[
                  "Wholesale unit prices with your discount applied automatically.",
                  "Bespoke commissions for your own customers at the trade rate.",
                  "First look at restocks, since many styles come back in small batches.",
                  "One named contact on WhatsApp who knows your order history.",
                ]}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <TrendingUp className="h-5 w-5 text-gold-600" />
              <p className="mt-4 font-display text-xl font-semibold text-royal-950">
                Why retailers stay
              </p>
              <p className="mt-2 text-sm leading-relaxed text-royal-900/70">
                Most of our trade customers order the same six styles every month. Because we cut in
                Bayelsa rather than importing ready-made stock, we can restock a style in ten days
                when your customers ask for a size we sold out of. That is the advantage of dealing
                with the factory rather than a market trader.
              </p>
            </div>

            <div className="card p-6">
              <Truck className="h-5 w-5 text-gold-600" />
              <p className="mt-4 font-display text-xl font-semibold text-royal-950">
                Delivery to your shop
              </p>
              <p className="mt-2 text-sm leading-relaxed text-royal-900/70">
                We deliver nationwide. Bayelsa and Rivers orders usually go out within 24 hours.
                Elsewhere we use trusted couriers and you can collect from the workshop in Yenagoa
                at no charge.
              </p>
              <p className="mt-4 text-sm text-royal-900/60">
                Questions? Call or WhatsApp{" "}
                <span className="font-semibold text-royal-950">
                  {formatPhoneForDisplay(whatsapp)}
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* application */}
      <section id="apply" className="bg-royal-950 py-20">
        <div className="container-luxe">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <p className="eyebrow">Apply</p>
              <h2 className="mt-3 font-display text-4xl font-semibold text-white">
                Open your trade account
              </h2>
              <div className="gold-rule mt-4" />
              <p className="mt-6 leading-relaxed text-royal-200/80">
                We review each application personally, usually within one working day. Tell us
                honestly what you sell and how much, and we will set a discount you can actually
                make margin on.
              </p>

              <ul className="mt-8 space-y-3 text-sm text-royal-200/80">
                {[
                  "No application fee and no commitment",
                  "You can order as many or as few styles as you like",
                  "Bespoke pieces available for your customers at trade rate",
                  "We will tell you honestly if a style will not work for your market",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
                    {line}
                  </li>
                ))}
              </ul>

              <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold text-white">Prefer to talk first?</p>
                <p className="mt-1.5 text-sm text-royal-200/75">
                  Message us on WhatsApp with your shop name and the styles you are interested in.
                </p>
                <a
                  href={waLink(
                    "Good day Patience Sewing Ltd, I am a retailer and would like to discuss wholesale prices before applying.",
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-gold mt-4 !py-2 text-sm"
                >
                  <MessageCircle className="h-4 w-4" /> Start on WhatsApp
                </a>
              </div>
            </div>

            <div className="card p-7">
              <RetailerApplicationForm categories={ALL_CATEGORIES} labels={CATEGORY_LABELS} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function TermsBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="font-display text-xl font-semibold text-royal-950">{title}</p>
      <ul className="mt-3 space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-royal-900/70">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
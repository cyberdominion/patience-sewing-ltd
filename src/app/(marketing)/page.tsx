import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/money";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/reveal";
import {
  ArrowRight,
  Scissors,
  Truck,
  Sparkles,
  Store,
  ShieldCheck,
  Ruler,
  Crown,
  Phone,
} from "lucide-react";
import { BRAND } from "@/lib/brand";
import { normalisePhone } from "@/lib/auth";

export default async function HomePage() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });

  const [featured, hero] = await Promise.all([
    prisma.product.findMany({
      where: { status: "ACTIVE", featured: true },
      include: { images: { orderBy: { position: "asc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.product.findFirst({
      where: { status: "ACTIVE" },
      include: { images: { orderBy: { position: "asc" }, take: 1 } },
      orderBy: { featured: "desc" },
    }),
  ]);

  const heroImage =
    hero?.images[0]?.url ??
    "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1800&q=80";

  const whatsapp = normalisePhone(
    settings?.whatsappNumber ?? process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "2348105756444",
  );

  return (
    <>
      {/* ---------------- hero ---------------- */}
      <section className="relative overflow-hidden bg-royal-950">
        <div className="absolute inset-0">
          <Image
            src={heroImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-royal-950 via-royal-950/90 to-royal-950/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-royal-950 via-transparent to-royal-900/40" />
        </div>

        <div className="container-luxe relative py-16 md:py-24 lg:py-28">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="max-w-2xl">
              <p className="eyebrow animate-rise">Bayelsa &middot; Nigeria &middot; Since {BRAND.foundedYear}</p>
              <h1 className="animate-rise mt-4 font-display text-5xl font-semibold leading-[1.05] text-white text-balance md:text-7xl">
                Patience Sewing is a sewing factory in Nigeria that produces garments at factory rate for retailers and wholesalers.
              </h1>
              <p className="mt-2 h-px w-24 bg-gradient-to-r from-gold-400 to-transparent" />
              <p className="animate-rise mt-6 max-w-xl text-base leading-relaxed text-royal-100/90 md:text-lg">
                Buy at retail prices, or open a wholesale account for your boutique. Every piece is
                hand-finished in our {BRAND.city} workshop, and every order is confirmed on WhatsApp
                before it goes on the cutting table.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/shop" className="btn btn-gold">
                  Shop the collection <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/wholesale" className="btn border border-gold-300/50 text-gold-200 hover:bg-gold-300/10">
                  <Store className="h-4 w-4" /> Open a wholesale account
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs text-royal-200/75">
                <span className="flex items-center gap-2">
                  <Scissors className="h-4 w-4 text-gold-400" /> Made to measure available
                </span>
                <span className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-gold-400" /> Nationwide delivery
                </span>
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-gold-400" /> Paystack secured checkout
                </span>
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="relative aspect-[3/4] w-full max-w-md lg:max-w-lg">
                <Image
                  src={heroImage}
                  alt="Patience Sewing featured piece"
                  fill
                  priority
                  sizes="(min-width: 1024px) 480px, 100vw"
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- value props ---------------- */}
      <section className="border-b border-royal-900/10 bg-white">
        <div className="container-luxe grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <ValueProp
            icon={<Crown className="h-5 w-5" />}
            title="Retail and wholesale"
            body="Retail prices for you. Verified retailers see the wholesale price list and minimums."
          />
          <ValueProp
            icon={<Ruler className="h-5 w-5" />}
            title="Bespoke commissions"
            body="Bring measurements or use our fitting session. We make a toile before we cut the final."
          />
          <ValueProp
            icon={<Sparkles className="h-5 w-5" />}
            title="Hand-beaded finish"
            body="Beadwork applied by hand in Bayelsa. This is why our lead times are honest, not fast."
          />
          <ValueProp
            icon={<Phone className="h-5 w-5" />}
            title="Human help on WhatsApp"
            body="Sizing, fabric, delivery, returns. You talk to the workshop, not a chatbot."
          />
        </div>
      </section>

      {/* ---------------- featured ---------------- */}
      <section className="container-luxe py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">The collection</p>
            <h2 className="mt-2 font-display text-4xl font-semibold text-royal-950">
              Signature pieces
            </h2>
            <div className="gold-rule mt-4" />
          </div>
          <Link href="/shop" className="btn btn-outline">
            View all pieces <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((product, i) => (
            <Reveal key={product.id} delay={i * 60}>
              <ProductCard
                product={{
                  id: product.id,
                  slug: product.slug,
                  name: product.name,
                  subtitle: product.subtitle,
                  retailPrice: product.retailPrice,
                  compareAtPrice: product.compareAtPrice,
                  wholesalePrice: product.wholesalePrice,
                  imageUrl: product.images[0]?.url ?? null,
                  colourways: product.colourways,
                  stock: product.stock,
                  featured: product.featured,
                  category: product.category,
                }}
              />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- wholesale band ---------------- */}
      <section className="bg-royal-950 py-20 text-royal-100">
        <div className="container-luxe grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow">For retailers</p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-white">
              Wholesale, without the guesswork
            </h2>
            <div className="gold-rule mt-4" />
            <p className="mt-6 max-w-lg leading-relaxed text-royal-200/85">
              Apply once and we review your shop. Approved retailers see wholesale unit prices the
              moment they sign in, see the minimum quantity for each style before they order, and
              get their agreed discount applied at checkout automatically.
            </p>
            <ul className="mt-8 space-y-3 text-sm">
              {[
                "Wholesale price list, unlocked on approval",
                "Clear minimum quantities per style, no guesswork",
                "Your discount applied automatically at checkout",
                "Order tracking and reorder history in one place",
                "Bespoke pieces available for your customers too",
              ].map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-400/20 text-gold-300">
                    <svg viewBox="0 0 20 20" className="h-3 w-3" fill="currentColor">
                      <path d="M8.5 13.5 4.5 9.5l1.4-1.4 2.6 2.6 6-6L16 6.1z" />
                    </svg>
                  </span>
                  {line}
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/wholesale" className="btn btn-gold">
                Apply for wholesale <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
                  "Good day Patience Sewing Ltd, I am a retailer interested in your wholesale prices. Please share your price list and the minimum order quantity.",
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn border border-white/20 text-white hover:bg-white/10"
              >
                Talk to us on WhatsApp
              </a>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between bg-royal-900 px-6 py-4">
                <p className="font-display text-lg font-semibold text-white">
                  Wholesale preview
                </p>
                <p className="text-xs uppercase tracking-wider text-gold-300">Example</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-royal-900/10 text-left text-xs uppercase tracking-wider text-royal-900/50">
                    <th className="px-6 py-3 font-semibold">Style</th>
                    <th className="px-4 py-3 font-semibold">Retail</th>
                    <th className="px-4 py-3 font-semibold">Wholesale</th>
                    <th className="px-6 py-3 text-right font-semibold">Min</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "Comfort Khadi Set", retail: 48_000, whole: 26_000, min: 12 },
                    { name: "Amina Lace Midi", retail: 145_000, whole: 84_000, min: 6 },
                    { name: "Yenagoa Bouye Capsule", retail: 210_000, whole: 124_000, min: 6 },
                  ].map((row) => (
                    <tr key={row.name} className="border-b border-royal-900/5 last:border-0">
                      <td className="px-6 py-3.5 font-medium text-royal-950">{row.name}</td>
                      <td className="px-4 py-3.5 text-royal-900/60 line-through">
                        {formatNaira(toK(row.retail))}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-gold-700">
                        {formatNaira(toK(row.whole))}
                      </td>
                      <td className="px-6 py-3.5 text-right text-royal-900/60">{row.min}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="px-6 py-4 text-xs leading-relaxed text-royal-900/50">
                Prices shown are indicative. Your live price list and agreed discount appear
                immediately after approval.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- bespoke ---------------- */}
      <section className="container-luxe py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <div className="relative overflow-hidden rounded-card">
              <div className="relative aspect-4/5 w-full">
                <Image
                  src="https://res.cloudinary.com/qezpmojd/image/upload/v1791037633/photo_2026-10-03_15-25-41.jpg"
                  alt="A tailor measuring fabric in the Patience Sewing workshop"
                  fill
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-royal-950/90 to-transparent p-6">
                <p className="text-sm font-semibold text-gold-200">Measurements or fitting session</p>
                <p className="mt-1 text-xs text-royal-100/80">
                  In Yenagoa, or send measurements from a tailor near you.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <p className="eyebrow">Bespoke service</p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-royal-950">
              Made to measure, from NGN 180,000
            </h2>
            <div className="gold-rule mt-4" />
            <p className="mt-6 leading-relaxed text-royal-900/75">
              Tell us the occasion. We will talk you through fabric, colour and silhouette on
              WhatsApp, take your measurements, and make a toile first so you can see the fit before
              we cut the real thing. Most bespoke pieces take two to three weeks.
            </p>
            <ol className="mt-8 space-y-4">
              {[
                { step: "01", title: "Send the brief", body: "Occasion, date, fabric preference, budget range." },
                { step: "02", title: "We advise and quote", body: "Fabric options, estimated cost, and the fitting date." },
                { step: "03", title: "Toile and approval", body: "A test garment in calico so you approve the fit first." },
                { step: "04", title: "Cut, stitch, deliver", body: "Final in your chosen fabric, hand-finished and delivered." },
              ].map((s) => (
                <li key={s.step} className="flex gap-4">
                  <span className="font-display text-2xl font-semibold text-gold-400">
                    {s.step}
                  </span>
                  <span>
                    <span className="block font-semibold text-royal-950">{s.title}</span>
                    <span className="block text-sm text-royal-900/70">{s.body}</span>
                  </span>
                </li>
              ))}
            </ol>
            <Link href="/bespoke" className="btn btn-primary mt-9">
              Start a bespoke commission <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ---------------- testimonials ---------------- */}
      <section className="bg-parchment py-20">
        <div className="container-luxe">
          <div className="text-center">
            <p className="eyebrow">What our customers say</p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-royal-950">
              Dressed by Patience Sewing
            </h2>
            <div className="gold-rule mx-auto mt-4" />
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                quote:
                  "I wore the Iwe gown to my cousin's wedding in Port Harcourt. Three people asked where I bought it before I had even sat down. The beading is genuinely hand done, you can tell.",
                name: "Adaeze O.",
                detail: "Iwe Royal Gown, Port Harcourt",
              },
              {
                quote:
                  "I run a boutique in Yenagoa and order wholesale every month. The price list is clear, the minimums are fair, and my discount is already applied when I check out. No haggling by phone.",
                name: "Bisi A.",
                detail: "Afolayan Boutique, Yenagoa",
              },
              {
                quote:
                  "The toile step is what sold me. I saw the shape before they cut the real fabric, so there were no surprises. My measurements were slightly off and they adjusted without any argument.",
                name: "Fatima S.",
                detail: "Bespoke commission",
              },
            ].map((t, i) => (
              <Reveal key={t.name} delay={i * 80}>
                <figure className="card flex h-full flex-col p-7">
                  <div className="flex gap-1 text-gold-500" aria-label="5 out of 5">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <svg key={s} viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
                        <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9z" />
                      </svg>
                    ))}
                  </div>
                  <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-royal-900/80">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-5 border-t border-royal-900/10 pt-4">
                    <span className="block font-semibold text-royal-950">{t.name}</span>
                    <span className="block text-xs text-royal-900/55">{t.detail}</span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- closing cta ---------------- */}
      <section className="bg-royal-900 py-16 text-white">
        <div className="container-luxe flex flex-wrap items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-3xl font-semibold">
              Not sure about the size or fabric?
            </h2>
            <p className="mt-2 text-royal-200/80">
              Message the workshop. We will recommend the right piece for your occasion.
            </p>
          </div>
          <a
            href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
              "Good day Patience Sewing Ltd, I need advice on a dress for an upcoming occasion.",
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-gold"
          >
            Chat on WhatsApp
          </a>
        </div>
      </section>
    </>
  );
}

function ValueProp({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div>
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-100 text-gold-700">
        {icon}
      </span>
      <p className="mt-4 font-display text-lg font-semibold text-royal-950">{title}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-royal-900/65">{body}</p>
    </div>
  );
}

function toK(naira: number) {
  return naira * 100;
}
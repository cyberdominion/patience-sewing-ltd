import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/money";
import { formatPhoneForDisplay } from "@/lib/whatsappPhone";
import { waLink } from "@/lib/whatsapp";
import { formatNaira as fmt } from "@/lib/money";
import { Ruler, Clock, Truck, MessageCircle, Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Commission a bespoke piece",
  description:
    "Commission a bespoke dress from Patience Sewing Ltd in Yenagoa, Bayelsa State. Made to measure, from NGN 180,000. Toile first, fitted properly, delivered nationwide.",
  alternates: { canonical: "/bespoke" },
};

export const dynamic = "force-dynamic";

export default async function BespokePage() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
  const whatsapp = settings?.whatsappNumber ?? process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "2348000000000";

  const inspiration = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    select: { slug: true, name: true, retailPrice: true },
    orderBy: { featured: "desc" },
    take: 6,
  });

  return (
    <>
      <section className="bg-royal-950 py-20">
        <div className="container-luxe">
          <div className="max-w-2xl">
            <p className="eyebrow">Bespoke service</p>
            <h1 className="mt-3 font-display text-5xl font-semibold leading-tight text-white text-balance md:text-6xl">
              Cut and stitched to your measurements
            </h1>
            <div className="gold-rule mt-5" />
            <p className="mt-6 text-lg leading-relaxed text-royal-100/85">
              This is the work we are proudest of. You bring the occasion and the idea. We advise on
              fabric and silhouette, make a toile so you can approve the fit, then cut the final by
              hand. Most pieces take two to three weeks.
            </p>
            <a
              href={waLink(
                "Good day Patience Sewing Ltd, I would like to commission a bespoke dress. Occasion:\nDate:\nFabric preference:\nBudget range:",
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-gold mt-9"
            >
              <MessageCircle className="h-4 w-4" /> Start your commission on WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className="container-luxe py-20">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <p className="eyebrow">The process</p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-royal-950">
              Four stages, and nothing is cut until you say yes
            </h2>
            <div className="gold-rule mt-4" />

            <ol className="mt-9 space-y-7">
              {[
                {
                  step: "01",
                  title: "You tell us the occasion",
                  body: "Date, event type, how formal, who else is dressing, and your budget range. A photo of a dress you like helps more than a description.",
                },
                {
                  step: "02",
                  title: "We advise and quote",
                  body: "We suggest fabric and silhouette, send images of similar pieces we have made, and give a firm price. No obligation at this stage.",
                },
                {
                  step: "03",
                  title: "Toile and fitting",
                  body: "We make a rough version in calico. You try it on, we adjust until the shape is right, and only then do we cut the real fabric. Fitting in Yenagoa, or send measurements from a tailor near you.",
                },
                {
                  step: "04",
                  title: "Cut, stitch, deliver",
                  body: "Final construction, hand finishing, and one fitting if it is a full gown. Delivered nationwide, or collected from the workshop.",
                },
              ].map((item) => (
                <li key={item.step} className="flex gap-5">
                  <span className="font-display text-3xl font-semibold text-gold-400">
                    {item.step}
                  </span>
                  <span>
                    <span className="block font-display text-xl font-semibold text-royal-950">
                      {item.title}
                    </span>
                    <span className="mt-1.5 block leading-relaxed text-royal-900/70">{item.body}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="font-display text-xl font-semibold text-royal-950">What it costs</h3>
              <ul className="mt-4 space-y-3 text-sm">
                {[
                  { label: "Simple crepe or shift, made to measure", price: 180_000 },
                  { label: "Lace with lining and boned bodice", price: 285_000 },
                  { label: "Full gown with hand-beaded work", price: 450_000 },
                  { label: "Traditional engagement attire with gele", price: 320_000 },
                ].map((row) => (
                  <li key={row.label} className="flex items-baseline justify-between gap-4 border-b border-royal-900/8 pb-3 last:border-0">
                    <span className="text-royal-900/75">{row.label}</span>
                    <span className="shrink-0 font-semibold text-royal-950">
                      {fmt(row.price * 100)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs leading-relaxed text-royal-900/55">
                Starting prices. Beadwork and hand embroidery are quoted separately because they
                depend on the design. Pay a 50% deposit to book your fitting date, and the balance on
                collection.
              </p>
            </div>

            <div className="card p-6">
              <h3 className="font-display text-xl font-semibold text-royal-950">
                Measurements we need
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-royal-900/70">
                If you can get these from a tailor and send them, we will save you a fitting trip.
                Anything we cannot work from, we will ask about.
              </p>
              <ul className="mt-4 grid grid-cols-2 gap-2 text-sm text-royal-900/80">
                {[
                  "Bust",
                  "Waist",
                  "Hip",
                  "Shoulder width",
                  "Nape to waist",
                  "Waist to floor",
                  "Upper arm",
                  "Height",
                ].map((m) => (
                  <li key={m} className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-gold-600" /> {m}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card border-gold-300 bg-gold-50 p-6">
              <p className="font-display text-xl font-semibold text-royal-950">
                Wedding date coming up soon?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-royal-900/75">
                Tell us the date and we will tell you honestly whether we can make it. We have said
                no before, and told the customer to start with something simpler. That conversation
                is cheaper than a rushed gown.
              </p>
              <a
                href={waLink(
                  "Good day Patience Sewing Ltd, I have a wedding on [date] and need something bespoke. Is that possible?",
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary mt-4 !py-2 text-sm"
              >
                Ask about your date
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container-luxe">
          <div className="text-center">
            <p className="eyebrow">Starting points</p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-royal-950">
              Pieces we can adapt for you
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-royal-900/70">
              Any of these can be re-cut to your measurements, in your fabric, with your colours.
              Message us with the name.
            </p>
            <div className="gold-rule mx-auto mt-4" />
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {inspiration.map((item) => (
              <Link
                key={item.slug}
                href={`/shop/${item.slug}`}
                className="card flex items-center gap-3 px-5 py-3 transition-colors hover:bg-royal-50"
              >
                <span className="text-sm font-medium text-royal-950">{item.name}</span>
                <span className="text-xs text-royal-900/50">{formatNaira(item.retailPrice)}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container-luxe py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          <Fact icon={Clock} title="2 to 3 weeks" body="Typical bespoke lead time from approved toile." />
          <Fact icon={Ruler} title="Fitting included" body="In Yenagoa, or send measurements from a tailor near you." />
          <Fact icon={Truck} title="Delivered nationwide" body="Dispatched in a garment bag, tracked to your door." />
        </div>
        <p className="mt-8 text-center text-sm text-royal-900/55">
          Questions first? Call or WhatsApp {formatPhoneForDisplay(whatsapp)}.
        </p>
      </section>
    </>
  );
}

function Fact({ icon: Icon, title, body }: { icon: typeof Clock; title: string; body: string }) {
  return (
    <div className="card p-6 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gold-100 text-gold-700">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 font-display text-lg font-semibold text-royal-950">{title}</p>
      <p className="mt-1 text-sm text-royal-900/65">{body}</p>
    </div>
  );
}
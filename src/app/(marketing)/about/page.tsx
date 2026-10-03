import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BRAND } from "@/lib/brand";
import { formatPhoneForDisplay } from "@/lib/whatsappPhone";
import { waLink } from "@/lib/whatsapp";
import {
  Scissors,
  Ruler,
  Heart,
  Users,
  MapPin,
  MessageCircle,
  Award,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Our story and workshop",
  description:
    "Patience Sewing Ltd is a bespoke Nigerian fashion house and factory in Yenagoa, Bayelsa State. Meet the team, see how we work, and find out why customers come back.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "2348000000000";

  return (
    <>
      <section className="relative overflow-hidden bg-royal-950">
        <div className="absolute inset-0">
          <Image
            src="https://res.cloudinary.com/qezpmojd/image/upload/v1791037633/photo_2026-10-03_15-25-41.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-royal-950 via-royal-950/90 to-royal-900/40" />
        </div>

        <div className="container-luxe relative py-24">
          <div className="max-w-2xl">
            <p className="eyebrow">{BRAND.city}, {BRAND.state}</p>
            <h1 className="mt-3 font-display text-5xl font-semibold leading-tight text-white text-balance md:text-6xl">
              A sewing factory in Bayelsa that treats sewing as a craft, not a market
            </h1>
            <div className="gold-rule mt-5" />
            <p className="mt-6 text-lg leading-relaxed text-royal-100/85">
              {BRAND.legalName} has been cutting, stitching and finishing Nigerian occasionwear since{" "}
              {BRAND.foundedYear}. We started with one machine and a reputation for finishing on
              time. Both have grown, but the standard has not moved.
            </p>
          </div>
        </div>
      </section>

      <section className="container-luxe py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="eyebrow">Our story</p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-royal-950">
              Started because a deadline was missed, and an occasion was ruined by it
            </h2>
            <div className="gold-rule mt-4" />
            <div className="mt-6 space-y-4 leading-relaxed text-royal-900/75">
              <p>
                Patience learned to sew in her mother&apos;s workshop in Yenagoa, cutting for
                neighbours and then for brides across Bayelsa and Rivers. What frustrated her was
                never the sewing. It was the guessing. Nobody could tell you honestly how long a
                job would take, whether the fabric would behave, or whether the seam would hold
                after the first wash.
              </p>
              <p>
                So the company was built around a simple promise: we tell you the real date, we
                use fabric we have handled before, and we check our own work before it leaves. That
                promise is why most of our business now comes from people telling other people.
              </p>
              <p>
                We are a factory, not a shop that happens to sew. That is the difference our
                wholesale customers feel: we can restock a sold-out style in ten days, because we
                still have the pattern and the fabric in {BRAND.city}.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <Stat value={`${new Date().getFullYear() - BRAND.foundedYear}+`} label="Years sewing" />
              <Stat value="200+" label="Garments delivered" />
            </div>
            <div className="space-y-4 pt-8">
              <Stat value="14 days" label="Typical lead time" />
              <Stat value="10-14" label="Restock days" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container-luxe">
          <div className="text-center">
            <p className="eyebrow">How we work</p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-royal-950">
              Four things we refuse to cut corners on
            </h2>
            <div className="gold-rule mx-auto mt-4" />
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {[
              {
                icon: Scissors,
                title: "Fabric we have tested",
                body: "We buy a small quantity and wear or wash it before we put it on a cutting table. If it behaves badly, it does not go on the price list.",
              },
              {
                icon: Ruler,
                title: "Toile before final",
                body: "Bespoke pieces are made in calico first. You approve the shape before we cut the real fabric, so a fitting is a quick check rather than a crisis.",
              },
              {
                icon: Award,
                title: "Hand beadwork, done slowly",
                body: "A heavily beaded yoke takes a full day by hand. This is why our lead times are honest rather than optimistic.",
              },
              {
                icon: Heart,
                title: "One free adjustment",
                body: "If something needs altering within seven days of delivery, we fix it at no cost. Most problems are fit, and fit is fixable.",
              },
            ].map((item) => (
              <div key={item.title} className="card p-7">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold-100 text-gold-700">
                  <item.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 font-display text-xl font-semibold text-royal-950">
                  {item.title}
                </h3>
                <p className="mt-2 leading-relaxed text-royal-900/70">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-luxe py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="relative overflow-hidden rounded-card">
            <div className="relative aspect-4/5 w-full">
              <Image
                src="https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=1200&q=80"
                alt="Hands stitching fabric in the workshop"
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>

          <div>
            <p className="eyebrow">The team</p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-royal-950">
              You will deal with people, not a ticket queue
            </h2>
            <div className="gold-rule mt-4" />
            <p className="mt-6 leading-relaxed text-royal-900/75">
              Every order is handled by one named person from the first message to the handover. For
              wholesale accounts, that person knows your order history, your customers&apos; sizes,
              and which styles actually move in your area. That continuity is why retailers stay
              with us for years rather than seasons.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                { icon: Users, title: "Nine cutters and finishers", body: "In-house, trained, and paid properly. We do not subcontract." },
                { icon: MapPin, title: "One workshop in Yenagoa", body: "Everything is cut, sewn and inspected in the same room." },
                { icon: MessageCircle, title: "Direct WhatsApp line", body: "You reach the workshop, not a call centre." },
              ].map((item) => (
                <li key={item.title} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-royal-50 text-royal-800">
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block font-semibold text-royal-950">{item.title}</span>
                    <span className="block text-sm leading-relaxed text-royal-900/70">{item.body}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/shop" className="btn btn-primary">
                See the collection
              </Link>
              <a
                href={waLink(undefined, whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
              >
                Message the workshop
              </a>
            </div>
            <p className="mt-5 text-sm text-royal-900/55">
              Workshop phone: {formatPhoneForDisplay(whatsapp)}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="card p-6 text-center">
      <p className="font-display text-3xl font-semibold text-royal-950">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.15em] text-royal-900/50">{label}</p>
    </div>
  );
}
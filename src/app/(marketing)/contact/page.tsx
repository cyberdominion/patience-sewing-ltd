import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { BRAND } from "@/lib/brand";
import { ContactForm } from "@/components/contact-form";
import { formatPhoneForDisplay } from "@/lib/whatsappPhone";
import { waLink } from "@/lib/whatsapp";
import { MessageCircle, MapPin, Clock, Phone, Mail, Package } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact and workshop location",
  description:
    "Reach Patience Sewing Ltd in Yenagoa, Bayelsa State. WhatsApp is fastest. Visit the workshop, or send an enquiry and we will advise on fabric and sizing.",
  alternates: { canonical: "/contact" },
};

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
  const whatsapp = settings?.whatsappNumber ?? process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "2348105756444";
  const email = settings?.supportEmail ?? "hello@patiencesewing.com";
  const phone = settings?.supportPhone ?? "+234 810 575 6444";

  return (
    <div className="container-luxe py-14">
      <header className="max-w-2xl">
        <p className="eyebrow">Contact</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-royal-950 md:text-5xl">
          Talk to the workshop
        </h1>
        <div className="gold-rule mt-4" />
        <p className="mt-5 leading-relaxed text-royal-900/70">
          WhatsApp is fastest and reaches the people who actually cut the garments. For sizing,
          fabric advice or a fitting, that is where the answer is.
        </p>
      </header>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          <a
            href={waLink(undefined, whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="card flex items-start gap-4 p-5 transition-colors hover:bg-royal-50"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white">
              <MessageCircle className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-display text-xl font-semibold text-royal-950">
                WhatsApp
              </span>
              <span className="mt-0.5 block text-sm text-royal-900/65">
                {formatPhoneForDisplay(whatsapp)} &mdash; fastest response
              </span>
              <span className="mt-1.5 inline-block text-sm font-semibold text-royal-800 underline underline-offset-4">
                Open a chat
              </span>
            </span>
          </a>

          <div className="card p-5">
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" />
                <span>
                  <span className="block text-sm font-semibold text-royal-950">Phone</span>
                  <a href={`tel:${phone.replace(/\s/g, "")}`} className="text-sm text-royal-900/70 hover:text-royal-800">
                    {phone}
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" />
                <span>
                  <span className="block text-sm font-semibold text-royal-950">Email</span>
                  <a href={`mailto:${email}`} className="text-sm text-royal-900/70 hover:text-royal-800">
                    {email}
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" />
                <span>
                  <span className="block text-sm font-semibold text-royal-950">Workshop</span>
                  <span className="text-sm leading-relaxed text-royal-900/70">
                    {BRAND.legalName}
                    <br />
                    {BRAND.city}, {BRAND.state}
                    <br />
                    {BRAND.country} &mdash; {BRAND.rcNumber}
                  </span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" />
                <span>
                  <span className="block text-sm font-semibold text-royal-950">Opening hours</span>
                  <span className="text-sm leading-relaxed text-royal-900/70">
                    Monday to Friday, 9am to 6pm
                    <br />
                    Saturday, 10am to 4pm
                    <br />
                    Sunday, closed
                  </span>
                </span>
              </li>
            </ul>
          </div>

          <div className="relative overflow-hidden rounded-card">
            <div className="relative aspect-16/10 w-full bg-royal-50">
              <Image
                src="https://res.cloudinary.com/qezpmojd/image/upload/v1791037633/photo_2026-10-03_15-25-41.jpg"
                alt="Fabric and scissors in the Patience Sewing workshop"
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-royal-950/90 to-transparent p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-gold-200">
                <Package className="h-4 w-4" /> Visit by appointment
              </p>
              <p className="mt-1 text-xs text-royal-100/80">
                Fitting sessions for bespoke commissions run weekdays only. Message first.
              </p>
            </div>
          </div>
        </div>

        <div className="card p-7">
          <h2 className="font-display text-2xl font-semibold text-royal-950">Send a message</h2>
          <p className="mt-1.5 text-sm text-royal-900/60">
            Goes straight into our sales pipeline, so nothing is lost in a phone call.
          </p>
          <div className="mt-6">
            <ContactForm />
          </div>
        </div>
      </div>

      <section className="mt-16 grid gap-6 border-t border-royal-900/10 pt-12 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            href: "/shop",
            title: "Looking for a specific piece?",
            body: "Every style in the collection is listed with its sizes and current stock.",
          },
          {
            href: "/bespoke",
            title: "Commission something bespoke",
            body: "Tell us the occasion and we will advise on fabric, silhouette and timeline.",
          },
          {
            href: "/wholesale",
            title: "Buying for a boutique?",
            body: "Apply for wholesale and see unit prices with your discount applied at checkout.",
          },
          {
            href: "/returns",
            title: "Exchange or adjustment?",
            body: "We offer one free adjustment within seven days of delivery.",
          },
        ].map((link) => (
          <Link key={link.href} href={link.href} className="group">
            <p className="font-display text-lg font-semibold text-royal-950 group-hover:text-royal-700">
              {link.title}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-royal-900/65">{link.body}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
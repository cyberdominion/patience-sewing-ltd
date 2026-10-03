import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { normalisePhone } from "@/lib/auth";
import { BRAND } from "@/lib/brand";
import { NewsletterForm } from "./newsletter-form";
import { MapPin, Phone, Mail, ShieldCheck, Truck, Scissors, AtSign, Camera } from "lucide-react";

export async function SiteFooter() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
  const whatsapp = normalisePhone(
    settings?.whatsappNumber ?? process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "2348105756444",
  );
  const email = settings?.supportEmail ?? "hello@patiencesewing.com";
  const phone = settings?.supportPhone ?? "+234 810 575 6444";

  return (
    <footer className="mt-24 bg-royal-950 text-royal-100">
      <div className="border-b border-white/10 bg-royal-900/60">
        <div className="container-luxe grid gap-6 py-10 sm:grid-cols-3">
          <TrustTile
            icon={<Scissors className="h-5 w-5" />}
            title="Hand-finished in Yenagoa"
            body="Every garment is cut, sewn and inspected in our Bayelsa workshop before it leaves us."
          />
          <TrustTile
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Paystack secured"
            body="Card, bank, USSD and transfer payments processed by Paystack. Your card details never touch our servers."
          />
          <TrustTile
            icon={<Truck className="h-5 w-5" />}
            title="Nationwide delivery"
            body="Dispatched within 24 hours of payment. Free delivery on orders above NGN 20,000."
          />
        </div>
      </div>

      <div className="container-luxe grid gap-12 py-16 md:grid-cols-4">
        <div>
          <p className="font-display text-2xl font-semibold text-white">Patience Sewing</p>
          <p className="mt-1 text-xs uppercase tracking-[0.28em] text-gold-400">Ltd &middot; Est. {BRAND.foundedYear}</p>
          <p className="mt-5 text-sm leading-relaxed text-royal-200/80">{settings?.tagline ?? BRAND.tagline}</p>
          <div className="mt-6 flex gap-3">
            {settings?.instagramHandle && (
              <a
                href={`https://instagram.com/${settings.instagramHandle.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-royal-100 transition-colors hover:border-gold-400 hover:text-gold-300"
                aria-label="Instagram"
              >
                <Camera className="h-4 w-4" />
              </a>
            )}
            {settings?.facebookUrl && (
              <a
                href={settings.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-royal-100 transition-colors hover:border-gold-400 hover:text-gold-300"
                aria-label="Facebook"
              >
                <AtSign className="h-4 w-4" />
              </a>
            )}
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-royal-100 transition-colors hover:border-gold-400 hover:text-gold-300"
              aria-label="WhatsApp"
            >
              <Phone className="h-4 w-4" />
            </a>
          </div>
        </div>

        <FooterCol
          title="Shop"
          links={[
            { href: "/shop", label: "All pieces" },
            { href: "/shop?category=DRESSES", label: "Dresses" },
            { href: "/shop?category=TWO_PIECE", label: "Two-piece sets" },
            { href: "/shop?category=THREE_PIECE", label: "Three-piece" },
            { href: "/shop?category=CAPSULES", label: "Capsules" },
            { href: "/shop?sort=newest", label: "New arrivals" },
          ]}
        />

        <FooterCol
          title="Trade"
          links={[
            { href: "/wholesale", label: "Open a wholesale account" },
            { href: "/wholesale#pricing", label: "Wholesale pricing" },
            { href: "/wholesale#terms", label: "Retailer terms" },
            { href: "/shop?category=CUSTOM_BESPOKE", label: "Commission bespoke" },
            { href: "/account", label: "Track my order" },
            { href: "/returns", label: "Returns & exchanges" },
          ]}
        />

        <div>
          <p className="font-display text-lg font-semibold text-white">Stay in the loop</p>
          <p className="mt-2 text-sm text-royal-200/80">
            New arrivals and discount days, straight to your inbox. No noise.
          </p>
          <NewsletterForm className="mt-5" />
          <div className="mt-6 space-y-2 text-sm text-royal-200/80">
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
              <span>
                {BRAND.legalName}, {BRAND.city}, {BRAND.state}, {BRAND.country}
                <br />
                {BRAND.rcNumber}
              </span>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-gold-400" /> {email}
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-gold-400" /> {phone}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-luxe flex flex-col items-center justify-between gap-3 py-6 text-xs text-royal-200/60 sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} {BRAND.legalName}. All rights reserved.
          </p>
          <p className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-gold-300">
              Privacy policy
            </Link>
            <Link href="/terms" className="hover:text-gold-300">
              Terms of sale
            </Link>
            <span>Payments by Paystack</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

function TrustTile({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-400/15 text-gold-300">
        {icon}
      </span>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-royal-200/75">{body}</p>
      </div>
    </div>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="font-display text-lg font-semibold text-white">{title}</p>
      <ul className="mt-4 space-y-2.5 text-sm text-royal-200/80">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link href={l.href} className="transition-colors hover:text-gold-300">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
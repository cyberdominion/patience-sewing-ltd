import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { waLink } from "@/lib/whatsapp";

export default function NotFound() {
  return (
    <div className="container-luxe py-24">
      <div className="mx-auto max-w-lg text-center">
        <p className="font-display text-7xl font-semibold text-gold-400">404</p>
        <h1 className="mt-4 font-display text-4xl font-semibold text-royal-950">
          We could not find that page
        </h1>
        <div className="gold-rule mx-auto mt-4" />
        <p className="mt-5 leading-relaxed text-royal-900/70">
          The link may be old, or the piece may have sold out and been archived. Try the collection,
          or tell us what you were looking for.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/shop" className="btn btn-primary">
            Shop the collection
          </Link>
          <a
            href={waLink("Good day Patience Sewing Ltd, I could not find a page on your website.")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
          >
            Ask on WhatsApp
          </a>
        </div>
        <p className="mt-10 text-xs text-royal-900/45">
          {BRAND.legalName} &middot; {BRAND.city}, {BRAND.state}
        </p>
      </div>
    </div>
  );
}
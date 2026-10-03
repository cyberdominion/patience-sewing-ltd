import Link from "next/link";
import Image from "next/image";
import { getSessionUser } from "@/lib/auth";
import { getCartCount } from "@/lib/cart";
import { prisma } from "@/lib/prisma";
import { normalisePhone } from "@/lib/auth";
import { SiteHeaderClient } from "./site-header-client";
import { BRAND } from "@/lib/brand";

export async function SiteHeader() {
  const [user, cartCount, settings] = await Promise.all([
    getSessionUser(),
    getCartCount(),
    prisma.siteSettings.findUnique({ where: { id: "singleton" } }),
  ]);

  const whatsapp = normalisePhone(
    settings?.whatsappNumber ?? process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "2348000000000",
  );

  return (
    <header className="sticky top-0 z-50 border-b border-royal-900/10 bg-white/90 backdrop-blur-md">
      <div className="hidden bg-royal-950 py-2 text-[0.7rem] tracking-wide text-royal-100 md:block">
        <div className="container-luxe flex items-center justify-between">
          <p>
            Bespoke Nigerian occasionwear, hand-cut in Yenagoa, Bayelsa State. Nationwide delivery.
          </p>
          <p className="text-gold-300">
            Wholesale accounts open &mdash;{" "}
            <Link href="/wholesale" className="underline underline-offset-4 hover:text-gold-200">
              apply here
            </Link>
          </p>
        </div>
      </div>

      <div className="container-luxe flex h-18 items-center justify-between gap-4 py-3">
        <Link href="/" className="group flex items-center gap-3" aria-label={`${BRAND.name} home`}>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_0_0_1px_rgba(212,154,36,0.45)]">
            <Image src="/logo.png" alt={BRAND.name} width={36} height={36} className="object-contain" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-xl font-semibold tracking-tight text-royal-950">
              Patience Sewing
            </span>
            <span className="block text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-gold-600">
              Ltd &middot; Yenagoa
            </span>
          </span>
        </Link>

        <SiteHeaderClient
          cartCount={cartCount}
          whatsappNumber={whatsapp}
          isApprovedRetailer={user?.isApprovedRetailer ?? false}
          user={
            user
              ? {
                  fullName: user.fullName,
                  role: user.role,
                  isApprovedRetailer: user.isApprovedRetailer,
                }
              : null
          }
        />
      </div>
    </header>
  );
}
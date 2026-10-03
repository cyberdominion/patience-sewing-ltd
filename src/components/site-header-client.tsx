"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, ShoppingBag, X, User, ChevronDown, LayoutDashboard } from "lucide-react";
import { useCartCount } from "./cart-count-provider";
import { waLink } from "@/lib/whatsapp";

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/shop?category=CUSTOM_BESPOKE", label: "Bespoke" },
  { href: "/wholesale", label: "Wholesale" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

type Props = {
  cartCount: number;
  whatsappNumber: string;
  isApprovedRetailer: boolean;
  user: { fullName: string; role: string; isApprovedRetailer: boolean } | null;
};

export function SiteHeaderClient({ cartCount, whatsappNumber, user }: Props) {
  const [open, setOpen] = useState(false);
  const { count } = useCartCount();
  const items = cartCount || count;

  return (
    <>
      <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-sm font-medium text-royal-900/80 transition-colors hover:text-gold-600"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <a
          href={waLink("Good day Patience Sewing Ltd, I have an enquiry.", whatsappNumber)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline hidden !px-4 !py-2 lg:inline-flex"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          WhatsApp us
        </a>

        <Link
          href="/cart"
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-royal-900 transition-colors hover:bg-royal-50"
          aria-label={`Cart, ${items} items`}
        >
          <ShoppingBag className="h-5 w-5" />
          {items > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-500 px-1 text-[0.65rem] font-bold text-royal-950">
              {items}
            </span>
          )}
        </Link>

        {user ? (
          <div className="hidden md:block">
            <ProfileDropdown user={user} />
          </div>
        ) : (
          <Link href="/login" className="btn btn-primary hidden !py-2 md:inline-flex">
            Sign in
          </Link>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-royal-900 md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="absolute inset-x-0 top-full border-b border-royal-900/10 bg-white px-4 py-4 shadow-lg md:hidden">
          <nav className="flex flex-col" aria-label="Mobile">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-royal-900/5 py-3 font-medium text-royal-950"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-2">
              <a
                href={waLink("Good day Patience Sewing Ltd, I have an enquiry.", whatsappNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline w-full"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> WhatsApp us
              </a>
              {user ? (
                <>
                  <Link href="/account" className="btn btn-outline w-full" onClick={() => setOpen(false)}>
                    My orders
                  </Link>
                  {user.role === "ADMIN" && (
                    <Link href="/admin" className="btn btn-primary w-full" onClick={() => setOpen(false)}>
                      Admin panel
                    </Link>
                  )}
                </>
              ) : (
                <Link href="/login" className="btn btn-primary w-full" onClick={() => setOpen(false)}>
                  Sign in
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

function ProfileDropdown({ user }: { user: { fullName: string; role: string; isApprovedRetailer: boolean } }) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex cursor-pointer items-center gap-2 rounded-full border border-royal-900/15 px-3 py-2 text-sm font-medium text-royal-900 hover:bg-royal-50"
        aria-expanded={open}
      >
        <User className="h-4 w-4" />
        <span className="max-w-24 truncate">{user.fullName.split(" ")[0]}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-royal-900/10 bg-white shadow-xl">
          <div className="border-b border-royal-900/10 px-4 py-3">
            <p className="text-sm font-semibold text-royal-950">{user.fullName}</p>
            <p className="text-xs text-royal-900/60">
              {user.isApprovedRetailer ? "Wholesale account" : "Customer account"}
            </p>
          </div>
          <div className="py-1">
            <Link href="/account" className="block px-4 py-2 text-sm hover:bg-royal-50" onClick={() => setOpen(false)}>
              My orders
            </Link>
            <Link href="/account/profile" className="block px-4 py-2 text-sm hover:bg-royal-50" onClick={() => setOpen(false)}>
              Profile &amp; addresses
            </Link>
            {user.role === "ADMIN" && (
              <Link
                href="/admin"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gold-700 hover:bg-royal-50"
                onClick={() => setOpen(false)}
              >
                <LayoutDashboard className="h-4 w-4" /> Admin panel
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
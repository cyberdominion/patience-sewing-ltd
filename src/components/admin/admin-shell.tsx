"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Store,
  Users,
  Star,
  Inbox,
  Settings,
  Menu,
  X,
  ExternalLink,
  LogOut,
  Share2,
} from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, badge: null },
  { href: "/admin/products", label: "Products", icon: Package, badge: "lowStock" as const },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, badge: null },
  { href: "/admin/retailers", label: "Retailers", icon: Store, badge: "pendingRetailers" as const },
  { href: "/admin/crm", label: "CRM & leads", icon: Users, badge: "openLeads" as const },
  { href: "/admin/campaigns", label: "Campaigns", icon: Share2, badge: null },
  { href: "/admin/follow-ups", label: "Follow-ups", icon: Inbox, badge: "dueFollowUps" as const },
  { href: "/admin/reviews", label: "Reviews", icon: Star, badge: null },
  { href: "/admin/inbox", label: "Messages", icon: Inbox, badge: null },
  { href: "/admin/settings", label: "Settings", icon: Settings, badge: null },
];

type Badges = {
  pendingRetailers: number;
  dueFollowUps: number;
  lowStock: number;
  openLeads: number;
};

export function AdminShell({
  children,
  user,
  badges,
}: {
  children: React.ReactNode;
  user: { fullName: string; email: string };
  badges: Badges;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="space-y-0.5" aria-label="Admin">
      {NAV.map((item) => {
        const active =
          item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        const count = item.badge ? badges[item.badge] : 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
              active
                ? "bg-royal-800 font-semibold text-white"
                : "text-royal-100/70 hover:bg-royal-900 hover:text-white"
            }`}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {count > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-500 px-1.5 text-[0.65rem] font-bold text-royal-950">
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-parchment">
      {/* desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-royal-950 lg:flex lg:sticky lg:top-0 lg:h-screen">
        <div className="border-b border-white/10 px-5 py-5">
          <p className="font-display text-lg font-semibold text-white">Patience Sewing</p>
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-gold-400">
            Admin panel
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">{nav}</div>

        <div className="border-t border-white/10 px-3 py-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-royal-100/70 hover:bg-royal-900 hover:text-white"
          >
            <ExternalLink className="h-4 w-4" /> View storefront
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-royal-100/70 hover:bg-royal-900 hover:text-white"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </form>
          <div className="mt-3 border-t border-white/10 px-3 pt-3">
            <p className="truncate text-sm font-medium text-white">{user.fullName}</p>
            <p className="truncate text-xs text-royal-200/50">{user.email}</p>
          </div>
        </div>
      </aside>

      {/* mobile header */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-royal-900/10 bg-white px-4 py-3 lg:hidden">
          <p className="font-display text-lg font-semibold text-royal-950">Admin</p>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-royal-900"
            aria-label={open ? "Close admin menu" : "Open admin menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {open && (
          <div className="bg-royal-950 px-3 py-4 lg:hidden">
            {nav}
            <div className="mt-3 border-t border-white/10 pt-3">
              <Link
                href="/"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-royal-100/70"
              >
                <ExternalLink className="h-4 w-4" /> View storefront
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-royal-100/70"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </form>
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
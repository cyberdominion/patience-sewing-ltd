"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, User, Store, LogOut, ShoppingBag } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";

export function CustomerNav({
  isRetailer,
  retailerStatus,
}: {
  isRetailer: boolean;
  retailerStatus: string | null;
}) {
  const pathname = usePathname();

  const links = [
    { href: "/account", label: "Orders", icon: Package, exact: true },
    { href: "/account/profile", label: "Profile", icon: User },
    { href: "/cart", label: "Cart", icon: ShoppingBag },
  ];

  return (
    <aside className="lg:sticky lg:top-28 lg:self-start">
      <nav className="card p-2">
        {links.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-royal-900 font-semibold text-white"
                  : "text-royal-900/75 hover:bg-royal-50"
              }`}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}

        {isRetailer && (
          <Link
            href="/wholesale#pricing"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-royal-900/75 hover:bg-royal-50"
          >
            <Store className="h-4 w-4" />
            Price list
            {retailerStatus === "PENDING" && (
              <span className="ml-auto status-pill bg-amber-100 text-amber-900">pending</span>
            )}
          </Link>
        )}

        <form action={logoutAction} className="mt-1 border-t border-royal-900/8 pt-1">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-royal-900/70 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </form>
      </nav>
    </aside>
  );
}
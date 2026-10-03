"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import type { CategoryFilter } from "@/lib/categories";

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

export function ShopFilters({
  categories,
  activeCategory,
  sort,
  query,
  total,
}: {
  categories: Record<string, string>;
  activeCategory: CategoryFilter | null;
  sort: string;
  query: string;
  total: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(query);
  const [mobileOpen, setMobileOpen] = useState(false);

  const push = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      startTransition(() => {
        router.push(`/shop${next.toString() ? `?${next.toString()}` : ""}`, { scroll: false });
      });
    },
    [params, router],
  );

  const filterPanel = (
    <div className="space-y-8">
      <div>
        <p className="label">Search</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            push({ q: search || null });
          }}
          className="relative"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-royal-900/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="lace, aso-oke, senator"
            className="input pl-9"
            aria-label="Search products"
          />
        </form>
      </div>

      <div>
        <p className="label">Category</p>
        <ul className="space-y-1">
          <li>
            <button
              type="button"
              onClick={() => push({ category: null })}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                !activeCategory
                  ? "bg-royal-900 font-semibold text-white"
                  : "text-royal-900/75 hover:bg-royal-50"
              }`}
            >
              All pieces
            </button>
          </li>
          {Object.entries(categories).map(([key, label]) => (
            <li key={key}>
              <button
                type="button"
                onClick={() => push({ category: key })}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  activeCategory === key
                    ? "bg-royal-900 font-semibold text-white"
                    : "text-royal-900/75 hover:bg-royal-50"
                }`}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="label">Sort by</p>
        <ul className="space-y-1">
          {SORTS.map((s) => (
            <li key={s.value}>
              <button
                type="button"
                onClick={() => push({ sort: s.value === "featured" ? null : s.value })}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  sort === s.value
                    ? "font-semibold text-gold-700"
                    : "text-royal-900/75 hover:bg-royal-50"
                }`}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {(activeCategory || query) && (
        <button
          type="button"
          onClick={() => {
            setSearch("");
            startTransition(() => router.push("/shop", { scroll: false }));
          }}
          className="btn btn-ghost !px-0 text-sm"
        >
          <X className="h-3.5 w-3.5" /> Clear filters
        </button>
      )}

      <Link href="/wholesale" className="card block p-4 transition-colors hover:bg-royal-50">
        <p className="font-display text-base font-semibold text-royal-950">
          Buying for a boutique?
        </p>
        <p className="mt-1 text-xs leading-relaxed text-royal-900/60">
          Apply for wholesale and see unit prices and minimums.
        </p>
      </Link>
    </div>
  );

  return (
    <>
      <div className="hidden lg:block">
        <div className={pending ? "opacity-60 transition-opacity" : "transition-opacity"}>
          {filterPanel}
        </div>
      </div>

      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="btn btn-outline w-full"
        >
          {mobileOpen ? "Hide filters" : `Filters &amp; sort (${total})`}
        </button>
        {mobileOpen && (
          <div className="card mt-4 p-5">
            {filterPanel}
          </div>
        )}
      </div>
    </>
  );
}
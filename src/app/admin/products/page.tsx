import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatNaira, formatDate } from "@/lib/money";
import { CATEGORY_LABELS, ALL_CATEGORIES } from "@/lib/categories";
import { ProductForm } from "@/components/admin/product-form";
import { ProductRowActions } from "@/components/admin/product-row-actions";
import { Search, Package, Plus, Star } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Products" };

type SearchParams = Promise<{ q?: string; category?: string; status?: string; edit?: string }>;

export default async function AdminProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const category = params.category ?? "";
  const status = params.status ?? "";

  const [products, total, activeCount, draftCount, editing] = await Promise.all([
    prisma.product.findMany({
      where: {
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" as const } },
                { styleCode: { contains: query, mode: "insensitive" as const } },
              ],
            }
          : {}),
        ...(category ? { category: category as never } : {}),
        ...(status ? { status: status as never } : {}),
      },
      include: { images: { orderBy: { position: "asc" }, take: 1 } },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    prisma.product.count(),
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.product.count({ where: { status: "DRAFT" } }),
    params.edit
      ? prisma.product.findUnique({
          where: { id: params.edit },
          include: { images: { orderBy: { position: "asc" } } },
        })
      : Promise.resolve(null),
  ]);

  const lowStock = products.filter((p) => p.status === "ACTIVE" && p.stock <= 5).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-royal-950">Products</h1>
          <p className="mt-1 text-sm text-royal-900/60">
            {total} total &middot; {activeCount} live &middot; {draftCount} draft
            {lowStock > 0 && <span className="text-amber-700"> &middot; {lowStock} low on stock</span>}
          </p>
        </div>
        <a href="#new" className="btn btn-primary">
          <Plus className="h-4 w-4" /> New product
        </a>
      </header>

      {/* editor */}
      <section
        id={editing ? "edit" : "new"}
        className="card p-6 scroll-mt-20"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-royal-950">
            {editing ? `Editing: ${editing.name}` : "Add a new product"}
          </h2>
          {editing && (
            <Link href="/admin/products" className="text-sm font-semibold text-royal-800 underline underline-offset-4">
              Cancel edit
            </Link>
          )}
        </div>

        <ProductForm
          key={editing?.id ?? "new"}
          categories={ALL_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))}
          product={
            editing
              ? {
                  id: editing.id,
                  name: editing.name,
                  slug: editing.slug,
                  subtitle: editing.subtitle,
                  description: editing.description,
                  category: editing.category,
                  fabric: editing.fabric,
                  colourways: editing.colourways,
                  sizes: editing.sizes,
                  styleCode: editing.styleCode,
                  bespoke: editing.bespoke,
                  retailPrice: editing.retailPrice / 100,
                  wholesalePrice: editing.wholesalePrice / 100,
                  wholesaleMinQty: editing.wholesaleMinQty,
                  compareAtPrice: editing.compareAtPrice ? editing.compareAtPrice / 100 : null,
                  stock: editing.stock,
                  lowStockAlert: editing.lowStockAlert,
                  leadTimeDays: editing.leadTimeDays,
                  images: editing.images.map((i) => i.url),
                  status: editing.status,
                  featured: editing.featured,
                  tags: editing.tags,
                  seoTitle: editing.seoTitle,
                  seoDescription: editing.seoDescription,
                }
              : null
          }
        />
      </section>

      {/* filters */}
      <section className="card p-5">
        <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-royal-900/40" />
            <input
              name="q"
              defaultValue={query}
              placeholder="Search name or style code"
              className="input pl-9"
              aria-label="Search products"
            />
          </div>
          <select name="category" defaultValue={category} className="input" aria-label="Filter by category">
            <option value="">All categories</option>
            {ALL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          <select name="status" defaultValue={status} className="input" aria-label="Filter by status">
            <option value="">Any status</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <button type="submit" className="btn btn-outline">
            Apply filters
          </button>
        </form>
      </section>

      {/* table */}
      <section className="card overflow-hidden">
        {products.length === 0 ? (
          <p className="p-10 text-center text-sm text-royal-900/55">
            No products match those filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-sm">
              <thead>
                <tr className="border-b border-royal-900/10 bg-royal-50/60 text-left text-xs uppercase tracking-wider text-royal-900/55">
                  <th className="py-3 pl-5 pr-3 font-semibold">Product</th>
                  <th className="px-3 py-3 font-semibold">Retail</th>
                  <th className="px-3 py-3 font-semibold">Wholesale</th>
                  <th className="px-3 py-3 font-semibold">Min</th>
                  <th className="px-3 py-3 font-semibold">Stock</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="py-3 pl-3 pr-5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const margin = product.retailPrice
                    ? Math.round(
                        ((product.retailPrice - product.wholesalePrice) / product.retailPrice) * 100,
                      )
                    : 0;

                  return (
                    <tr key={product.id} className="border-b border-royal-900/5 hover:bg-royal-50/40">
                      <td className="py-3 pl-5 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded bg-royal-50">
                            {product.images[0] ? (
                              <Image
                                src={product.images[0].url}
                                alt=""
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            ) : (
                              <span className="flex h-full items-center justify-center text-royal-900/30">
                                <Package className="h-4 w-4" />
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5 truncate font-medium text-royal-950">
                              {product.featured && <Star className="h-3 w-3 fill-gold-500 text-gold-500" />}
                              {product.name}
                            </p>
                            <p className="truncate text-xs text-royal-900/50">
                              {product.styleCode ?? product.slug} &middot;{" "}
                              {CATEGORY_LABELS[product.category as keyof typeof CATEGORY_LABELS]}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-medium text-royal-950">
                        {formatNaira(product.retailPrice)}
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-medium text-gold-700">{formatNaira(product.wholesalePrice)}</span>
                        <span className="block text-xs text-royal-900/45">{margin}% margin</span>
                      </td>
                      <td className="px-3 py-3 text-royal-900/65">{product.wholesaleMinQty}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`status-pill ${
                            product.stock === 0
                              ? "bg-red-50 text-red-700"
                              : product.stock <= 5
                                ? "bg-amber-100 text-amber-900"
                                : "bg-emerald-50 text-emerald-800"
                          }`}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`status-pill ${
                            product.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-800"
                              : product.status === "DRAFT"
                                ? "bg-amber-100 text-amber-900"
                                : "bg-royal-100 text-royal-700"
                          }`}
                        >
                          {product.status}
                        </span>
                      </td>
                      <td className="py-3 pl-3 pr-5">
                        <ProductRowActions
                          productId={product.id}
                          slug={product.slug}
                          name={product.name}
                          status={product.status}
                          featured={product.featured}
                          stock={product.stock}
                          updatedAt={formatDate(product.updatedAt)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
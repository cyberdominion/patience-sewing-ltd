import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product-card";
import { getSessionUser } from "@/lib/auth";
import { Reveal } from "@/components/reveal";
import Link from "next/link";
import { SlidersHorizontal, Store } from "lucide-react";
import { CATEGORY_LABELS, type CategoryFilter } from "@/lib/categories";
import { ShopFilters } from "@/components/shop-filters";

export const dynamic = "force-dynamic";

type SearchParams = {
  category?: string;
  sort?: string;
  q?: string;
  max?: string;
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const user = await getSessionUser();

  const category = (params.category && CATEGORY_LABELS[params.category as CategoryFilter]
    ? (params.category as CategoryFilter)
    : null) as CategoryFilter | null;

  const sort = params.sort ?? "featured";
  const query = params.q?.trim() ?? "";
  const maxPrice = params.max ? Number(params.max) : null;

  const where: Prisma.ProductWhereInput = {
    status: "ACTIVE",
    ...(category ? { category } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { subtitle: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { fabric: { contains: query, mode: "insensitive" } },
            { tags: { has: query.toLowerCase() } },
          ],
        }
      : {}),
    ...(maxPrice ? { retailPrice: { lte: maxPrice } } : {}),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "price-asc"
      ? { retailPrice: "asc" }
      : sort === "price-desc"
        ? { retailPrice: "desc" }
        : sort === "newest"
          ? { createdAt: "desc" }
          : { featured: "desc" };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [orderBy, { createdAt: "desc" }],
      include: { images: { orderBy: { position: "asc" }, take: 1 } },
      take: 60,
    }),
    prisma.product.count({ where }),
  ]);

  return (
    <div className="container-luxe py-12 md:py-16">
      <header className="max-w-2xl">
        <p className="eyebrow">The collection</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-royal-950 md:text-5xl">
          {category ? CATEGORY_LABELS[category] : "Everything we make"}
        </h1>
        <div className="gold-rule mt-4" />
        <p className="mt-5 leading-relaxed text-royal-900/70">
          {category === "CUSTOM_BESPOKE"
            ? "Commission a piece cut and stitched to your measurements. Tell us the occasion and we will advise on fabric and silhouette."
            : "Every piece below is available at retail, and at wholesale for approved retailers. Prices shown are retail."}
        </p>
      </header>

      {user?.isApprovedRetailer && (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-gold-300 bg-gold-50 px-4 py-3">
          <Store className="h-4 w-4 text-gold-700" />
          <p className="text-sm text-royal-900">
            <span className="font-semibold">Wholesale account active.</span> You are seeing retail
            prices on this page. Wholesale unit prices apply automatically in your cart once a line
            reaches the minimum quantity.
          </p>
          <Link href="/account" className="ml-auto text-sm font-semibold text-royal-800 underline underline-offset-4">
            Price list
          </Link>
        </div>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-[16rem_1fr]">
        <ShopFilters categories={CATEGORY_LABELS} activeCategory={category} sort={sort} query={query} total={total} />

        <div>
          <div className="mb-5 flex items-center gap-2 text-sm text-royal-900/60">
            <SlidersHorizontal className="h-4 w-4" />
            <span>
              {total} {total === 1 ? "piece" : "pieces"}
              {query && ` matching "${query}"`}
            </span>
          </div>

          {products.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="font-display text-2xl font-semibold text-royal-950">
                Nothing matches that yet
              </p>
              <p className="mt-2 text-sm text-royal-900/60">
                Try another category, or message us and we will tell you when it is ready.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link href="/shop" className="btn btn-primary">
                  Clear filters
                </Link>
                <Link href="/bespoke" className="btn btn-outline">
                  Commission bespoke
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product, i) => (
                <Reveal key={product.id} delay={Math.min(i, 5) * 50}>
                  <ProductCard
                    product={{
                      id: product.id,
                      slug: product.slug,
                      name: product.name,
                      subtitle: product.subtitle,
                      retailPrice: product.retailPrice,
                      compareAtPrice: product.compareAtPrice,
                      wholesalePrice: product.wholesalePrice,
                      imageUrl: product.images[0]?.url ?? null,
                      colourways: product.colourways,
                      stock: product.stock,
                      featured: product.featured,
                      category: product.category,
                    }}
                  />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
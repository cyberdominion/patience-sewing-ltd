import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { formatNaira, formatDate } from "@/lib/money";
import { sortSizes } from "@/lib/categories";
import { AddToCartPanel } from "@/components/add-to-cart-panel";
import { ProductGallery } from "@/components/product-gallery";
import { Star } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { images: { orderBy: { position: "asc" }, take: 1 } },
  });
  if (!product) return { title: "Piece not found" };

  return {
    title: product.seoTitle ?? product.name,
    description: product.seoDescription ?? product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.subtitle ?? product.description.slice(0, 160),
      images: product.images[0]?.url ? [product.images[0].url] : [],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getSessionUser();

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { position: "asc" } },
      reviews: { where: { isPublished: true }, orderBy: { createdAt: "desc" }, take: 8 },
    },
  });

  if (!product || product.status === "ARCHIVED") notFound();

  const related = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      category: product.category,
      id: { not: product.id },
    },
    include: { images: { orderBy: { position: "asc" }, take: 1 } },
    take: 3,
  });

  const savings = product.compareAtPrice
    ? product.compareAtPrice - product.retailPrice
    : 0;
  const savingsPercent = savings > 0 ? Math.round((savings / product.compareAtPrice!) * 100) : 0;
  const wholesaleSavingPercent =
    product.retailPrice > 0
      ? Math.round(((product.retailPrice - product.wholesalePrice) / product.retailPrice) * 100)
      : 0;

  return (
    <div className="container-luxe py-10 md:py-14">
      <nav aria-label="Breadcrumb" className="mb-8 text-sm text-royal-900/55">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:text-royal-900">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/shop" className="hover:text-royal-900">
              Shop
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link
              href={`/shop?category=${product.category}`}
              className="hover:text-royal-900"
            >
              {product.category.replace(/_/g, " ").toLowerCase()}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="font-medium text-royal-950" aria-current="page">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery
          images={product.images.map((i) => ({ url: i.url, alt: i.alt ?? product.name }))}
          name={product.name}
        />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            {product.featured && <span className="status-pill bg-gold-100 text-gold-800">Signature</span>}
            {product.bespoke && (
              <span className="status-pill bg-royal-900 text-gold-200">Made to measure</span>
            )}
            {product.stock <= 0 ? (
              <span className="status-pill bg-red-50 text-red-700">Sold out</span>
            ) : product.stock <= 5 ? (
              <span className="status-pill bg-amber-100 text-amber-900">
                Only {product.stock} left
              </span>
            ) : (
              <span className="status-pill bg-emerald-50 text-emerald-800">In stock</span>
            )}
          </div>

          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-royal-950 md:text-5xl">
            {product.name}
          </h1>
          {product.subtitle && <p className="mt-2 text-lg text-royal-900/65">{product.subtitle}</p>}

          {product.styleCode && (
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-royal-900/40">
              Style {product.styleCode}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-semibold text-royal-950">
              {formatNaira(product.retailPrice)}
            </span>
            {savings > 0 && (
              <>
                <span className="text-lg text-royal-900/40 line-through">
                  {formatNaira(product.compareAtPrice!)}
                </span>
                <span className="status-pill bg-gold-500 text-royal-950">
                  Save {savingsPercent}%
                </span>
              </>
            )}
          </div>
          <p className="mt-1 text-sm text-royal-900/50">Retail price. Delivery calculated at checkout.</p>

          {user?.isApprovedRetailer && (
            <div className="mt-5 rounded-xl border border-gold-300 bg-gold-50 p-4">
              <p className="text-sm font-semibold text-royal-950">Your wholesale price</p>
              <p className="mt-1 text-2xl font-semibold text-gold-700">
                {formatNaira(product.wholesalePrice)}
                <span className="ml-1 text-sm font-normal text-royal-900/60">
                  per unit, min {product.wholesaleMinQty} units
                </span>
              </p>
              <p className="mt-1.5 text-xs text-royal-900/65">
                You save {wholesaleSavingPercent}% against retail. Add {product.wholesaleMinQty} or
                more and this price applies automatically in your cart.
              </p>
            </div>
          )}

          <div className="mt-7">
            <AddToCartPanel
              product={{
                id: product.id,
                name: product.name,
                slug: product.slug,
                sizes: sortSizes(product.sizes),
                colourways: product.colourways,
                stock: product.stock,
                retailPrice: product.retailPrice,
                wholesalePrice: product.wholesalePrice,
                wholesaleMinQty: product.wholesaleMinQty,
                leadTimeDays: product.leadTimeDays,
                bespoke: product.bespoke,
                imageUrl: product.images[0]?.url ?? null,
              }}
              isApprovedRetailer={user?.isApprovedRetailer ?? false}
              discountPercent={user?.discountPercent ?? 0}
            />
          </div>

          <dl className="mt-9 grid gap-x-8 gap-y-5 border-t border-royal-900/10 pt-8 sm:grid-cols-2">
            {product.fabric && (
              <div>
                <dt className="label">Fabric</dt>
                <dd className="text-sm text-royal-900/80">{product.fabric}</dd>
              </div>
            )}
            <div>
              <dt className="label">Lead time</dt>
              <dd className="text-sm text-royal-900/80">
                {product.bespoke
                  ? `${product.leadTimeDays} days, made to measure`
                  : `${product.leadTimeDays} days for made-to-order`}
              </dd>
            </div>
            <div>
              <dt className="label">Available sizes</dt>
              <dd className="text-sm text-royal-900/80">{sortSizes(product.sizes).join(" · ")}</dd>
            </div>
            <div>
              <dt className="label">Colourways</dt>
              <dd className="text-sm text-royal-900/80">
                {product.colourways.length ? product.colourways.join(" · ") : "On request"}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <section className="mt-16 grid gap-10 border-t border-royal-900/10 pt-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="font-display text-3xl font-semibold text-royal-950">
            About this piece
          </h2>
          <div className="gold-rule mt-3" />
          <div className="mt-5 space-y-4 leading-relaxed text-royal-900/75">
            {product.description.split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {product.tags.length > 0 && (
            <ul className="mt-7 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-royal-900/12 bg-white px-3 py-1 text-xs text-royal-900/60"
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8 rounded-xl border border-royal-900/10 bg-white p-5">
            <p className="font-display text-lg font-semibold text-royal-950">Care instructions</p>
            <ul className="mt-3 space-y-2 text-sm text-royal-900/70">
              <li>Dry clean only. Beaded and lace pieces must never be machine washed.</li>
              <li>Store on a padded hanger, away from direct sunlight, to protect beadwork.</li>
              <li>Steam rather than iron. Keep the iron away from beads, lace and silk.</li>
              <li>Free first adjustment within 7 days of delivery, if any.</li>
            </ul>
          </div>
        </div>

        <aside>
          <div className="card p-6">
            <h3 className="font-display text-xl font-semibold text-royal-950">
              Buying for a boutique?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-royal-900/65">
              Retailers see wholesale unit prices, minimum quantities and their agreed discount
              applied automatically at checkout.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex justify-between">
                <span className="text-royal-900/60">Wholesale price</span>
                <span className="font-semibold text-gold-700">
                  {formatNaira(product.wholesalePrice)}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-royal-900/60">Minimum order</span>
                <span className="font-semibold text-royal-950">
                  {product.wholesaleMinQty} units
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-royal-900/60">Minimum order value</span>
                <span className="font-semibold text-royal-950">
                  {formatNaira(product.wholesalePrice * product.wholesaleMinQty)}
                </span>
              </li>
            </ul>
            <Link href="/wholesale" className="btn btn-primary mt-5 w-full">
              Apply for wholesale
            </Link>
          </div>

          {product.reviews.length > 0 && (
            <div className="card mt-5 p-6">
              <h3 className="font-display text-xl font-semibold text-royal-950">
                Customer reviews
              </h3>
              <ul className="mt-4 space-y-4">
                {product.reviews.map((review) => (
                  <li key={review.id} className="border-b border-royal-900/8 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-royal-950">{review.authorName}</span>
                      <span className="flex gap-0.5 text-gold-500">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star key={i} className="h-3 w-3" fill="currentColor" />
                        ))}
                      </span>
                    </div>
                    {review.title && (
                      <p className="mt-1 text-sm font-medium text-royal-900/80">{review.title}</p>
                    )}
                    <p className="mt-1 text-sm leading-relaxed text-royal-900/65">{review.body}</p>
                    <p className="mt-1.5 text-xs text-royal-900/40">{formatDate(review.createdAt)}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </section>

      {related.length > 0 && (
        <section className="mt-16 border-t border-royal-900/10 pt-12">
          <h2 className="font-display text-3xl font-semibold text-royal-950">
            Pairs well with
          </h2>
          <div className="gold-rule mt-3" />
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <Link
                key={item.id}
                href={`/shop/${item.slug}`}
                className="group card overflow-hidden transition-transform hover:-translate-y-1"
              >
                <div className="relative aspect-4/3 overflow-hidden bg-royal-50">
                  {item.images[0] && (
                    <Image
                      src={item.images[0].url}
                      alt={item.name}
                      fill
                      sizes="(min-width: 1024px) 30vw, 90vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                </div>
                <div className="p-4">
                  <p className="font-display text-lg font-semibold text-royal-950">{item.name}</p>
                  <p className="mt-1 text-sm font-medium text-royal-800">
                    {formatNaira(item.retailPrice)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
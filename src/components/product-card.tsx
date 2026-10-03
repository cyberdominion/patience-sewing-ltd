import Image from "next/image";
import Link from "next/link";
import type { Category } from "@prisma/client";
import { formatNaira } from "@/lib/money";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  subtitle?: string | null;
  retailPrice: number;
  compareAtPrice?: number | null;
  wholesalePrice: number;
  imageUrl?: string | null;
  colourways: string[];
  stock: number;
  featured: boolean;
  category: Category;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const soldOut = product.stock <= 0;
  const lowStock = !soldOut && product.stock <= 5;
  const discounted = product.compareAtPrice && product.compareAtPrice > product.retailPrice;

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group card block overflow-hidden transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-20px_rgba(11,16,32,0.35)]"
    >
      <div className="relative aspect-3/4 w-full overflow-hidden bg-royal-50">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-royal-900/40">
            No image yet
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.featured && !soldOut && (
            <span className="status-pill bg-gold-500 text-royal-950">Signature</span>
          )}
          {soldOut && <span className="status-pill bg-royal-950 text-white">Sold out</span>}
          {lowStock && (
            <span className="status-pill bg-amber-100 text-amber-900">
              Only {product.stock} left
            </span>
          )}
        </div>

        {discounted && !soldOut && (
          <span className="status-pill absolute right-3 top-3 bg-white/95 text-royal-900">
            Save {formatNaira(product.compareAtPrice! - product.retailPrice)}
          </span>
        )}
      </div>

      <div className="p-5">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-gold-600">
          {product.category.replace(/_/g, " ").toLowerCase()}
        </p>
        <h3 className="mt-1.5 font-display text-xl font-semibold leading-snug text-royal-950 transition-colors group-hover:text-royal-700">
          {product.name}
        </h3>
        {product.subtitle && (
          <p className="mt-1 text-sm text-royal-900/60">{product.subtitle}</p>
        )}

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-lg font-semibold text-royal-950">
            {formatNaira(product.retailPrice)}
          </span>
          {discounted && (
            <span className="text-sm text-royal-900/40 line-through">
              {formatNaira(product.compareAtPrice!)}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-royal-900/50">
          Wholesale available from {formatNaira(product.wholesalePrice)}
        </p>
      </div>
    </Link>
  );
}
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/money";
import { toggleReviewPublishedAction } from "@/app/admin/actions";
import { Star, EyeOff } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reviews" };

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
    include: { product: { select: { name: true, slug: true } } },
  });

  const hidden = reviews.filter((r) => !r.isPublished).length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold text-royal-950">Customer reviews</h1>
        <p className="mt-1 text-sm text-royal-900/60">
          {reviews.length} shown &middot; {hidden} hidden from the storefront
        </p>
      </header>

      {reviews.length === 0 ? (
        <section className="card p-12 text-center">
          <p className="text-sm text-royal-900/55">No reviews yet.</p>
        </section>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <article key={review.id} className="card p-5">
              <div className="grid gap-4 lg:grid-cols-[1fr_16rem]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-royal-950">{review.authorName}</span>
                    <span className="flex gap-0.5 text-gold-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className="h-3.5 w-3.5"
                          fill={i < review.rating ? "currentColor" : "none"}
                        />
                      ))}
                    </span>
                    {!review.isPublished && (
                      <span className="status-pill bg-amber-100 text-amber-900">
                        <EyeOff className="h-3 w-3" /> hidden
                      </span>
                    )}
                  </div>
                  {review.title && (
                    <p className="mt-2 text-sm font-medium text-royal-900/85">{review.title}</p>
                  )}
                  <p className="mt-1 text-sm leading-relaxed text-royal-900/70">{review.body}</p>
                </div>

                <div className="space-y-2 border-l border-royal-900/8 pl-4">
                  <p className="text-xs text-royal-900/55">{formatDate(review.createdAt)}</p>
                  <p className="text-sm font-medium text-royal-950">{review.product.name}</p>
                  <form action={toggleReviewPublishedAction}>
                    <input type="hidden" name="reviewId" value={review.id} />
                    <button type="submit" className="btn btn-outline w-full !py-1.5 text-xs">
                      {review.isPublished ? "Hide" : "Publish"}
                    </button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
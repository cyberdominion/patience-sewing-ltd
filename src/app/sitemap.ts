import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { CATEGORY_LABELS, ALL_CATEGORIES } from "@/lib/categories";

export const dynamic = "force-dynamic";

const BASE = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await prisma.product
    .findMany({
      where: { status: "ACTIVE" },
      select: { slug: true, updatedAt: true, category: true },
    })
    .catch(() => []);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/wholesale`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/bespoke`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/contact`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/returns`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/login`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = ALL_CATEGORIES.map((category) => ({
    url: `${BASE}/shop?category=${category}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${BASE}/shop/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  void CATEGORY_LABELS;

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
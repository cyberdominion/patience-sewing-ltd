import { prisma } from "./prisma";
import { toKobo } from "./money";

export type PricingTier = "RETAIL" | "WHOLESALE";

export type PriceableProduct = {
  id: string;
  name: string;
  retailPrice: number;
  wholesalePrice: number;
  wholesaleMinQty: number;
  stock: number;
};

export type PricedLine = {
  productId: string;
  name: string;
  slug?: string;
  imageUrl?: string | null;
  stock?: number;
  quantity: number;
  size?: string | null;
  colourway?: string | null;
  unitPrice: number;
  lineTotal: number;
  tier: PricingTier;
  minimumQuantity: number;
  shortBy: number;
};

/**
 * Resolves the price a given buyer pays for a product.
 *
 * Retailers only unlock wholesale unit prices once their
 * RetailerProfile.status is APPROVED, and even then a line must reach the
 * product's wholesale minimum quantity before the wholesale rate applies.
 * Below the minimum the line is priced at retail so nobody is undercharged
 * for a short run, and `shortBy` tells the UI how many more units are needed.
 */
export function priceLine(
  product: PriceableProduct,
  quantity: number,
  opts: { isApprovedRetailer: boolean },
): PricedLine {
  const qty = Math.max(1, Math.floor(quantity));
  const qualifies = opts.isApprovedRetailer && qty >= product.wholesaleMinQty;
  const unitPrice = qualifies ? product.wholesalePrice : product.retailPrice;
  const tier: PricingTier = qualifies ? "WHOLESALE" : "RETAIL";

  return {
    productId: product.id,
    name: product.name,
    quantity: qty,
    size: null,
    colourway: null,
    unitPrice,
    lineTotal: unitPrice * qty,
    tier,
    minimumQuantity: product.wholesaleMinQty,
    shortBy: opts.isApprovedRetailer ? Math.max(0, product.wholesaleMinQty - qty) : 0,
  };
}

export function summarise(lines: PricedLine[], opts: { discountPercent: number; deliveryFee: number; freeThreshold: number }) {
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const retailSubtotal = lines
    .filter((l) => l.tier === "RETAIL")
    .reduce((sum, l) => sum + l.lineTotal, 0);
  const wholesaleSubtotal = subtotal - retailSubtotal;

  // Approved retailers get their negotiated percentage off the wholesale subtotal.
  const discount = opts.discountPercent > 0
    ? Math.round((wholesaleSubtotal * opts.discountPercent) / 100)
    : 0;

  const afterDiscount = subtotal - discount;
  const deliveryFee = afterDiscount >= opts.freeThreshold ? 0 : opts.deliveryFee;

  return {
    subtotal,
    retailSubtotal,
    wholesaleSubtotal,
    discount,
    deliveryFee,
    total: afterDiscount + deliveryFee,
    units: lines.reduce((sum, l) => sum + l.quantity, 0),
    hasWholesaleLines: wholesaleSubtotal > 0,
  };
}

export async function getBuyerPricingContext(userId?: string | null) {
  if (!userId) {
    return { isApprovedRetailer: false, discountPercent: 0, profile: null };
  }
  const profile = await prisma.retailerProfile.findUnique({
    where: { userId },
    select: { id: true, status: true, discountPercent: true, creditLimit: true, businessName: true },
  });

  const isApprovedRetailer = profile?.status === "APPROVED";
  return {
    isApprovedRetailer,
    discountPercent: isApprovedRetailer ? profile.discountPercent : 0,
    profile: profile ?? null,
  };
}

export function deliveryFeeFor(subtotalKobo: number): number {
  const threshold = toKobo(20_000);
  return subtotalKobo >= threshold ? 0 : toKobo(1_500);
}

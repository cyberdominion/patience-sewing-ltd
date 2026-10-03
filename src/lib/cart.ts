import "server-only";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { getBuyerPricingContext, priceLine, summarise, type PricedLine } from "./pricing";
import { deliveryFeeFor } from "./pricing";

const CART_COOKIE = "psl_cart";
const MAX_LINES = 40;

export type CartLine = {
  productId: string;
  quantity: number;
  size?: string;
  colourway?: string;
  notes?: string;
};

export type Cart = { lines: CartLine[] };

async function readCart(): Promise<Cart> {
  const store = await cookies();
  const raw = store.get(CART_COOKIE)?.value;
  if (!raw) return { lines: [] };

  try {
    const parsed = JSON.parse(raw) as Cart;
    if (!Array.isArray(parsed.lines)) return { lines: [] };
    return { lines: parsed.lines.slice(0, MAX_LINES) };
  } catch {
    return { lines: [] };
  }
}

export async function writeCart(cart: Cart): Promise<void> {
  const store = await cookies();
  store.set(CART_COOKIE, JSON.stringify(cart), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearCart(): Promise<void> {
  const store = await cookies();
  store.delete(CART_COOKIE);
}

export async function getCart(): Promise<Cart> {
  return readCart();
}

export async function getCartCount(): Promise<number> {
  const cart = await readCart();
  return cart.lines.reduce((sum, l) => sum + l.quantity, 0);
}

/**
 * Rebuilds the cart from the database and re-prices every line on the server.
 * The client is never trusted for price or stock: the cookie only holds
 * product ids, quantities, and options.
 */
export async function getPricedCart(userId?: string | null) {
  const cart = await readCart();
  if (cart.lines.length === 0) {
    return { lines: [] as PricedLine[], totals: null, issues: [] as string[] };
  }

  const ctx = await getBuyerPricingContext(userId);
  const products = await prisma.product.findMany({
    where: { id: { in: cart.lines.map((l) => l.productId) }, status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      slug: true,
      retailPrice: true,
      wholesalePrice: true,
      wholesaleMinQty: true,
      stock: true,
      status: true,
      images: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
    },
  });

  const byId = new Map(products.map((p) => [p.id, p]));
  const issues: string[] = [];
  const lines: PricedLine[] = [];

  for (const line of cart.lines) {
    const product = byId.get(line.productId);
    if (!product) {
      issues.push("A product in your cart is no longer available and was removed.");
      continue;
    }
    if (product.stock <= 0) {
      issues.push(`${product.name} is out of stock and was removed from your cart.`);
      continue;
    }

    const quantity = Math.min(line.quantity, product.stock);
    if (quantity !== line.quantity) {
      issues.push(`Only ${product.stock} of ${product.name} left, so quantity was reduced.`);
    }

    const priced = priceLine(product, quantity, { isApprovedRetailer: ctx.isApprovedRetailer });
    priced.size = line.size ?? null;
    priced.colourway = line.colourway ?? null;
    lines.push(priced);
  }

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const totals = summarise(lines, {
    discountPercent: ctx.discountPercent,
    deliveryFee: deliveryFeeFor(subtotal),
    freeThreshold: 2_000_000,
  });

  const enriched = lines.map((l) => ({
    ...l,
    slug: byId.get(l.productId)?.slug ?? "",
    imageUrl: byId.get(l.productId)?.images[0]?.url ?? null,
    stock: byId.get(l.productId)?.stock ?? 0,
  }));

  return { lines: enriched, totals, issues };
}

export async function addToCart(line: CartLine): Promise<Cart> {
  const cart = await readCart();
  const existing = cart.lines.find(
    (l) =>
      l.productId === line.productId &&
      (l.size ?? null) === (line.size ?? null) &&
      (l.colourway ?? null) === (line.colourway ?? null),
  );

  if (existing) {
    existing.quantity = Math.min(99, existing.quantity + line.quantity);
  } else {
    cart.lines.push({ ...line, quantity: Math.max(1, Math.min(99, line.quantity)) });
  }

  cart.lines = cart.lines.slice(0, MAX_LINES);
  await writeCart(cart);
  return cart;
}

export async function updateCartLine(
  productId: string,
  options: { size?: string | null; colourway?: string | null },
  quantity: number,
): Promise<Cart> {
  const cart = await readCart();
  const line = cart.lines.find(
    (l) =>
      l.productId === productId &&
      (l.size ?? null) === (options.size ?? null) &&
      (l.colourway ?? null) === (options.colourway ?? null),
  );

  if (!line) return cart;
  if (quantity <= 0) {
    cart.lines = cart.lines.filter((l) => l !== line);
  } else {
    line.quantity = Math.min(99, quantity);
  }

  await writeCart(cart);
  return cart;
}

export async function removeFromCart(
  productId: string,
  options: { size?: string | null; colourway?: string | null },
): Promise<Cart> {
  const cart = await readCart();
  cart.lines = cart.lines.filter(
    (l) =>
      !(
        l.productId === productId &&
        (l.size ?? null) === (options.size ?? null) &&
        (l.colourway ?? null) === (options.colourway ?? null)
      ),
  );
  await writeCart(cart);
  return cart;
}
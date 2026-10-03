"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import {
  addToCart,
  clearCart,
  removeFromCart,
  updateCartLine,
  getPricedCart,
} from "@/lib/cart";
import { addToCartSchema, updateCartSchema } from "@/lib/validation";
import { errorMessage, failure, success, type ActionState } from "@/lib/action-types";

export async function addToCartAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = addToCartSchema.safeParse({
    productId: formData.get("productId"),
    quantity: formData.get("quantity") ?? 1,
    size: formData.get("size") || undefined,
    colourway: formData.get("colourway") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return failure("Please choose a size and quantity before adding to cart.");
  }

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
    select: { id: true, name: true, stock: true, status: true },
  });

  if (!product || product.status !== "ACTIVE") {
    return failure("That piece is no longer available.");
  }
  if (product.stock <= 0) {
    return failure(`${product.name} is sold out. Message us and we can make one for you.`);
  }

  const cart = await addToCart(parsed.data);
  const total = cart.lines.reduce((sum, l) => sum + l.quantity, 0);

  revalidatePath("/cart");
  revalidatePath("/shop");

  return {
    ok: true,
    message: `${product.name} added to your cart`,
    action: { href: "/cart", label: "View cart" },
    count: total,
  };
}

export async function updateCartLineAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = updateCartSchema.safeParse({
    productId: formData.get("productId"),
    quantity: formData.get("quantity"),
    size: formData.get("size") || null,
    colourway: formData.get("colourway") || null,
  });

  if (!parsed.success) return failure("Could not update that line.");

  await updateCartLine(
    parsed.data.productId,
    {
      size: (parsed.data.size as string | null | undefined) ?? null,
      colourway: (parsed.data.colourway as string | null | undefined) ?? null,
    },
    parsed.data.quantity,
  );

  revalidatePath("/cart");
  revalidatePath("/checkout");
  return success("Cart updated");
}

export async function removeCartLineAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const productId = String(formData.get("productId") ?? "");
  if (!productId) return failure("Could not remove that item.");

  await removeFromCart(productId, {
    size: (formData.get("size") as string | null) ?? null,
    colourway: (formData.get("colourway") as string | null) ?? null,
  });

  revalidatePath("/cart");
  revalidatePath("/checkout");
  return success("Item removed");
}

export async function clearCartAction(): Promise<void> {
  await clearCart();
  revalidatePath("/cart");
  revalidatePath("/checkout");
}

export async function getCartSnapshot() {
  const user = await getSessionUser();
  try {
    return await getPricedCart(user?.id ?? null);
  } catch (error) {
    // No database configured yet (fresh clone, no DATABASE_URL). Fall back to empty.
    void error;
    return { lines: [], totals: null, issues: [] as string[] };
  }
}

export { errorMessage };
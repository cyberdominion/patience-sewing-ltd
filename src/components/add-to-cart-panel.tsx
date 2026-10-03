"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { ShoppingBag, Truck, Check, Minus, Plus, Ruler, MessageCircle } from "lucide-react";
import { addToCartAction } from "@/app/(shop)/cart/actions";
import { initialState } from "@/lib/action-types";
import { formatNaira } from "@/lib/money";
import { waLink } from "@/lib/whatsapp";

type Props = {
  product: {
    id: string;
    name: string;
    slug: string;
    sizes: string[];
    colourways: string[];
    stock: number;
    retailPrice: number;
    wholesalePrice: number;
    wholesaleMinQty: number;
    leadTimeDays: number;
    bespoke: boolean;
    imageUrl: string | null;
  };
  isApprovedRetailer: boolean;
  discountPercent: number;
};

export function AddToCartPanel({
  product,
  isApprovedRetailer,
  discountPercent,
}: Props) {
  const needsSize = product.sizes.length > 1;
  const [size, setSize] = useState(needsSize ? "" : product.sizes[0] ?? "");
  const [colourway, setColourway] = useState(product.colourways[0] ?? "");
  const [quantity, setQuantity] = useState(1);
  const [state, formAction, pending] = useActionState(addToCartAction, initialState());

  useEffect(() => {
    if (state.ok && state.message) {
      window.dispatchEvent(
        new CustomEvent("psl:toast", {
          detail: {
            message: state.message,
            tone: "success",
            href: "/cart",
            hrefLabel: "View cart",
          },
        }),
      );
      window.dispatchEvent(new CustomEvent("psl:cart-changed"));
    } else if (!state.ok && state.message) {
      window.dispatchEvent(new CustomEvent("psl:toast", { detail: { message: state.message, tone: "error" } }));
    }
  }, [state]);

  const pricing = useMemo(() => {
    const qualifies = isApprovedRetailer && quantity >= product.wholesaleMinQty;
    const unit = qualifies ? product.wholesalePrice : product.retailPrice;
    const subtotal = unit * quantity;
    const discount = qualifies && discountPercent > 0 ? Math.round((subtotal * discountPercent) / 100) : 0;
    return { qualifies, unit, subtotal, discount, total: subtotal - discount };
  }, [quantity, isApprovedRetailer, discountPercent, product]);

  const shortBy = isApprovedRetailer
    ? Math.max(0, product.wholesaleMinQty - quantity)
    : 0;

  const soldOut = product.stock <= 0;
  const maxQty = Math.max(1, Math.min(product.stock, 99));

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="productId" value={product.id} />
      <input type="hidden" name="size" value={size} />
      <input type="hidden" name="colourway" value={colourway} />

      {product.colourways.length > 0 && product.colourways[0] !== "Any" && (
        <fieldset>
          <legend className="label">
            Colourway
            {colourway && <span className="ml-2 font-normal text-royal-900/50">{colourway}</span>}
          </legend>
          <div className="flex flex-wrap gap-2">
            {product.colourways.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColourway(c)}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                  colourway === c
                    ? "border-royal-900 bg-royal-900 text-white"
                    : "border-royal-900/20 text-royal-900/75 hover:border-royal-400"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {product.sizes.length > 0 && product.sizes[0] !== "Made to measure" && (
        <fieldset>
          <legend className="label">
            Size {needsSize && !size && <span className="text-red-600">* required</span>}
          </legend>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={`min-w-14 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  size === s
                    ? "border-royal-900 bg-royal-900 text-white"
                    : "border-royal-900/20 text-royal-900/75 hover:border-royal-400"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="mt-2.5 flex items-center gap-1.5 text-xs text-royal-900/50">
            <Ruler className="h-3.5 w-3.5" />
            Not sure?{" "}
            <a
              href={waLink(
                `Good day Patience Sewing Ltd, I am not sure which size to take for the ${product.name}. Can you help?`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-royal-800 underline underline-offset-2"
            >
              Ask on WhatsApp
            </a>{" "}
            and we will measure you properly.
          </p>
        </fieldset>
      )}

      <div>
        <p className="label">Quantity</p>
        <div className="flex items-center gap-4">
          <div className="flex items-center rounded-full border border-royal-900/20">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-11 w-11 items-center justify-center rounded-full text-royal-900 transition-colors hover:bg-royal-50"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              name="quantity"
              type="number"
              min={1}
              max={maxQty}
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(1, Math.min(maxQty, Number(e.target.value) || 1)))
              }
              className="w-14 border-0 bg-transparent text-center text-sm font-semibold text-royal-950 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              aria-label="Quantity"
            />
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
              className="flex h-11 w-11 items-center justify-center rounded-full text-royal-900 transition-colors hover:bg-royal-50"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-royal-900/60">
            {product.stock > 0 ? `${product.stock} available` : "Made to order"}
          </p>
        </div>
      </div>

      {isApprovedRetailer && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            pricing.qualifies
              ? "border-emerald-300 bg-emerald-50 text-emerald-900"
              : "border-gold-300 bg-gold-50 text-royal-900"
          }`}
        >
          {pricing.qualifies ? (
            <p className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <span className="font-semibold">Wholesale price applied.</span> {formatNaira(pricing.unit)}{" "}
                per unit instead of {formatNaira(product.retailPrice)}.
                {discountPercent > 0 && (
                  <>
                    {" "}
                    Your {discountPercent}% retailer discount takes this order to{" "}
                    <span className="font-semibold">{formatNaira(pricing.total)}</span>.
                  </>
                )}
              </span>
            </p>
          ) : (
            <p>
              <span className="font-semibold">Retail price at this quantity.</span> Add{" "}
              {shortBy} more {shortBy === 1 ? "unit" : "units"} to reach the wholesale minimum of{" "}
              {product.wholesaleMinQty} and drop to {formatNaira(product.wholesalePrice)} per unit.
            </p>
          )}
        </div>
      )}

      <div className="rounded-xl bg-white p-4 ring-1 ring-royal-900/10">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-royal-900/60">
            {pricing.qualifies ? "Wholesale total" : "Total"}
          </span>
          <span className="text-2xl font-semibold text-royal-950">
            {formatNaira(pricing.total)}
          </span>
        </div>
        {pricing.discount > 0 && (
          <p className="mt-1 text-right text-xs text-emerald-700">
            Includes {formatNaira(pricing.discount)} retailer discount
          </p>
        )}
        <p className="mt-1 flex items-center justify-end gap-1.5 text-xs text-royal-900/50">
          <Truck className="h-3.5 w-3.5" />
          Dispatched in {product.leadTimeDays} days
        </p>
      </div>

      <button
        type="submit"
        disabled={pending || soldOut || (needsSize && !size)}
        className="btn btn-primary w-full !py-3.5"
      >
        {soldOut ? (
          <>
            <MessageCircle className="h-4 w-4" /> Sold out &mdash; ask us to make one
          </>
        ) : pending ? (
          "Adding to cart"
        ) : (
          <>
            <ShoppingBag className="h-4 w-4" /> Add to cart
          </>
        )}
      </button>

      {soldOut && (
        <a
          href={waLink(
            `Good day Patience Sewing Ltd, the ${product.name} is showing as sold out. Could you make one for me?`,
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline w-full"
        >
          Ask to commission this piece
        </a>
      )}
    </form>
  );
}
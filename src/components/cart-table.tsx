"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { removeCartLineAction, updateCartLineAction } from "@/app/(shop)/cart/actions";
import { initialState } from "@/lib/action-types";
import { formatNaira } from "@/lib/money";
import type { PricedLine } from "@/lib/pricing";

export function CartTable({
  lines,
  deliveryFee,
  freeThreshold,
}: {
  lines: PricedLine[];
  deliveryFee: number;
  freeThreshold: number;
}) {
  return (
    <div>
      <ul className="divide-y divide-royal-900/8">
        {lines.map((line) => (
          <CartRow key={`${line.productId}-${line.size}-${line.colourway}`} line={line} />
        ))}
      </ul>

      <div className="mt-6 rounded-xl border border-royal-900/10 bg-white p-5">
        <DeliveryProgress lines={lines} deliveryFee={deliveryFee} freeThreshold={freeThreshold} />
      </div>
    </div>
  );
}

function DeliveryProgress({
  lines,
  deliveryFee,
  freeThreshold,
}: {
  lines: PricedLine[];
  deliveryFee: number;
  freeThreshold: number;
}) {
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);

  if (deliveryFee === 0) {
    return (
      <p className="text-sm font-medium text-emerald-700">
        Free delivery unlocked. We will dispatch your order within 24 hours of payment.
      </p>
    );
  }

  const remaining = Math.max(0, freeThreshold - subtotal);
  const percent = Math.min(100, Math.round((subtotal / freeThreshold) * 100));

  return (
    <div>
      <p className="text-sm text-royal-900/70">
        Add{" "}
        <span className="font-semibold text-royal-950">{formatNaira(remaining)}</span> more to
        qualify for free delivery.
      </p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-royal-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-royal-700 to-gold-400 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function CartRow({ line }: { line: PricedLine }) {
  const [updateState, updateAction, updatePending] = useActionState(
    updateCartLineAction,
    initialState(),
  );
  const [removeState, removeAction, removePending] = useActionState(
    removeCartLineAction,
    initialState(),
  );

  useEffect(() => {
    if (updateState.ok || removeState.ok) {
      window.dispatchEvent(new CustomEvent("psl:cart-changed"));
      window.dispatchEvent(new CustomEvent("psl:cart-updated"));
    }
  }, [updateState, removeState]);

  const setQty = (qty: number) => {
    const form = new FormData();
    form.set("productId", line.productId);
    form.set("quantity", String(qty));
    if (line.size) form.set("size", line.size);
    if (line.colourway) form.set("colourway", line.colourway);
    updateAction(form);
  };

  return (
    <li className="flex gap-5 py-6">
      <Link
        href={`/shop/${line.slug ?? ""}`}
        className="relative h-40 w-32 shrink-0 overflow-hidden rounded-xl bg-royal-50"
      >
        {line.imageUrl ? (
          <Image src={line.imageUrl} alt={line.name} fill sizes="128px" className="object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center text-xs text-royal-900/35">
            No image
          </span>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
        <div>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Link
                href={`/shop/${line.slug ?? ""}`}
                className="font-display text-lg font-semibold text-royal-950 hover:text-royal-700"
              >
                {line.name}
              </Link>
              <p className="mt-1 text-sm text-royal-900/55">
                {[line.size, line.colourway].filter(Boolean).join(" · ") || "One size"}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-royal-950">{formatNaira(line.lineTotal)}</p>
              {line.quantity > 1 && (
                <p className="mt-0.5 text-xs text-royal-900/50">
                  {formatNaira(line.unitPrice)} each
                </p>
              )}
            </div>
          </div>

          {line.tier === "WHOLESALE" ? (
            <span className="status-pill mt-2 bg-emerald-50 text-emerald-800">
              Wholesale price
            </span>
          ) : line.shortBy > 0 ? (
            <p className="mt-2 text-xs text-gold-700">
              Add {line.shortBy} more to reach the wholesale minimum of {line.minimumQuantity} and
              pay less per unit.
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-full border border-royal-900/20">
              <button
                type="button"
                onClick={() => setQty(line.quantity - 1)}
                disabled={updatePending}
                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-royal-50 disabled:opacity-40"
                aria-label="Decrease quantity"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-9 text-center text-sm font-semibold text-royal-950">
                {line.quantity}
              </span>
              <button
                type="button"
                onClick={() => setQty(line.quantity + 1)}
                disabled={updatePending || line.quantity >= (line.stock ?? 99)}
                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-royal-50 disabled:opacity-40"
                aria-label="Increase quantity"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <form action={removeAction}>
              <input type="hidden" name="productId" value={line.productId} />
              {line.size && <input type="hidden" name="size" value={line.size} />}
              {line.colourway && <input type="hidden" name="colourway" value={line.colourway} />}
              <button
                type="submit"
                disabled={removePending}
                className="flex items-center gap-1.5 text-xs text-royal-900/50 transition-colors hover:text-red-600 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            </form>
          </div>

          {line.quantity >= (line.stock ?? 0) && (
            <p className="text-xs text-amber-700">Maximum available in stock</p>
          )}
        </div>
      </div>
    </li>
  );
}
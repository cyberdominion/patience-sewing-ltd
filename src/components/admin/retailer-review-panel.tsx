"use client";

import { useActionState, useState } from "react";
import { reviewRetailerAction } from "@/app/admin/actions";
import { initialState } from "@/lib/action-types";
import { Check, X, Loader2, Clock } from "lucide-react";

export function RetailerReviewPanel({
  applicationId,
  businessName,
  categories,
  monthlyVolume,
}: {
  applicationId: string;
  businessName: string;
  categories: string[];
  monthlyVolume?: string | null;
}) {
  const [state, action, pending] = useActionState(reviewRetailerAction, initialState());
  const [discount, setDiscount] = useState(20);

  // A sensible starting discount based on how much they say they sell.
  const suggestedDiscount = /150|over 100|100 -/i.test(monthlyVolume ?? "")
    ? 25
    : /80|100 -/i.test(monthlyVolume ?? "")
      ? 22
      : 20;

  return (
    <form action={action} className="rounded-xl border border-royal-900/12 bg-royal-50/40 p-4">
      <input type="hidden" name="applicationId" value={applicationId} />

      <p className="font-display text-lg font-semibold text-royal-950">Decision</p>

      {state.message && (
        <p
          role="status"
          className={`mt-2 rounded-lg p-2.5 text-xs ${
            state.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </p>
      )}

      <div className="mt-4 space-y-3">
        <div>
          <label className="label" htmlFor={`discount-${applicationId}`}>
            Discount
          </label>
          <div className="flex items-center gap-2">
            <input
              id={`discount-${applicationId}`}
              name="discountPercent"
              type="number"
              min={0}
              max={60}
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="input"
            />
            <span className="text-sm text-royal-900/55">%</span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {[15, 20, 25, 30].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setDiscount(value)}
                className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                  discount === value
                    ? "border-royal-900 bg-royal-900 text-white"
                    : "border-royal-900/20 text-royal-900/70"
                }`}
              >
                {value}%
              </button>
            ))}
          </div>
          {suggestedDiscount !== 20 && (
            <p className="mt-1.5 text-xs text-royal-900/50">
              Based on {businessName}&apos;s stated volume, {suggestedDiscount}% is typical. Your call.
            </p>
          )}
        </div>

        <div>
          <label className="label" htmlFor={`credit-${applicationId}`}>
            Credit limit (naira)
          </label>
          <input
            id={`credit-${applicationId}`}
            name="creditLimit"
            type="number"
            min={0}
            defaultValue={500000}
            className="input"
          />
          <p className="mt-1 text-xs text-royal-900/45">
            Set 0 for pay-before-production. Only raise it for accounts with a track record.
          </p>
        </div>

        <div>
          <label className="label" htmlFor={`note-${applicationId}`}>
            Internal note
          </label>
          <textarea
            id={`note-${applicationId}`}
            name="reviewNote"
            rows={2}
            className="input resize-y"
            placeholder="What you decided and why"
          />
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        <button
          type="submit"
          name="decision"
          value="APPROVED"
          disabled={pending}
          className="btn btn-primary w-full !py-2.5 text-sm"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Approve at {discount}%
        </button>
        <button
          type="submit"
          name="decision"
          value="REJECTED"
          disabled={pending}
          className="btn w-full !py-2.5 text-sm border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
        >
          <X className="h-4 w-4" /> Reject application
        </button>
        <button
          type="submit"
          name="decision"
          value="SUSPENDED"
          disabled={pending}
          className="btn btn-outline w-full !py-2.5 text-sm"
        >
          <Clock className="h-4 w-4" /> Approve for review only
        </button>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-royal-900/45">
        Approving unlocks wholesale prices for {categories.join(", ").replace(/_/g, " ").toLowerCase()}{" "}
        at checkout and converts their pipeline lead to won.
      </p>
    </form>
  );
}
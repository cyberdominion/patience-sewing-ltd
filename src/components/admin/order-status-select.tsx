"use client";

import { useActionState } from "react";
import { updateOrderStatusAction } from "@/app/admin/actions";
import { initialState } from "@/lib/action-types";

const OPTIONS = [
  { value: "PENDING", label: "Pending payment" },
  { value: "PAID", label: "Paid" },
  { value: "IN_PRODUCTION", label: "In production" },
  { value: "READY_TO_SHIP", label: "Ready to ship" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REFUNDED", label: "Refunded" },
];

export function OrderStatusSelect({
  orderId,
  current,
}: {
  orderId: string;
  current: string;
}) {
const [state, action, pending] = useActionState(updateOrderStatusAction, initialState());

  return (
    <form action={action} className="space-y-1.5">
      <input type="hidden" name="orderId" value={orderId} />
      <label className="sr-only" htmlFor={`status-${orderId}`}>
        Order status
      </label>
      <select
        id={`status-${orderId}`}
        name="status"
        defaultValue={current}
        key={state.ok ? state.message : current}
        className="input !py-2 text-sm"
        disabled={pending}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <button type="submit" disabled={pending} className="btn btn-primary w-full !py-2 text-xs">
        {pending ? "Saving" : state.ok ? "Saved" : "Update status"}
      </button>
      {state.message && !state.ok && (
        <p className="text-xs text-red-600">{state.message}</p>
      )}
    </form>
  );
}

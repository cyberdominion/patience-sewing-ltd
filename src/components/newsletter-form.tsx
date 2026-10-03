"use client";

import { useActionState } from "react";
import { subscribeAction } from "@/app/(marketing)/actions";

export function NewsletterForm({ className = "" }: { className?: string }) {
  const [state, action, pending] = useActionState(subscribeAction, {
    ok: false,
    message: "",
  });

  return (
    <form action={action} className={className}>
      <div className="flex gap-2">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          placeholder="you@email.com"
          className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-royal-200/40 focus:border-gold-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="btn btn-gold !px-5 !py-2.5 disabled:opacity-60"
        >
          {pending ? "Joining" : "Join"}
        </button>
      </div>
      {state.message && (
        <p
          role="status"
          className={`mt-2 text-xs ${state.ok ? "text-gold-300" : "text-red-300"}`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
"use client";

import { useActionState } from "react";
import { captureLeadAction } from "@/app/(marketing)/actions";
import { initialState } from "@/lib/action-types";
import { Loader2, Send } from "lucide-react";

export function ContactForm() {
  const [state, action, pending] = useActionState(captureLeadAction, initialState());
  const errors = state.errors ?? {};

  if (state.ok) {
    return (
      <div className="py-10 text-center">
        <p className="font-display text-2xl font-semibold text-royal-950">Message received</p>
        <div className="gold-rule mx-auto mt-3" />
        <p className="mt-4 text-sm leading-relaxed text-royal-900/70">{state.message}</p>
        <p className="mt-3 text-sm text-royal-900/55">
          For anything urgent, message us on WhatsApp instead.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="source" value="WEBSITE" />

      {state.message && !state.ok && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {state.message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="c-name">
            Your name <span className="text-red-600">*</span>
          </label>
          <input id="c-name" name="fullName" required className={`input ${errors.fullName ? "border-red-400" : ""}`} />
        </div>
        <div>
          <label className="label" htmlFor="c-phone">
            WhatsApp number <span className="text-red-600">*</span>
          </label>
          <input
            id="c-phone"
            name="phone"
            type="tel"
            placeholder="0803 000 0000"
            required
            className={`input ${errors.phone ? "border-red-400" : ""}`}
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="c-email">
          Email <span className="font-normal text-royal-900/40">(optional)</span>
        </label>
        <input id="c-email" name="email" type="email" className="input" />
      </div>

      <div>
        <label className="label" htmlFor="c-subject">
          Subject
        </label>
        <input id="c-subject" name="subject" placeholder="Sizing, a wedding outfit, wholesale..." className="input" />
      </div>

      <div>
        <label className="label" htmlFor="c-message">
          Message <span className="text-red-600">*</span>
        </label>
        <textarea
          id="c-message"
          name="message"
          rows={5}
          required
          minLength={10}
          placeholder="Tell us the occasion, your date, and what you have in mind"
          className="input resize-y"
        />
        {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message}</p>}
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary w-full !py-3">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {pending ? "Sending" : "Send message"}
      </button>
    </form>
  );
}
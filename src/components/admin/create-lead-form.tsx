"use client";

import { useActionState } from "react";
import { createManualLeadAction } from "@/app/admin/actions";
import { initialState } from "@/lib/action-types";
import { Loader2, Plus, X } from "lucide-react";
import { useState } from "react";

export function CreateLeadForm() {
  const [state, action, pending] = useActionState(createManualLeadAction, initialState());
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const errors = state.errors ?? {};

  return (
    <form action={action} className="space-y-4">
      {state.message && !state.ok && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {state.message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Name" name="fullName" required error={errors.fullName} />
        <Field label="WhatsApp" name="phone" type="tel" placeholder="0803 000 0000" required error={errors.phone} />
        <Field label="Email" name="email" type="email" error={errors.email} />
        <Field label="City" name="city" error={errors.city} />
        <div>
          <label className="label" htmlFor="lead-source">
            Source
          </label>
          <select id="lead-source" name="source" defaultValue="WALK_IN" className="input">
            {["WALK_IN", "WHATSAPP", "INSTAGRAM", "FACEBOOK", "WEBSITE", "REFERRAL", "MARKET", "PAYMENT_LINK", "OTHER"].map(
              (s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ").toLowerCase()}
                </option>
              ),
            )}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="lead-state">
            State
          </label>
          <input id="lead-state" name="state" defaultValue="Bayelsa" className="input" />
        </div>
        <Field label="Interested in" name="interestedIn" placeholder="Iwe Royal Gown" error={errors.interestedIn} />
        <Field label="Budget" name="budgetRange" placeholder="NGN 250,000 - 400,000" error={errors.budgetRange} />
        <Field label="Timeline" name="timeline" placeholder="This month" error={errors.timeline} />
        <Field
          label="Estimated value (naira)"
          name="orderValueEstimate"
          type="number"
          min={0}
          placeholder="320000"
          error={errors.orderValueEstimate}
        />
      </div>

      <div>
        <label className="label" htmlFor="lead-notes">
          Notes
        </label>
        <textarea id="lead-notes" name="notes" rows={3} className="input resize-y" placeholder="What they said, what they were wearing, what occasion" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-royal-950">Tags:</span>
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-royal-100 py-1 pl-3 pr-1.5 text-xs">
            {tag}
            <input type="hidden" name="tags" value={tag} />
            <button
              type="button"
              onClick={() => setTags(tags.filter((t) => t !== tag))}
              className="rounded-full p-0.5 hover:bg-royal-900/15"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (tagInput.trim()) {
                setTags([...new Set([...tags, tagInput.trim().toLowerCase()])]);
                setTagInput("");
              }
            }
          }}
          placeholder="vip, wholesale, referral"
          className="input max-w-48 flex-1 !py-1.5 text-sm"
          aria-label="Add a tag"
        />
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {pending ? "Adding lead" : "Add lead"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  error,
  placeholder,
  min,
  max,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        min={min}
        max={max}
        className={`input ${error ? "border-red-400" : ""}`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
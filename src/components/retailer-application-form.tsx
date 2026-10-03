"use client";

import { useActionState, useState } from "react";
import { applyRetailerAction } from "@/app/(auth)/actions";
import { initialState } from "@/lib/action-types";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { CategoryFilter } from "@/lib/categories";

export function RetailerApplicationForm({
  categories,
  labels,
}: {
  categories: CategoryFilter[];
  labels: Record<string, string>;
}) {
  const [state, action, pending] = useActionState(applyRetailerAction, initialState());
  const [selected, setSelected] = useState<CategoryFilter[]>([]);
  const errors = state.errors ?? {};

  if (state.ok) {
    return (
      <div className="py-8 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h3 className="mt-6 font-display text-3xl font-semibold text-royal-950">
          Application received
        </h3>
        <div className="gold-rule mx-auto mt-4" />
        <p className="mt-5 leading-relaxed text-royal-900/70">{state.message}</p>
        <p className="mt-4 text-sm text-royal-900/55">
          You can sign in with the email and password you just set to follow the status of your
          application.
        </p>
      </div>
    );
  }

  const toggle = (category: CategoryFilter) =>
    setSelected((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    );

  return (
    <form action={action} className="space-y-5">
      <div>
        <h3 className="font-display text-2xl font-semibold text-royal-950">
          Retailer application
        </h3>
        <p className="mt-1.5 text-sm text-royal-900/60">
          All fields marked <span className="text-red-600">*</span> are required.
        </p>
      </div>

      {state.message && !state.ok && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {state.message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your full name" name="fullName" required error={errors.fullName} />
        <Field label="Email" name="email" type="email" required error={errors.email} />
        <Field label="WhatsApp number" name="phone" type="tel" placeholder="0803 000 0000" required error={errors.phone} />
        <Field label="Business name" name="businessName" required error={errors.businessName} />
        <div>
          <label className="label" htmlFor="businessType">
            Type of business <span className="text-red-600">*</span>
          </label>
          <select id="businessType" name="businessType" required className="input" defaultValue="">
            <option value="" disabled>
              Choose one
            </option>
            <option>Boutique</option>
            <option>Online store</option>
            <option>Tailoring service</option>
            <option>Market trader</option>
            <option>Department store</option>
            <option>Other</option>
          </select>
          {errors.businessType && (
            <p className="mt-1 text-xs text-red-600">{errors.businessType}</p>
          )}
        </div>
        <Field
          label="Shop address"
          name="shopAddress"
          placeholder="Street, area"
          required
          error={errors.shopAddress}
        />
        <Field label="City" name="city" required error={errors.city} />
        <div>
          <label className="label" htmlFor="app-state">
            State
          </label>
          <input id="app-state" name="state" defaultValue="Bayelsa" className="input" />
        </div>
        <Field
          label="Years in business"
          name="yearsInBusiness"
          type="number"
          min={0}
          max={80}
          placeholder="e.g. 4"
          error={errors.yearsInBusiness}
        />
        <Field
          label="Typical monthly volume"
          name="monthlyVolume"
          placeholder="e.g. 40 - 80 pieces"
          error={errors.monthlyVolume}
        />
      </div>

      <fieldset>
        <legend className="label">
          What do you want to sell? <span className="text-red-600">*</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const active = selected.includes(category);
            return (
              <label
                key={category}
                className={`cursor-pointer rounded-full border px-4 py-2 text-sm transition-colors ${
                  active
                    ? "border-royal-900 bg-royal-900 text-white"
                    : "border-royal-900/20 text-royal-900/75 hover:border-royal-400"
                }`}
              >
                <input
                  type="checkbox"
                  name="categories"
                  value={category}
                  checked={active}
                  onChange={() => toggle(category)}
                  className="sr-only"
                />
                {labels[category]}
              </label>
            );
          })}
        </div>
        {errors.categories && <p className="mt-1.5 text-xs text-red-600">{errors.categories}</p>}
      </fieldset>

      <div>
        <label className="label" htmlFor="note">
          Anything else we should know?
        </label>
        <textarea
          id="note"
          name="note"
          rows={3}
          className="input resize-y"
          placeholder="Your customers, the occasion you sell most for, brands you already stock"
        />
      </div>

      <div className="rounded-xl bg-royal-50 p-4">
        <p className="text-sm font-semibold text-royal-950">Set a password</p>
        <p className="mt-1 text-xs leading-relaxed text-royal-900/65">
          This creates your account so you can follow your application. Wholesale prices stay locked
          until we approve you.
        </p>
        <div className="mt-3">
          <label className="sr-only" htmlFor="app-password">
            Password
          </label>
          <input
            id="app-password"
            name="password"
            type="password"
            minLength={8}
            placeholder="At least 8 characters"
            className="input"
          />
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
        </div>
      </div>

      <button type="submit" disabled={pending || selected.length === 0} className="btn btn-primary w-full !py-3">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {pending ? "Submitting application" : "Submit application"}
      </button>

      <p className="text-center text-xs leading-relaxed text-royal-900/45">
        We use your details only to assess this application and to contact you about your orders.
      </p>
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
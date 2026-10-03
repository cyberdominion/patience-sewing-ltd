"use client";

import { useActionState, useState } from "react";
import { Lock, Truck, MessageCircle } from "lucide-react";
import { beginCheckoutAction } from "@/app/(shop)/checkout/actions";
import { initialState } from "@/lib/action-types";
import { waLink } from "@/lib/whatsapp";

const STATES = [
  "Bayelsa",
  "Rivers",
  "Lagos",
  "Abuja",
  "FCT",
  "Delta",
  "Enugu",
  "Oyo",
  "Imo",
  "Anambra",
  "Kwara",
  "Kaduna",
  "Kano",
  "Ogun",
  "Ondo",
  "Osun",
  "Plateau",
  "Niger",
  "Akwa Ibom",
  "Cross River",
  "Edo",
  "Abia",
  "Benue",
  "Borno",
  "Adamawa",
  "Bauchi",
  "Taraba",
  "Yobe",
  "Other",
];

export function CheckoutForm({
  defaultValues,
  signedIn,
}: {
  defaultValues: Record<string, string>;
  signedIn: boolean;
}) {
  const [state, action, pending] = useActionState(beginCheckoutAction, initialState());
  const [bespoke, setBespoke] = useState(false);
  const errors = state.errors ?? {};

  return (
    <form action={action} className="space-y-8">
      {state.message && !state.ok && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {state.message}
        </div>
      )}

      <fieldset className="card p-6">
        <legend className="sr-only">Contact details</legend>
        <h2 className="font-display text-xl font-semibold text-royal-950">1. Your details</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Full name" name="customerName" defaultValue={defaultValues.customerName} error={errors.customerName} required />
          <Field label="Email" name="customerEmail" type="email" defaultValue={defaultValues.customerEmail} error={errors.customerEmail} required />
          <Field
            label="WhatsApp number"
            name="customerPhone"
            type="tel"
            defaultValue={defaultValues.customerPhone}
            error={errors.customerPhone}
            placeholder="0803 000 0000"
            hint="We confirm every order on WhatsApp"
            required
          />
          <div>
            <label className="label" htmlFor="state">
              State
            </label>
            <select
              id="state"
              name="shippingState"
              defaultValue={defaultValues.shippingState ?? "Bayelsa"}
              className="input"
            >
              {STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {signedIn && (
          <label className="mt-5 flex items-start gap-2.5 text-sm text-royal-900/75">
            <input type="checkbox" name="saveDetails" defaultChecked className="mt-0.5 h-4 w-4 accent-royal-900" />
            Save this address for next time
          </label>
        )}
      </fieldset>

      <fieldset className="card p-6">
        <legend className="sr-only">Delivery address</legend>
        <h2 className="font-display text-xl font-semibold text-royal-950">2. Delivery address</h2>
        <div className="mt-5 grid gap-4">
          <Field label="Street address" name="shippingLine1" defaultValue={defaultValues.shippingLine1} error={errors.shippingLine1} placeholder="House number, street" required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City" name="shippingCity" defaultValue={defaultValues.shippingCity} error={errors.shippingCity} required />
            <input type="hidden" name="shippingCountry" value="Nigeria" />
          </div>
          <div>
            <label className="label" htmlFor="deliveryNotes">
              Delivery notes <span className="font-normal text-royal-900/40">(optional)</span>
            </label>
            <textarea
              id="deliveryNotes"
              name="deliveryNotes"
              rows={3}
              className="input resize-y"
              placeholder="Landmark, gate colour, best time to deliver"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="card p-6">
        <legend className="sr-only">Bespoke details</legend>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-royal-950">3. Bespoke commission</h2>
            <p className="mt-1 text-sm text-royal-900/65">
              Need it made to measure? Tell us here and we will confirm the design and price on
              WhatsApp before taking payment.
            </p>
          </div>
          <label className="flex shrink-0 cursor-pointer items-center">
            <input
              type="checkbox"
              name="isCustomBespoke"
              checked={bespoke}
              onChange={(e) => setBespoke(e.target.checked)}
              className="h-5 w-5 accent-royal-900"
            />
            <span className="sr-only">This is a bespoke commission</span>
          </label>
        </div>

        {bespoke && (
          <div className="mt-5 space-y-4">
            <div>
              <label className="label" htmlFor="designBrief">
                What are you sewing for?
              </label>
              <textarea
                id="designBrief"
                name="designBrief"
                rows={4}
                className="input resize-y"
                placeholder="Occasion, date, fabric preference, colours, silhouette you have in mind"
              />
            </div>
            <div>
              <label className="label" htmlFor="measurements">
                Measurements <span className="font-normal text-royal-900/40">(optional, we can take them at fitting)</span>
              </label>
              <textarea
                id="measurements"
                name="measurements"
                rows={4}
                className="input resize-y"
                placeholder="Bust, waist, hip, shoulder, height, or paste a photo of your measurements"
              />
            </div>
            <a
              href={waLink(
                "Good day Patience Sewing Ltd, I am placing a bespoke commission through the website. Can you help me with measurements?",
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline !py-2 text-sm"
            >
              <MessageCircle className="h-4 w-4" /> Get help with measurements
            </a>
          </div>
        )}
      </fieldset>

      <div className="card p-6">
        <h2 className="font-display text-xl font-semibold text-royal-950">4. Payment</h2>
        <p className="mt-2 flex items-center gap-2 text-sm text-royal-900/70">
          <Truck className="h-4 w-4 text-gold-600" />
          You will be taken to Paystack to pay by card, bank transfer, USSD or QR.
        </p>
        <button type="submit" disabled={pending} className="btn btn-primary mt-5 w-full !py-3.5">
          {pending ? "Starting secure payment" : "Pay securely with Paystack"}
          {!pending && <Lock className="h-4 w-4" />}
        </button>
        <p className="mt-3 text-center text-xs text-royal-900/50">
          By paying you accept our terms of sale and returns policy.
        </p>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  error,
  hint,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  required?: boolean;
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
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className={`input ${error ? "border-red-400" : ""}`}
      />
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-royal-900/45">{hint}</p>
      ) : null}
    </div>
  );
}
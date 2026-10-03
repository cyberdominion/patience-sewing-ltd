"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { saveSettingsAction } from "@/app/admin/actions";
import { initialState } from "@/lib/action-types";
import { Save, Loader2 } from "lucide-react";

export type SettingsData = {
  businessName: string;
  tagline: string;
  whatsappNumber: string;
  supportEmail: string;
  supportPhone: string;
  instagramHandle: string;
  facebookUrl: string;
  tiktokHandle: string;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  aiModel: string;
  aiEnabled: boolean;
};

export function SettingsForm({ settings }: { settings: SettingsData }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveSettingsAction, initialState());

  if (state.ok) router.refresh();

  return (
    <form action={action} className="space-y-7">
      {state.message && (
        <p
          role="status"
          className={`rounded-lg p-3 text-sm ${
            state.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </p>
      )}

      <fieldset className="space-y-4">
        <legend className="font-display text-lg font-semibold text-royal-950">Brand</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business name" name="businessName" defaultValue={settings.businessName} required />
          <Field label="Tagline" name="tagline" defaultValue={settings.tagline} required />
        </div>
        <Field
          label="WhatsApp number"
          name="whatsappNumber"
          defaultValue={settings.whatsappNumber}
          hint="Country code, no plus or spaces. This drives every WhatsApp button on the site."
          required
        />
      </fieldset>

      <fieldset className="space-y-4 border-t border-royal-900/8 pt-6">
        <legend className="font-display text-lg font-semibold text-royal-950">Contact</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Support email" name="supportEmail" type="email" defaultValue={settings.supportEmail} required />
          <Field label="Support phone" name="supportPhone" defaultValue={settings.supportPhone} required />
          <Field label="Instagram handle" name="instagramHandle" defaultValue={settings.instagramHandle} placeholder="@patiencesewing" />
          <Field label="Facebook URL" name="facebookUrl" defaultValue={settings.facebookUrl} placeholder="https://facebook.com/..." />
          <Field label="TikTok handle" name="tiktokHandle" defaultValue={settings.tiktokHandle} placeholder="@patiencesewing" />
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-royal-900/8 pt-6">
        <legend className="font-display text-lg font-semibold text-royal-950">
          Delivery &amp; payments (naira)
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Flat delivery fee"
            name="deliveryFee"
            type="number"
            min={0}
            defaultValue={String(settings.deliveryFee)}
          />
          <Field
            label="Free delivery above"
            name="freeDeliveryThreshold"
            type="number"
            min={0}
            defaultValue={String(settings.freeDeliveryThreshold)}
          />
          <Field label="Bank name" name="bankName" defaultValue={settings.bankName} />
          <Field label="Account number" name="bankAccountNumber" defaultValue={settings.bankAccountNumber} />
          <Field label="Account name" name="bankAccountName" defaultValue={settings.bankAccountName} />
        </div>
        <p className="text-xs leading-relaxed text-royal-900/50">
          Bank details are shown at checkout for customers who prefer transfer over card.
        </p>
      </fieldset>

      <fieldset className="space-y-4 border-t border-royal-900/8 pt-6">
        <legend className="font-display text-lg font-semibold text-royal-950">
          AI follow-up assistant
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Model" name="aiModel" defaultValue={settings.aiModel} />
        </div>
        <label className="flex items-center gap-2 text-sm text-royal-900/80">
          <input
            type="checkbox"
            name="aiEnabled"
            defaultChecked={settings.aiEnabled}
            className="h-4 w-4 accent-royal-900"
          />
          Generate AI copy for follow-ups
        </label>
        <p className="text-xs leading-relaxed text-royal-900/50">
          The API key is set through <code className="rounded bg-royal-50 px-1">AI_API_KEY</code> in
          the environment. Any OpenAI-compatible endpoint works. Without a key the CRM falls back to
          stage-aware templates.
        </p>
      </fieldset>

      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {pending ? "Saving" : "Save settings"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  hint,
  placeholder,
  min,
  max,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  hint?: string;
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
        defaultValue={defaultValue ?? ""}
        required={required}
        placeholder={placeholder}
        min={min}
        max={max}
        className="input"
      />
      {hint && <p className="mt-1 text-xs text-royal-900/45">{hint}</p>}
    </div>
  );
}
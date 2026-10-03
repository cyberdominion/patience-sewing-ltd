"use client";

import { useActionState, useState } from "react";
import { initialState, type ActionState } from "@/lib/action-types";
import { Loader2 } from "lucide-react";

const SOURCES = [
  "WHATSAPP",
  "INSTAGRAM",
  "FACEBOOK",
  "WEBSITE",
  "REFERRAL",
  "WALK_IN",
  "MARKET",
  "PAYMENT_LINK",
  "OTHER",
];

export function CampaignForm({
  action,
  edit,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  edit?: { slug: string; name: string; source: string; targetUrl: string };
}) {
  const [state, formAction, pending] = useActionState(action, initialState());
  const [source, setSource] = useState(edit?.source ?? "WEBSITE");

  return (
    <form action={formAction} className="space-y-3">
      <h2 className="font-display text-lg font-semibold text-royal-950">
        {edit ? "Edit campaign" : "New campaign"}
      </h2>

      {state.message && !state.ok && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{state.message}</p>
      )}

      {edit && <input type="hidden" name="slug" value={edit.slug} />}

      <div>
        <label className="label" htmlFor="name">Name</label>
        <input id="name" name="name" required defaultValue={edit?.name} className="input" placeholder="Instagram Summer 24" />
      </div>

      {!edit && (
        <div>
          <label className="label" htmlFor="slug">Slug</label>
          <input id="slug" name="slug" required className="input" placeholder="instagram-summer-24" />
        </div>
      )}

      <div>
        <label className="label" htmlFor="source">Source</label>
        <select
          id="source"
          name="source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="input"
        >
          {SOURCES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ").toLowerCase()}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="targetUrl">Target URL</label>
        <input id="targetUrl" name="targetUrl" required defaultValue={edit?.targetUrl ?? "/"} className="input" placeholder="/shop" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label" htmlFor="utmSource">UTM source</label>
          <input id="utmSource" name="utmSource" className="input" placeholder={source.toLowerCase()} />
        </div>
        <div>
          <label className="label" htmlFor="utmMedium">UTM medium</label>
          <input id="utmMedium" name="utmMedium" className="input" placeholder="social" />
        </div>
        <div className="col-span-2">
          <label className="label" htmlFor="utmCampaign">UTM campaign</label>
          <input id="utmCampaign" name="utmCampaign" className="input" placeholder="summer-24" />
        </div>
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : edit ? "Save changes" : "Create campaign"}
      </button>
    </form>
  );
}

"use server";

import { createCampaign, updateCampaign } from "@/lib/campaign-server";
import { failure, type ActionState } from "@/lib/action-types";

function toStr(v: FormDataEntryValue | null): string {
  return v === null ? "" : String(v);
}

export async function createCampaignAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return createCampaign({
    slug: toStr(formData.get("slug")),
    name: toStr(formData.get("name")),
    source: toStr(formData.get("source")),
    targetUrl: toStr(formData.get("targetUrl")),
    utmSource: toStr(formData.get("utmSource")) || null,
    utmMedium: toStr(formData.get("utmMedium")) || null,
    utmCampaign: toStr(formData.get("utmCampaign")) || null,
    utmTerm: toStr(formData.get("utmTerm")) || null,
    utmContent: toStr(formData.get("utmContent")) || null,
  });
}

export async function updateCampaignAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const slug = toStr(formData.get("slug"));
  if (!slug) return failure("Missing campaign slug.");
  return updateCampaign(slug, {
    name: toStr(formData.get("name")) || undefined,
    source: toStr(formData.get("source")) || undefined,
    targetUrl: toStr(formData.get("targetUrl")) || undefined,
    utmSource: toStr(formData.get("utmSource")) || null,
    utmMedium: toStr(formData.get("utmMedium")) || null,
    utmCampaign: toStr(formData.get("utmCampaign")) || null,
    utmTerm: toStr(formData.get("utmTerm")) || null,
    utmContent: toStr(formData.get("utmContent")) || null,
  });
}

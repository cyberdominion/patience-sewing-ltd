export type CampaignCookie = {
  slug: string;
  source: string;
  ts: number;
};

export type CampaignRecord = {
  id: string;
  slug: string;
  name: string;
  source: string;
  targetUrl: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  isActive: boolean;
  clicks: number;
};

export function buildCampaignTargetUrl(
  targetUrl: string,
  utm?: {
    utmSource?: string | null;
    utmMedium?: string | null;
    utmCampaign?: string | null;
    utmTerm?: string | null;
    utmContent?: string | null;
  },
): string {
  const url = new URL(targetUrl, "http://localhost");
  if (url.protocol === "http:") url.protocol = "https:";
  const params = new URLSearchParams();
  if (utm?.utmSource) params.set("utm_source", utm.utmSource);
  if (utm?.utmMedium) params.set("utm_medium", utm.utmMedium);
  if (utm?.utmCampaign) params.set("utm_campaign", utm.utmCampaign);
  if (utm?.utmTerm) params.set("utm_term", utm.utmTerm);
  if (utm?.utmContent) params.set("utm_content", utm.utmContent);
  if (params.toString()) url.search = params.toString();
  return url.toString();
}

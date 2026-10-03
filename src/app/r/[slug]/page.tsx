import { redirect } from "next/navigation";
import { getCampaignBySlug, incrementCampaignClick, setCampaignCookie } from "@/lib/campaign-server";
import { buildCampaignTargetUrl } from "@/lib/campaign";

export const dynamic = "force-dynamic";

export default async function CampaignRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const campaign = await getCampaignBySlug(slug);
  if (!campaign) redirect("/");

  const url = buildCampaignTargetUrl(campaign.targetUrl, {
    utmSource: campaign.utmSource ?? campaign.source,
    utmMedium: campaign.utmMedium ?? "social",
    utmCampaign: campaign.utmCampaign ?? campaign.slug,
    utmTerm: campaign.utmTerm ?? undefined,
    utmContent: campaign.utmContent ?? undefined,
  });

  await incrementCampaignClick(slug);
  await setCampaignCookie({ slug: campaign.slug, source: campaign.source });

  redirect(url);
}

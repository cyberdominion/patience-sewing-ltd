import "server-only";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { success, failure, errorMessage, type ActionState } from "./action-types";
import type { CampaignRecord } from "./campaign";

export const CAMPAIGN_COOKIE = "psl_campaign";
const COOKIE_DAYS = 30;

export type CampaignCookie = {
  slug: string;
  source: string;
  ts: number;
};

export async function readCampaignCookie(): Promise<CampaignCookie | null> {
  const store = await cookies();
  const raw = store.get(CAMPAIGN_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CampaignCookie;
  } catch {
    return null;
  }
}

export async function setCampaignCookie(campaign: {
  slug: string;
  source: string;
}): Promise<void> {
  const payload: CampaignCookie = {
    slug: campaign.slug,
    source: campaign.source,
    ts: Date.now(),
  };
  const store = await cookies();
  store.set(CAMPAIGN_COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_DAYS * 24 * 60 * 60,
  });
}

export async function resolveLeadSource(
  explicitSource?: string | null,
): Promise<string> {
  const cookie = await readCampaignCookie();
  if (cookie && !explicitSource) return cookie.source;
  return explicitSource ?? "WEBSITE";
}

export async function getCampaignBySlug(slug: string): Promise<CampaignRecord | null> {
  const row = await prisma.campaign.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      source: true,
      targetUrl: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      utmTerm: true,
      utmContent: true,
      isActive: true,
      clicks: true,
    },
  });
  if (!row) return null;
  return {
    ...row,
    source: row.source ?? "WEBSITE",
  };
}

export async function incrementCampaignClick(
  slug: string,
  extras: { ip?: string | null; userAgent?: string | null; leadId?: string | null } = {},
): Promise<void> {
  const campaign = await prisma.campaign.findUnique({
    where: { slug },
    select: { id: true, isActive: true },
  });
  if (!campaign?.isActive) return;

  await prisma.$transaction([
    prisma.campaign.update({
      where: { slug },
      data: { clicks: { increment: 1 } },
    }),
    prisma.campaignClick.create({
      data: {
        campaignId: campaign.id,
        ip: extras.ip ?? null,
        userAgent: extras.userAgent ?? null,
        leadId: extras.leadId ?? null,
      },
    }),
  ]);
}

export async function attachLeadToCampaign(leadId: string): Promise<void> {
  const cookie = await readCampaignCookie();
  if (!cookie) return;
  await prisma.campaignClick.updateMany({
    where: { campaignId: { equals: cookie.slug } },
    data: { leadId },
  });
}

export async function listCampaigns(): Promise<CampaignRecord[]> {
  const rows = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      name: true,
      source: true,
      targetUrl: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      utmTerm: true,
      utmContent: true,
      isActive: true,
      clicks: true,
    },
  });
  return rows.map((r) => ({ ...r, source: r.source ?? "WEBSITE" }));
}

export async function createCampaign(data: {
  slug: string;
  name: string;
  source: string;
  targetUrl: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
}): Promise<ActionState> {
  try {
    const created = await prisma.campaign.create({
      data: {
        slug: data.slug,
        name: data.name,
        source: data.source as never,
        targetUrl: data.targetUrl,
        utmSource: data.utmSource,
        utmMedium: data.utmMedium,
        utmCampaign: data.utmCampaign,
        utmTerm: data.utmTerm,
        utmContent: data.utmContent,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        source: true,
        targetUrl: true,
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        utmTerm: true,
        utmContent: true,
        isActive: true,
        clicks: true,
      },
    });
    return success(`Campaign "${created.name}" created.`);
  } catch (error) {
    return failure(errorMessage(error));
  }
}

export async function updateCampaign(
  slug: string,
  data: {
    name?: string;
    source?: string;
    targetUrl?: string;
    utmSource?: string | null;
    utmMedium?: string | null;
    utmCampaign?: string | null;
    utmTerm?: string | null;
    utmContent?: string | null;
    isActive?: boolean;
  },
): Promise<ActionState> {
  try {
    const updated = await prisma.campaign.update({
      where: { slug },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.source ? { source: data.source as never } : {}),
        ...(data.targetUrl ? { targetUrl: data.targetUrl } : {}),
        utmSource: data.utmSource,
        utmMedium: data.utmMedium,
        utmCampaign: data.utmCampaign,
        utmTerm: data.utmTerm,
        utmContent: data.utmContent,
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
      select: {
        id: true,
        slug: true,
        name: true,
        source: true,
        targetUrl: true,
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        utmTerm: true,
        utmContent: true,
        isActive: true,
        clicks: true,
      },
    });
    return success(`Campaign "${updated.name}" updated.`);
  } catch (error) {
    return failure(errorMessage(error));
  }
}

export async function deleteCampaign(slug: string): Promise<void> {
  await prisma.campaign.delete({ where: { slug } });
}

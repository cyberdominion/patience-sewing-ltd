import type { Metadata } from "next";
import { listCampaigns, deleteCampaign } from "@/lib/campaign-server";
import { requireAdmin } from "@/lib/auth";
import { CampaignForm } from "@/components/admin/campaign-form";
import { createCampaignAction } from "./actions";
import { Copy, ExternalLink, Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Campaigns" };

export default async function AdminCampaignsPage() {
  await requireAdmin();
  const campaigns = await listCampaigns();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-semibold text-royal-950">Campaign links</h1>
        <p className="mt-1 text-sm text-royal-900/60">
          Create short tracking links for Instagram, WhatsApp, Facebook and other channels.
          Clicks are logged automatically and the source is copied onto any lead that signs up
          from that link.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div>
          <CampaignForm action={createCampaignAction} />
        </div>

        <div className="space-y-3">
          {campaigns.length === 0 && (
            <p className="text-sm text-royal-900/50">No campaigns yet. Create one to start tracking.</p>
          )}
          {campaigns.map((c) => (
            <div key={c.id} className="rounded-xl border border-royal-900/10 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-royal-950">{c.name}</p>
                  <p className="text-xs text-royal-900/50">{c.slug} &middot; {c.source.replace(/_/g, " ").toLowerCase()}</p>
                </div>
                <span
                  className={`status-pill ${c.isActive ? "bg-emerald-50 text-emerald-800" : "bg-royal-100 text-royal-700"}`}
                >
                  {c.isActive ? "Active" : "Paused"}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <code className="flex-1 rounded-lg bg-royal-50 px-3 py-2 text-xs text-royal-900/80">
                  {process.env.NEXT_PUBLIC_SITE_URL}/r/{c.slug}
                </code>
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(
                      `${process.env.NEXT_PUBLIC_SITE_URL}/r/${c.slug}`,
                    );
                  }}
                  className="btn btn-outline !px-3 !py-2 text-xs"
                  type="button"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy
                </button>
                <a
                  href={`/r/${c.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline !px-3 !py-2 text-xs"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open
                </a>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 text-xs text-royal-900/60">
                <span>{c.clicks.toLocaleString()} clicks</span>
                <form action={async () => {
                  "use server";
                  await deleteCampaign(c.slug);
                }}>
                  <button
                    type="submit"
                    className="flex items-center gap-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

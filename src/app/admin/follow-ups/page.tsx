import type { Prisma } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateTime, relativeDays } from "@/lib/money";
import { normalisePhone } from "@/lib/whatsappPhone";
import { waLink } from "@/lib/whatsapp";
import { recordFollowUpOutcomeAction } from "@/app/admin/actions";
import { FollowUpMarkSent, OutcomeButtons } from "@/components/admin/follow-up-actions";
import { Clock, CheckCheck, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Follow-ups" };

type SearchParams = Promise<{ view?: string }>;

export default async function AdminFollowUpsPage({ searchParams }: { searchParams: SearchParams }) {
  const { view } = await searchParams;
  const now = new Date();

  const where: Prisma.FollowUpWhereInput =
    view === "sent"
      ? { status: { in: ["SENT", "REPLIED", "NO_RESPONSE"] } }
      : view === "overdue"
        ? { status: "PENDING", scheduledAt: { lt: now } }
        : { status: "PENDING" };

  const [due, upcoming, overdueCount, stats] = await Promise.all([
    prisma.followUp.findMany({
      where,
      orderBy: { scheduledAt: "asc" },
      take: 60,
      include: {
        lead: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            stage: true,
            score: true,
            interestedIn: true,
          },
        },
      },
    }),
    prisma.followUp.count({
      where: { status: "PENDING", scheduledAt: { gte: now } },
    }),
    prisma.followUp.count({
      where: { status: "PENDING", scheduledAt: { lt: now } },
    }),
    prisma.followUp.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const statMap = Object.fromEntries(stats.map((s) => [s.status, s._count._all]));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold text-royal-950">Follow-ups</h1>
        <p className="mt-1 text-sm text-royal-900/60">
          {overdueCount} overdue &middot; {upcoming} scheduled ahead &middot;{" "}
          {statMap.REPLIED ?? 0} answered
        </p>
      </header>

      <nav className="flex flex-wrap gap-2">
        {[
          { href: "/admin/follow-ups", label: `Queue (${overdueCount + upcoming})`, active: !view },
          { href: "/admin/follow-ups?view=overdue", label: `Overdue (${overdueCount})`, active: view === "overdue" },
          { href: "/admin/follow-ups?view=sent", label: "History", active: view === "sent" },
        ].map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab.active ? "bg-royal-900 text-white" : "border border-royal-900/20 text-royal-900/70 hover:bg-royal-50"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {due.length === 0 ? (
        <section className="card p-12 text-center">
          <CheckCheck className="mx-auto h-8 w-8 text-emerald-600" />
          <p className="mt-4 font-display text-xl font-semibold text-royal-950">Queue is clear</p>
          <p className="mt-2 text-sm text-royal-900/60">
            Open a lead and use the AI follow-up composer to queue the next conversation.
          </p>
          <Link href="/admin/crm" className="btn btn-primary mt-6">
            Open the CRM
          </Link>
        </section>
      ) : (
        <div className="space-y-4">
          {due.map((followUp) => {
            const overdue = followUp.status === "PENDING" && followUp.scheduledAt < now;

            return (
              <article
                key={followUp.id}
                className={`card p-5 ${overdue ? "border-l-4 border-l-amber-500" : ""}`}
              >
                <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/crm/${followUp.leadId}`}
                        className="font-display text-lg font-semibold text-royal-950 hover:underline"
                      >
                        {followUp.lead.fullName}
                      </Link>
                      <span className="status-pill bg-royal-50 text-royal-700">
                        {followUp.channel}
                      </span>
                      <span
                        className={`status-pill ${
                          followUp.status === "REPLIED"
                            ? "bg-emerald-50 text-emerald-800"
                            : followUp.status === "NO_RESPONSE"
                              ? "bg-amber-50 text-amber-800"
                              : followUp.status === "SENT"
                                ? "bg-royal-100 text-royal-800"
                                : "bg-royal-50 text-royal-700"
                        }`}
                      >
                        {followUp.status.replace(/_/g, " ").toLowerCase()}
                      </span>
                      {overdue && (
                        <span className="status-pill bg-amber-100 text-amber-900">
                          <AlertCircle className="h-3 w-3" /> overdue
                        </span>
                      )}
                    </div>

                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-royal-900/50">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDateTime(followUp.scheduledAt)} ({relativeDays(followUp.scheduledAt)})
                      {followUp.lead.interestedIn && (
                        <span className="ml-2">&middot; {followUp.lead.interestedIn}</span>
                      )}
                    </p>

                    {followUp.aiSummary && (
                      <p className="mt-2 text-sm italic leading-relaxed text-royal-900/60">
                        {followUp.aiSummary}
                      </p>
                    )}

                    {(followUp.finalMessage || followUp.aiSuggestedMessage) && (
                      <p className="mt-3 whitespace-pre-wrap rounded-lg bg-royal-50 p-3 text-sm leading-relaxed text-royal-900/85">
                        {followUp.finalMessage ?? followUp.aiSuggestedMessage}
                      </p>
                    )}

                    {followUp.outcome && (
                      <p className="mt-2 text-xs text-royal-900/60">
                        Outcome: <span className="text-royal-900/80">{followUp.outcome}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <a
                      href={waLink(
                        `Good day ${followUp.lead.fullName}, this is Patience Sewing Ltd.${followUp.finalMessage ? `\n\n${followUp.finalMessage}` : ""}`,
                        normalisePhone(followUp.lead.phone),
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn w-full !py-2 text-sm bg-[#25D366] text-white hover:brightness-105"
                    >
                      Send on WhatsApp
                    </a>

                    {followUp.status === "PENDING" && (
                      <FollowUpMarkSent followUpId={followUp.id} />
                    )}

                    <form action={recordFollowUpOutcomeAction} className="rounded-lg border border-royal-900/10 p-2.5">
                      <input type="hidden" name="followUpId" value={followUp.id} />
                      <p className="mb-1.5 text-xs font-semibold text-royal-900/60">Outcome</p>
                      <OutcomeButtons followUpId={followUp.id} />
                    </form>

                    <Link
                      href={`/admin/crm/${followUp.leadId}`}
                      className="btn btn-ghost w-full !py-2 text-xs"
                    >
                      Open lead
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatNaira, formatDateTime, relativeDays } from "@/lib/money";
import { buildBrief, generateFollowUp, temperatureFor, daysBetween, nextActionLabel } from "@/lib/crm";
import { LeadStageButtons } from "@/components/admin/lead-stage-buttons";
import {
  AiFollowUpComposer,
  LeadNotes,
  FollowUpHistory,
} from "@/components/admin/lead-detail-parts";
import { markLeadWonAction, deleteLeadAction } from "@/app/admin/actions";
import { formatPhoneForDisplay } from "@/lib/whatsappPhone";
import { waLink } from "@/lib/whatsapp";
import { ArrowLeft, Flame, Sun, Snowflake, Phone, Mail, MapPin, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Lead detail" };

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      followUps: { orderBy: { scheduledAt: "desc" }, include: { user: { select: { fullName: true } } } },
      activities: { orderBy: { createdAt: "desc" }, take: 40, include: { actor: { select: { fullName: true } } } },
      notesLog: { orderBy: { createdAt: "desc" }, take: 30, include: { user: { select: { fullName: true } } } },
      owner: { select: { fullName: true, email: true } },
    },
  });

  if (!lead) notFound();

  const temperature = temperatureFor(lead.score);
  const brief = buildBrief(lead);
  // Prefill the composer so the AI panel has something to refine immediately.
  const initialSuggestion = await generateFollowUp(brief);
  const staleDays = lead.lastContactedAt ? daysBetween(lead.lastContactedAt) : null;

  return (
    <div className="space-y-6">
      <Link href="/admin/crm" className="inline-flex items-center gap-1.5 text-sm text-royal-900/65 hover:text-royal-900">
        <ArrowLeft className="h-4 w-4" /> All leads
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl font-semibold text-royal-950">{lead.fullName}</h1>
            <TempBadge temperature={temperature} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-royal-900/60">
            <a
              href={waLink(`Good day ${lead.fullName}, this is Patience Sewing Ltd.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-royal-900 hover:underline"
            >
              <Phone className="h-3.5 w-3.5 text-gold-600" />
              {formatPhoneForDisplay(lead.phone)}
            </a>
            {lead.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-gold-600" /> {lead.email}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-gold-600" />
              {lead.city ?? "Unknown"}, {lead.state}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={waLink(`Good day ${lead.fullName}, this is Patience Sewing Ltd following up about ${lead.interestedIn ?? "your enquiry"}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary !py-2 text-sm"
          >
            <Phone className="h-4 w-4" /> Message on WhatsApp
          </a>
          <form action={markLeadWonAction}>
            <input type="hidden" name="leadId" value={lead.id} />
            <button type="submit" className="btn btn-outline !py-2 text-sm">
              Mark won
            </button>
          </form>
          <form action={deleteLeadAction}>
            <input type="hidden" name="leadId" value={lead.id} />
            <button type="submit" className="btn btn-ghost !py-2 text-sm text-red-600 hover:bg-red-50">
              Delete
            </button>
          </form>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          {/* facts */}
          <section className="card p-5">
            <h2 className="font-display text-lg font-semibold text-royal-950">Lead details</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Fact label="Stage" value={lead.stage.replace(/_/g, " ").toLowerCase()} />
              <Fact label="Source" value={lead.source.replace(/_/g, " ").toLowerCase()} />
              <Fact label="Score" value={`${lead.score} / 100`} />
              <Fact label="Next action" value={nextActionLabel(lead.stage)} />
              <Fact label="Interested in" value={lead.interestedIn ?? "Not recorded"} />
              <Fact label="Budget" value={lead.budgetRange ?? "Not recorded"} />
              <Fact label="Timeline" value={lead.timeline ?? "Not recorded"} />
              <Fact
                label="Potential value"
                value={lead.orderValueEstimate > 0 ? formatNaira(lead.orderValueEstimate) : "Not recorded"}
              />
            </dl>

            <div className="mt-5 border-t border-royal-900/8 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-royal-900/45">
                Timing
              </p>
              <p className="mt-1 text-sm text-royal-900/75">
In pipeline {relativeDays(lead.createdAt)} &middot;{" "}
              {staleDays === null
                ? "never contacted"
                : `last contact ${lead.lastContactedAt ? relativeDays(lead.lastContactedAt) : ""}`}{" "}
                &middot; {lead.followUps.length} follow-ups logged
              </p>
            </div>

            {lead.notes && (
              <div className="mt-4 rounded-lg bg-royal-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-royal-900/45">Notes</p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-royal-900/80">
                  {lead.notes}
                </p>
              </div>
            )}

            {lead.lostReason && (
              <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                Lost: {lead.lostReason}
              </p>
            )}

            <div className="mt-5 border-t border-royal-900/8 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-royal-900/45">
                Move stage
              </p>
              <LeadStageButtons leadId={lead.id} current={lead.stage} />
            </div>
          </section>

          {/* AI composer */}
          <AiFollowUpComposer
            leadId={lead.id}
            leadName={lead.fullName}
            phone={lead.phone}
            initialSuggestion={initialSuggestion}
          />

          <FollowUpHistory
            followUps={lead.followUps.map((f) => ({
              id: f.id,
              channel: f.channel,
              status: f.status,
              scheduledAt: f.scheduledAt,
              sentAt: f.sentAt,
              outcome: f.outcome,
              finalMessage: f.finalMessage,
              aiSuggestedMessage: f.aiSuggestedMessage,
              aiTone: f.aiTone,
              aiModel: f.aiModel,
              user: f.user,
            }))}
          />
        </div>

        <aside className="space-y-6">
          <section className="card p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-royal-950">
              <Sparkles className="h-4 w-4 text-gold-600" /> AI read
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-royal-900/75">{initialSuggestion.summary}</p>
            <dl className="mt-4 space-y-2 border-t border-royal-900/8 pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-royal-900/55">Best channel</dt>
                <dd className="font-medium text-royal-950">{initialSuggestion.channel}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-royal-900/55">Suggested tone</dt>
                <dd className="font-medium text-royal-950">{initialSuggestion.tone}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-royal-900/55">Model</dt>
                <dd className="font-mono text-xs text-royal-900/60">{initialSuggestion.model}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-royal-900/50">
              {initialSuggestion.channelReason}
            </p>
          </section>

          <LeadNotes leadId={lead.id} notes={lead.notesLog} />

          <section className="card p-5">
            <h2 className="font-display text-lg font-semibold text-royal-950">Activity</h2>
            {lead.activities.length === 0 ? (
              <p className="mt-3 text-sm text-royal-900/50">Nothing logged yet.</p>
            ) : (
              <ol className="mt-4 space-y-4">
                {lead.activities.map((activity) => (
                  <li key={activity.id} className="border-l-2 border-royal-900/12 pl-4">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-royal-900/45">
                      {activity.type.replace(/_/g, " ").toLowerCase()}
                    </p>
                    <p className="mt-0.5 text-sm leading-relaxed text-royal-900/80">{activity.summary}</p>
                    <p className="mt-1 text-xs text-royal-900/40">
                      {formatDateTime(activity.createdAt)}
                      {activity.actor && ` by ${activity.actor.fullName}`}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {lead.tags.length > 0 && (
            <section className="card p-5">
              <h2 className="font-display text-lg font-semibold text-royal-950">Tags</h2>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {lead.tags.map((tag) => (
                  <li key={tag} className="rounded-full bg-royal-50 px-2.5 py-1 text-xs text-royal-900/65">
                    {tag}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-royal-900/45">{label}</dt>
      <dd className="mt-0.5 text-sm text-royal-900/85">{value}</dd>
    </div>
  );
}

function TempBadge({ temperature }: { temperature: "HOT" | "WARM" | "COLD" }) {
  const map = {
    HOT: { icon: Flame, className: "bg-red-50 text-red-700" },
    WARM: { icon: Sun, className: "bg-amber-50 text-amber-700" },
    COLD: { icon: Snowflake, className: "bg-royal-50 text-royal-700" },
  } as const;
  const { icon: Icon, className: cls } = map[temperature];

  return (
    <span className={`status-pill ${cls}`}>
      <Icon className="h-3 w-3" /> {temperature} &middot; lead
    </span>
  );
}
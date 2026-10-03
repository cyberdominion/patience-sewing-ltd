import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatNaira, relativeDays } from "@/lib/money";
import { temperatureFor, daysBetween, nextActionLabel } from "@/lib/crm";
import { LeadStageButtons } from "@/components/admin/lead-stage-buttons";
import { CreateLeadForm } from "@/components/admin/create-lead-form";
import { formatPhoneForDisplay } from "@/lib/whatsappPhone";
import { waLink } from "@/lib/whatsapp";
import { Search, Plus, Flame, Snowflake, Sun } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "CRM" };

type SearchParams = Promise<{ q?: string; stage?: string; source?: string; sort?: string }>;

const STAGES = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "WON", "LOST"] as const;

export default async function AdminCrmPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const stage = params.stage ?? "";
  const source = params.source ?? "";
  const sort = params.sort ?? "score";

  const where = {
    ...(query
      ? {
          OR: [
            { fullName: { contains: query, mode: "insensitive" as const } },
            { phone: { contains: query } },
            { email: { contains: query, mode: "insensitive" as const } },
            { interestedIn: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(stage ? { stage: stage as never } : {}),
    ...(source ? { source: source as never } : {}),
  };

  const orderBy =
    sort === "newest"
      ? { createdAt: "desc" as const }
      : sort === "value"
        ? { orderValueEstimate: "desc" as const }
        : sort === "stale"
          ? { lastContactedAt: { sort: "asc" as const, nulls: "first" as const } }
          : { score: "desc" as const };

  const [leads, stageCounts, pipelineValue, sourceCounts] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: [orderBy],
      take: 100,
      include: {
        followUps: { orderBy: { scheduledAt: "desc" }, take: 3 },
        _count: { select: { followUps: true } },
      },
    }),
    prisma.lead.groupBy({ by: ["stage"], _count: { _all: true } }),
    prisma.lead.aggregate({
      _sum: { orderValueEstimate: true },
      where: { stage: { in: ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION"] } },
    }),
    prisma.lead.groupBy({ by: ["source"], _count: { _all: true } }),
  ]);

  const countMap = Object.fromEntries(stageCounts.map((s) => [s.stage, s._count._all]));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-royal-950">CRM and leads</h1>
          <p className="mt-1 text-sm text-royal-900/60">
            {leads.length} leads shown &middot;{" "}
            {formatNaira(pipelineValue._sum.orderValueEstimate ?? 0)} open pipeline value
          </p>
        </div>
        <a href="#new-lead" className="btn btn-primary">
          <Plus className="h-4 w-4" /> Add lead
        </a>
      </header>

      {/* source summary */}
      <section className="card p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-royal-900/50">Lead sources</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {sourceCounts.map((s) => (
            <Link
              key={s.source}
              href={`/admin/crm?source=${s.source}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                source === s.source
                  ? "bg-royal-900 text-white"
                  : "bg-royal-50 text-royal-900/70 hover:bg-royal-100"
              }`}
            >
              {s.source.replace(/_/g, " ").toLowerCase()} <span className="ml-1 opacity-70">{s._count._all}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* pipeline strip */}
      <section className="card p-5">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {STAGES.map((s) => (
            <a
              key={s}
              href={`/admin/crm?stage=${stage === s ? "" : s}`}
              className={`rounded-lg p-3 text-center transition-colors ${
                stage === s ? "bg-royal-900 text-white" : "hover:bg-royal-50"
              }`}
            >
              <span className="block text-2xl font-semibold">{countMap[s] ?? 0}</span>
              <span
                className={`block text-[0.65rem] font-semibold uppercase tracking-wider ${
                  stage === s ? "text-gold-300" : "text-royal-900/50"
                }`}
              >
                {s.replace(/_/g, " ")}
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* filters */}
      <section className="card p-5">
        <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-royal-900/40" />
            <input
              name="q"
              defaultValue={query}
              placeholder="Name, phone, email or interest"
              className="input pl-9"
              aria-label="Search leads"
            />
          </div>
          <select name="stage" defaultValue={stage} className="input" aria-label="Filter by stage">
            <option value="">All stages</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")} ({countMap[s] ?? 0})
              </option>
            ))}
          </select>
          <select name="source" defaultValue={source} className="input" aria-label="Filter by source">
            <option value="">All sources</option>
            {["WHATSAPP", "INSTAGRAM", "FACEBOOK", "WEBSITE", "REFERRAL", "WALK_IN", "MARKET", "PAYMENT_LINK", "OTHER"].map(
              (s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ").toLowerCase()}
                </option>
              ),
            )}
          </select>
          <select name="sort" defaultValue={sort} className="input" aria-label="Sort">
            <option value="score">Sort: score</option>
            <option value="stale">Sort: least recently contacted</option>
            <option value="value">Sort: highest value</option>
            <option value="newest">Sort: newest</option>
          </select>
          <button type="submit" className="btn btn-outline sm:col-span-2 lg:col-span-5">
            Apply filters
          </button>
        </form>
      </section>

      {/* leads */}
      {leads.length === 0 ? (
        <section className="card p-12 text-center">
          <p className="text-sm text-royal-900/55">No leads match those filters.</p>
        </section>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => {
            const temperature = temperatureFor(lead.score);
            const staleDays = lead.lastContactedAt ? daysBetween(lead.lastContactedAt) : null;
            const nextFollowUp = lead.followUps.find((f) => f.status === "PENDING");

            return (
              <article key={lead.id} className="card p-5">
                <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/crm/${lead.id}`}
                        className="font-display text-lg font-semibold text-royal-950 hover:underline"
                      >
                        {lead.fullName}
                      </Link>
                      <TemperatureBadge temperature={temperature} />
                      {lead.score > 0 && (
                        <span className="text-xs text-royal-900/45">score {lead.score}</span>
                      )}
                      <span className="status-pill bg-royal-50 text-royal-700">
                        {lead.stage.replace(/_/g, " ").toLowerCase()}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-royal-900/60">
                      <a
                        href={waLink(`Good day ${lead.fullName}, this is Patience Sewing Ltd following up.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-royal-900 hover:underline"
                      >
                        {formatPhoneForDisplay(lead.phone)}
                      </a>
                      {lead.email && <span>{lead.email}</span>}
                      <span>{lead.source.replace(/_/g, " ").toLowerCase()}</span>
                      {lead.city && <span>{lead.city}, {lead.state}</span>}
                    </div>

                    <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                      {lead.interestedIn && (
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wider text-royal-900/45">
                            Interested in
                          </dt>
                          <dd className="text-royal-900/80">{lead.interestedIn}</dd>
                        </div>
                      )}
                      {lead.budgetRange && (
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wider text-royal-900/45">
                            Budget
                          </dt>
                          <dd className="text-royal-900/80">{lead.budgetRange}</dd>
                        </div>
                      )}
                      {lead.timeline && (
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wider text-royal-900/45">
                            Timeline
                          </dt>
                          <dd className="text-royal-900/80">{lead.timeline}</dd>
                        </div>
                      )}
                    </dl>

                    <p className="mt-3 text-xs text-royal-900/50">
                      In pipeline {relativeDays(lead.createdAt)} &middot;{" "}
                      {staleDays === null
                        ? "never contacted"
                        : staleDays === 0
                          ? "contacted today"
                          : `${staleDays} days since contact`}
                      {nextFollowUp && (
                        <span className="ml-2 text-gold-700">
                          next follow-up {relativeDays(nextFollowUp.scheduledAt)}
                        </span>
                      )}
                    </p>

                    {lead.tags.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {lead.tags.map((tag) => (
                          <li
                            key={tag}
                            className="rounded-full bg-royal-50 px-2 py-0.5 text-[0.65rem] text-royal-900/60"
                          >
                            {tag}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex flex-col justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-royal-900/45">
                        Next action
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-royal-950">
                        {nextActionLabel(lead.stage)}
                      </p>
                      {lead.orderValueEstimate > 0 && (
                        <p className="mt-1 text-sm text-gold-700">
                          {formatNaira(lead.orderValueEstimate)} potential
                        </p>
                      )}
                    </div>

                    <LeadStageButtons leadId={lead.id} current={lead.stage} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* manual entry */}
      <section id="new-lead" className="card scroll-mt-8 p-6">
        <h2 className="font-display text-2xl font-semibold text-royal-950">Add a lead manually</h2>
        <p className="mt-1.5 text-sm text-royal-900/60">
          For walk-ins, phone calls, or someone who walked past the shop. Scoring runs automatically.
        </p>
        <div className="mt-6">
          <CreateLeadForm />
        </div>
      </section>
    </div>
  );
}

function TemperatureBadge({ temperature }: { temperature: "HOT" | "WARM" | "COLD" }) {
  const map = {
    HOT: { icon: Flame, className: "bg-red-50 text-red-700" },
    WARM: { icon: Sun, className: "bg-amber-50 text-amber-700" },
    COLD: { icon: Snowflake, className: "bg-royal-50 text-royal-700" },
  } as const;

  const { icon: Icon, className: cls } = map[temperature];

  return (
    <span className={`status-pill ${cls}`}>
      <Icon className="h-3 w-3" />
      {temperature}
    </span>
  );
}
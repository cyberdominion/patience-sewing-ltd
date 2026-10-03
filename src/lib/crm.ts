import "server-only";
import type { FollowUpChannel, Lead, LeadStage } from "@prisma/client";
import { formatNaira } from "./money";

export type AiBrief = {
  fullName: string;
  stage: LeadStage;
  source: string;
  interestedIn: string | null;
  budgetRange: string | null;
  timeline: string | null;
  notes: string | null;
  orderValueEstimate: number;
  daysInPipeline: number;
  lastContactedAt: Date | null;
  lastOutcomes: string[];
  preferredChannel: FollowUpChannel;
};

export type AiSuggestion = {
  summary: string;
  suggestedMessage: string;
  tone: string;
  channel: FollowUpChannel;
  model: string;
  channelReason: string;
};

/** Lead stages that mean the sale is not closed yet. */
export const OPEN_STAGES: LeadStage[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
];

export function daysBetween(from: Date, to: Date = new Date()): number {
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / 86_400_000));
}

/**
 * A simple, explainable lead score out of 100.
 * Deliberately rule-based rather than ML: sales staff need to be able to see
 * exactly why a lead ranks where it does.
 */
export function scoreLead(lead: {
  stage: LeadStage;
  source: string;
  budgetRange?: string | null;
  timeline?: string | null;
  orderValueEstimate?: number;
  interestedIn?: string | null;
  notes?: string | null;
}): number {
  let score = 0;

  const stageWeight: Record<LeadStage, number> = {
    NEW: 5,
    CONTACTED: 15,
    QUALIFIED: 30,
    PROPOSAL_SENT: 45,
    NEGOTIATION: 60,
    WON: 100,
    LOST: 0,
  };
  score += stageWeight[lead.stage];

  const sourceWeight: Record<string, number> = {
    REFERRAL: 22,
    WALK_IN: 20,
    INSTAGRAM: 16,
    WHATSAPP: 16,
    WEBSITE: 12,
    PAYMENT_LINK: 12,
    MARKET: 8,
    FACEBOOK: 8,
    OTHER: 5,
  };
  score += sourceWeight[lead.source] ?? 5;

  if (lead.budgetRange) {
    if (/500|1m|million|above|1,000/i.test(lead.budgetRange)) score += 15;
    else if (/250|300|400/i.test(lead.budgetRange)) score += 10;
    else score += 5;
  }

  if (lead.timeline) {
    if (/now|today|urgent|this week/i.test(lead.timeline)) score += 15;
    else if (/month|2 weeks/i.test(lead.timeline)) score += 10;
    else score += 4;
  }

  if ((lead.orderValueEstimate ?? 0) >= 1_000_000) score += 12;
  else if ((lead.orderValueEstimate ?? 0) > 0) score += 6;

  if (lead.interestedIn) score += 5;
  if (lead.notes && lead.notes.length > 40) score += 4;

  return Math.min(100, score);
}

export function temperatureFor(score: number): "HOT" | "WARM" | "COLD" {
  if (score >= 70) return "HOT";
  if (score >= 40) return "WARM";
  return "COLD";
}

/**
 * Picks the best contact channel. A lead that came in on WhatsApp and never
 * got a reply stays on WhatsApp, since switching channels usually loses them.
 */
export function preferredChannelFor(lead: { source: string; lastOutcomes: string[] }): FollowUpChannel {
  const repliedElsewhere = lead.lastOutcomes.some((o) =>
    /answered|call.*connected|replied/i.test(o),
  );
  if (repliedElsewhere) return "PHONE";
  if (lead.source === "EMAIL" || lead.source === "WEBSITE") return "WHATSAPP";
  return "WHATSAPP";
}

export function channelReason(channel: FollowUpChannel): string {
  switch (channel) {
    case "WHATSAPP":
      return "Highest open and reply rate for Nigerian retail buyers";
    case "PHONE":
      return "Lead has responded to calls before; a voice call will close faster";
    case "EMAIL":
      return "Best for sending a detailed quote or catalogue PDF";
    case "SMS":
      return "Use for a short nudge when WhatsApp has gone quiet";
    case "IN_PERSON":
      return "Close enough to Bayelsa for a showroom visit";
  }
}

export function buildBrief(lead: Lead & { followUps: { outcome: string | null }[] }): AiBrief {
  const outcomes = lead.followUps.map((f) => f.outcome ?? "").filter(Boolean);
  return {
    fullName: lead.fullName,
    stage: lead.stage,
    source: lead.source,
    interestedIn: lead.interestedIn,
    budgetRange: lead.budgetRange,
    timeline: lead.timeline,
    notes: lead.notes,
    orderValueEstimate: lead.orderValueEstimate,
    daysInPipeline: daysBetween(lead.createdAt),
    lastContactedAt: lead.lastContactedAt,
    lastOutcomes: outcomes,
    preferredChannel: preferredChannelFor({ source: lead.source, lastOutcomes: outcomes }),
  };
}

const SYSTEM_PROMPT = `You are the sales assistant for Patience Sewing Ltd, a bespoke Nigerian fashion house and factory in Yenagoa, Bayelsa State. You write WhatsApp and phone follow-up messages to customer and wholesale-retailer leads.

Rules:
- Nigerian English, warm and respectful. Never condescending.
- Nigerian names are real names; greet people by their actual name.
- Mention Nigerian fabric and styling context where natural: aso-oke, lace, bouye, Ankara, senator style, iro and buba, gele, Occasions.
- Lead with one clear, low-friction next step. Never more than one ask.
- Keep messages under 90 words. WhatsApp messages must be plain text with no markdown asterisks.
- Never invent stock, delivery dates, discounts or prices that were not provided.
- Do not use exclamation marks more than once.`;

export function userPromptFor(brief: AiBrief): string {
  return `Write a follow-up message to this lead.

Lead name: ${brief.fullName}
Pipeline stage: ${brief.stage}
Acquisition source: ${brief.source}
Interested in: ${brief.interestedIn ?? "not recorded"}
Budget: ${brief.budgetRange ?? "not recorded"}
Timeline: ${brief.timeline ?? "not recorded"}
Estimated order value: ${brief.orderValueEstimate > 0 ? formatNaira(brief.orderValueEstimate) : "not recorded"}
Days in pipeline: ${brief.daysInPipeline}
Last contacted: ${brief.lastContactedAt ? brief.lastContactedAt.toDateString() : "never"}
Previous outcomes: ${brief.lastOutcomes.length ? brief.lastOutcomes.join("; ") : "no contact logged yet"}

Produce a one-sentence summary of where this lead stands, then the message. Tone it for the ${brief.stage} stage.`;
}

type Completion = { summary: string; message: string; tone: string };

/**
 * Calls an OpenAI-compatible chat completions endpoint.
 * Returns null on any failure so the caller can fall back to templates rather
 * than blocking a salesperson's workflow.
 */
async function callModel(brief: AiBrief): Promise<Completion | null> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return null;

  const baseUrl = (process.env.AI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.AI_MODEL ?? "gpt-4o-mini";

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `${userPromptFor(brief)}

Respond with JSON: {"summary": string, "message": string, "tone": string}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) return null;
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return null;

    const parsed = JSON.parse(content) as Completion;
    if (!parsed.message || !parsed.summary) return null;

    return {
      summary: String(parsed.summary).slice(0, 400),
      message: String(parsed.message).slice(0, 1200),
      tone: String(parsed.tone ?? "professional").slice(0, 40),
    };
  } catch {
    return null;
  }
}

/**
 * Deterministic template used when no AI key is configured or the API is down.
 * Stage-aware so the fallback is still useful in production.
 */
function templateSuggestion(brief: AiBrief): AiSuggestion {
  const first = brief.fullName.split(" ")[0];

  const summaryByStage: Record<LeadStage, string> = {
    NEW: `${first} just came in through ${brief.source.toLowerCase().replace(/_/g, " ")} and has not been contacted yet. First contact should qualify budget and occasion.`,
    CONTACTED: `We have spoken to ${first} ${brief.daysInPipeline} day${brief.daysInPipeline === 1 ? "" : "s"} ago but have not qualified the interest.`,
    QUALIFIED: `${first} is a qualified lead${brief.budgetRange ? ` with a ${brief.budgetRange} budget` : ""}${brief.timeline ? ` buying ${brief.timeline}` : ""}. Ready to send a quote.`,
    PROPOSAL_SENT: `A proposal went out to ${first} ${brief.daysInPipeline} days ago with no response. Needs a nudge, not a new pitch.`,
    NEGOTIATION: `${first} is negotiating${brief.orderValueEstimate ? ` on ${formatNaira(brief.orderValueEstimate)}` : ""}. Close on terms or timeline.`,
    WON: `${first} is a won customer. Move to aftercare and referrals.`,
    LOST: `${first} went cold. Re-engage gently at the next occasion.`,
  };

  const messageByStage: Record<LeadStage, string> = {
    NEW: `Good day ${first}, this is Patience from Patience Sewing Ltd in Yenagoa. Thank you for reaching out. Which occasion are you sewing for, and roughly how many pieces would you like? I will send you designs that fit both.`,
    CONTACTED: `Good day ${first}, following up on our chat. I have pulled together a few designs you may like. Shall I send the catalogue so you can shortlist?`,
    QUALIFIED: `Good day ${first}, here is the quote you asked for${
      brief.orderValueEstimate ? `, ${formatNaira(brief.orderValueEstimate)}` : ""
    }. Production takes 10 to 14 days${
      brief.timeline ? ` and that fits the ${brief.timeline.toLowerCase()} timeline you mentioned` : ""
    }. Shall I start the first sample?`,
    PROPOSAL_SENT: `Good day ${first}, just checking if the quote reached you. I am holding fabric for you until Friday. If the budget needs adjusting I can suggest a lighter fabric that keeps the look.`,
    NEGOTIATION: `Good day ${first}, thank you for your patience. I can meet you at ${
      brief.orderValueEstimate ? formatNaira(Math.round(brief.orderValueEstimate * 0.95)) : "a slightly adjusted budget"
    } if that helps you decide. Shall I update the order for you?`,
    WON: `Good day ${first}, your order is on the cutting table and I will send photos as it comes together. Do you have a fitting date in mind?`,
    LOST: `Good day ${first}, I hope you were well. We have new fabric in this week and it made me think of you. If you ever want to sew again, I am here.`,
  };

  const tone = brief.stage === "WON" ? "warm" : brief.stage === "NEGOTIATION" ? "conciliatory" : "professional";

  return {
    summary: summaryByStage[brief.stage],
    suggestedMessage: messageByStage[brief.stage],
    tone,
    channel: brief.preferredChannel,
    model: "template-fallback",
    channelReason: channelReason(brief.preferredChannel),
  };
}

export async function generateFollowUp(brief: AiBrief): Promise<AiSuggestion> {
  const completion = await callModel(brief);
  if (!completion) return templateSuggestion(brief);

  return {
    summary: completion.summary,
    suggestedMessage: completion.message,
    tone: completion.tone,
    channel: brief.preferredChannel,
    model: process.env.AI_MODEL ?? "gpt-4o-mini",
    channelReason: channelReason(brief.preferredChannel),
  };
}

/**
 * Bulk-draft follow-ups for a stage (used by the CRM "draft next wave" action).
 */
export async function generateForLeads(leads: Array<Lead & { followUps: { outcome: string | null }[] }>) {
  const results = [];
  for (const lead of leads) {
    const brief = buildBrief(lead);
    const suggestion = await generateFollowUp(brief);
    results.push({ leadId: lead.id, brief, suggestion });
  }
  return results;
}

export function nextActionLabel(stage: LeadStage): string {
  const map: Record<LeadStage, string> = {
    NEW: "Make first contact",
    CONTACTED: "Qualify interest",
    QUALIFIED: "Send quote",
    PROPOSAL_SENT: "Follow up on proposal",
    NEGOTIATION: "Close the deal",
    WON: "Start aftercare",
    LOST: "Re-engage later",
  };
  return map[stage];
}
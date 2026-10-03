"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { buildBrief, generateFollowUp } from "@/lib/crm";
import { failure, success, type ActionState } from "@/lib/action-types";

export type Suggestion = {
  summary: string;
  suggestedMessage: string;
  tone: string;
  channel: string;
  model: string;
  channelReason: string;
};

export type RegenerateState = ActionState & { suggestion?: Suggestion };

/**
 * Regenerates AI copy on demand. Called from the composer when the salesperson
 * asks for a different angle, tone, or channel.
 */
export async function regenerateFollowUpAction(
  _prev: RegenerateState,
  formData: FormData,
): Promise<RegenerateState> {
  await requireAdmin();

  const leadId = String(formData.get("leadId") ?? "");
  const toneHint = String(formData.get("toneHint") ?? "").trim();

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { followUps: { orderBy: { scheduledAt: "desc" }, take: 10 } },
  });

  if (!lead) return failure("That lead no longer exists.");

  const brief = buildBrief(lead);
  const suggestion = await generateFollowUp(brief);

  // Fold the requested angle into the copy the salesperson actually sees.
  const message = toneHint
    ? `[${toneHint}]\n\n${suggestion.suggestedMessage}`
    : suggestion.suggestedMessage;

  return {
    ok: true,
    message: suggestion.summary,
    suggestion: {
      summary: suggestion.summary,
      suggestedMessage: message,
      tone: toneHint || suggestion.tone,
      channel: suggestion.channel,
      model: suggestion.model,
      channelReason: suggestion.channelReason,
    },
  };
}

/** Saves an accepted or hand-edited AI message as a scheduled follow-up. */
export async function scheduleFollowUpAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();

  const leadId = String(formData.get("leadId") ?? "");
  const channel = String(formData.get("channel") ?? "WHATSAPP");
  const scheduledAt = new Date(String(formData.get("scheduledAt") ?? ""));
  const message = String(formData.get("message") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const tone = String(formData.get("tone") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();

  if (!leadId) return failure("Missing lead.");
  if (!message) return failure("Write or accept an AI message before scheduling.");

  const when = Number.isNaN(scheduledAt.getTime()) ? new Date() : scheduledAt;

  await prisma.$transaction([
    prisma.followUp.create({
      data: {
        leadId,
        userId: admin.id,
        channel: channel as never,
        status: "PENDING",
        scheduledAt: when,
        finalMessage: message,
        aiSummary: summary || null,
        aiTone: tone || null,
        aiModel: model || null,
        aiSuggestedMessage: message,
        aiAcceptedAt: new Date(),
      },
    }),
    prisma.lead.update({
      where: { id: leadId },
      data: { nextFollowUpAt: when },
    }),
    prisma.leadActivity.create({
      data: {
        leadId,
        actorId: admin.id,
        type: "FOLLOW_UP_SCHEDULED",
        summary: `Scheduled ${channel.toLowerCase()} follow-up for ${when.toLocaleString("en-NG")}`,
      },
    }),
  ]);

  revalidatePath(`/admin/crm/${leadId}`);
  revalidatePath("/admin/follow-ups");
  return success(`Follow-up scheduled for ${when.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}`);
}

export async function rescheduleFollowUpAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("followUpId") ?? "");
  const when = new Date(String(formData.get("scheduledAt") ?? ""));
  if (Number.isNaN(when.getTime())) return;

  const followUp = await prisma.followUp.findUnique({ where: { id } });
  if (!followUp) return;

  await prisma.followUp.update({
    where: { id },
    data: { scheduledAt: when, status: "PENDING" },
  });

  await prisma.lead.update({
    where: { id: followUp.leadId },
    data: { nextFollowUpAt: when },
  });

  revalidatePath(`/admin/crm/${followUp.leadId}`);
  revalidatePath("/admin/follow-ups");
}

export async function cancelFollowUpAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("followUpId") ?? "");
  await prisma.followUp.update({ where: { id }, data: { status: "CANCELLED" } }).catch(() => undefined);
  revalidatePath("/admin/follow-ups");
}

export async function copyFollowUpTemplateAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("followUpId") ?? "");
  const followUp = await prisma.followUp.findUnique({ where: { id } });
  if (!followUp) return failure("That follow-up no longer exists.");
  return success("Copied");
}
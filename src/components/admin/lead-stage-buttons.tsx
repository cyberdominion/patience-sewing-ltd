"use client";

import { useTransition } from "react";
import { updateLeadStageAction } from "@/app/admin/actions";

const STAGES = [
  { value: "NEW", label: "New" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "PROPOSAL_SENT", label: "Proposal" },
  { value: "NEGOTIATION", label: "Negotiating" },
  { value: "WON", label: "Won" },
  { value: "LOST", label: "Lost" },
] as const;

export function LeadStageButtons({
  leadId,
  current,
  compact = false,
}: {
  leadId: string;
  current: string;
  compact?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(async () => {
          await updateLeadStageAction(data);
        });
      }}
      className={compact ? "flex flex-wrap gap-1.5" : "grid grid-cols-3 gap-1.5"}
    >
      <input type="hidden" name="leadId" value={leadId} />
      {STAGES.map((stage) => {
        const active = current === stage.value;
        return (
          <button
            key={stage.value}
            type="submit"
            name="stage"
            value={stage.value}
            disabled={pending || active}
            className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors disabled:cursor-default ${
              active
                ? stage.value === "WON"
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : stage.value === "LOST"
                    ? "border-royal-900 bg-royal-900 text-white"
                    : "border-royal-900 bg-royal-900 text-white"
                : "border-royal-900/20 text-royal-900/70 hover:border-royal-400 hover:bg-royal-50"
            }`}
          >
            {stage.label}
          </button>
        );
      })}
      {pending && <p className="col-span-3 text-center text-xs text-royal-900/50">Saving</p>}
    </form>
  );
}
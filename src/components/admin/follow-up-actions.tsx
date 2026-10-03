"use client";

import { useTransition } from "react";
import { markFollowUpSentAction, recordFollowUpOutcomeAction } from "@/app/admin/actions";

const OUTCOMES = [
  { value: "Answered, interested, follow-up booked", short: "Interested" },
  { value: "Answered but no decision yet", short: "Still deciding" },
  { value: "Not answered, will try again", short: "No answer" },
  { value: "Asked to call back later", short: "Call back" },
  { value: "Wrong number or no longer interested", short: "Closed" },
];

export function FollowUpMarkSent({ followUpId }: { followUpId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(async () => {
          await markFollowUpSentAction(data);
        });
      }}
    >
      <input type="hidden" name="followUpId" value={followUpId} />
      <button type="submit" disabled={pending} className="btn btn-outline w-full !py-2 text-sm">
        {pending ? "Saving" : "Mark as sent"}
      </button>
    </form>
  );
}

export function OutcomeButtons({ followUpId }: { followUpId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-1.5">
      {OUTCOMES.map((outcome) => (
        <button
          key={outcome.value}
          type="submit"
          formAction={recordFollowUpOutcomeAction}
          formNoValidate
          name="outcome"
          value={outcome.value}
          disabled={pending}
          onClick={(event) => {
            const form = event.currentTarget.form;
            if (form) {
              // Reuse the surrounding form's hidden followUpId input.
              event.preventDefault();
              const data = new FormData();
              data.set("followUpId", followUpId);
              data.set("outcome", outcome.value);
              startTransition(async () => {
                await recordFollowUpOutcomeAction(data);
              });
            }
          }}
          className="block w-full rounded-lg border border-royal-900/12 px-2.5 py-1.5 text-left text-xs text-royal-900/75 transition-colors hover:border-royal-400 hover:bg-royal-50 disabled:opacity-50"
        >
          {outcome.short}
        </button>
      ))}
      {pending && <p className="text-center text-xs text-royal-900/50">Saving</p>}
    </div>
  );
}
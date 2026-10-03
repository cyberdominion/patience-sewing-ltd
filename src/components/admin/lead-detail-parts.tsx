"use client";

import { useActionState, useState } from "react";
import {
  Wand2,
  Copy,
  Check,
  Clock,
  MessageCircle,
  Phone,
  Mail,
  MessageSquare,
  Loader2,
  ExternalLink,
} from "lucide-react";
import {
  regenerateFollowUpAction,
  scheduleFollowUpAction,
  type RegenerateState,
} from "@/app/admin/crm/actions";
import { initialState, type ActionState } from "@/lib/action-types";
import { normalisePhone } from "@/lib/whatsappPhone";

export type Suggestion = {
  summary: string;
  suggestedMessage: string;
  tone: string;
  channel: string;
  model: string;
  channelReason: string;
};

const CHANNELS = [
  { value: "WHATSAPP", icon: MessageCircle },
  { value: "PHONE", icon: Phone },
  { value: "EMAIL", icon: Mail },
  { value: "SMS", icon: MessageSquare },
  { value: "IN_PERSON", icon: Clock },
] as const;

const ANGLES = [
  "Softer, just a check-in",
  "Offer a smaller starting order",
  "Mention a restock deadline",
  "Ask for the fitting date",
  "Reference their event date",
  "Assume they are ready to decide",
];

export function AiFollowUpComposer({
  leadId,
  leadName,
  phone,
  initialSuggestion,
}: {
  leadId: string;
  leadName: string;
  phone: string;
  initialSuggestion: Suggestion;
}) {
  const [regenState, regenAction, regenPending] = useActionState<RegenerateState, FormData>(
    regenerateFollowUpAction,
    initialState() as RegenerateState,
  );

  const [scheduleState, scheduleAction, schedulePending] = useActionState(
    scheduleFollowUpAction,
    initialState(),
  );

  const [message, setMessage] = useState(initialSuggestion.suggestedMessage);
  const [summary, setSummary] = useState(initialSuggestion.summary);
  const [tone, setTone] = useState(initialSuggestion.tone);
  const [model, setModel] = useState(initialSuggestion.model);
  const [channel, setChannel] = useState(initialSuggestion.channel);
  const [angle, setAngle] = useState("");
  const [copied, setCopied] = useState(false);
  const [edited, setEdited] = useState(false);

  // Adopt freshly generated copy. Adjusting state during render (rather than in
  // an effect) avoids a wasted render pass and keeps the editor in sync.
  const [applied, setApplied] = useState<RegenerateState["suggestion"] | undefined>();
  if (regenState?.suggestion && regenState.suggestion !== applied) {
    setApplied(regenState.suggestion);
    setMessage(regenState.suggestion.suggestedMessage);
    setSummary(regenState.suggestion.summary);
    setTone(regenState.suggestion.tone);
    setModel(regenState.suggestion.model);
    setChannel(regenState.suggestion.channel);
    setEdited(false);
  }

  const firstName = leadName.split(" ")[0];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const whatsappHref = `https://wa.me/${normalisePhone(phone)}?text=${encodeURIComponent(message)}`;

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-royal-900/8 bg-gradient-to-r from-royal-900 to-royal-800 px-5 py-4">
        <div className="flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-gold-400" />
          <h2 className="font-display text-lg font-semibold text-white">AI assisted follow-up</h2>
        </div>
        <div className="flex items-center gap-2">
          {edited && <span className="text-[0.65rem] text-gold-300">Edited by you</span>}
          <span className="status-pill bg-white/10 text-gold-200">{model}</span>
        </div>
      </div>

      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-royal-900/45">
          Where this lead stands
        </p>
        <p className="mt-1 text-sm leading-relaxed text-royal-900/80">{summary}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-royal-900/45">{initialSuggestion.channelReason}</p>

        {/* channel picker */}
        <div className="mt-5">
          <p className="label">Channel</p>
          <div className="flex flex-wrap gap-2">
            {CHANNELS.map(({ value, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setChannel(value)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  channel === value
                    ? "border-royal-900 bg-royal-900 text-white"
                    : "border-royal-900/20 text-royal-900/70 hover:border-royal-400"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {value === "IN_PERSON" ? "In person" : value.toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* message editor */}
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <label className="label !mb-0" htmlFor="ai-message">
              Message
            </label>
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-royal-800 hover:underline"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <textarea
            id="ai-message"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setEdited(true);
            }}
            rows={6}
            className="input mt-1.5 resize-y font-[inherit] leading-relaxed"
          />
          <p className="mt-1 text-xs text-royal-900/45">
            {message.trim().split(/\s+/).filter(Boolean).length} words &middot; edit freely, the
            text you keep is what gets scheduled.
          </p>
        </div>

        {/* regenerate with an angle */}
        <form action={regenAction} className="mt-5">
          <input type="hidden" name="leadId" value={leadId} />
          <input type="hidden" name="toneHint" value={angle} />
          <p className="label">Rewrite with a different angle</p>
          <div className="flex flex-wrap gap-2">
            {ANGLES.map((option) => (
              <button
                key={option}
                type="submit"
                name="toneHint"
                value={option}
                disabled={regenPending}
                onClick={() => setAngle(option)}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors disabled:opacity-50 ${
                  angle === option
                    ? "border-gold-500 bg-gold-50 text-gold-800"
                    : "border-royal-900/20 text-royal-900/70 hover:border-royal-400"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          {regenPending && (
            <p className="mt-2 flex items-center gap-2 text-xs text-royal-900/55">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Rewriting
            </p>
          )}
        </form>

        {/* actions */}
        <div className="mt-6 flex flex-wrap gap-3 border-t border-royal-900/8 pt-5">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn bg-[#25D366] text-white hover:brightness-105"
          >
            <MessageCircle className="h-4 w-4" /> Send on WhatsApp
            <ExternalLink className="h-3 w-3 opacity-70" />
          </a>

          <a href={`tel:${normalisePhone(phone)}`} className="btn btn-outline">
            <Phone className="h-4 w-4" /> Call {firstName}
          </a>

          <form action={scheduleAction} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="leadId" value={leadId} />
            <input type="hidden" name="channel" value={channel} />
            <input type="hidden" name="message" value={message} />
            <input type="hidden" name="summary" value={summary} />
            <input type="hidden" name="tone" value={tone} />
            <input type="hidden" name="model" value={model} />
            <div>
              <label className="label !mb-1" htmlFor="scheduledAt">
                Remind me
              </label>
              <input
                id="scheduledAt"
                name="scheduledAt"
                type="datetime-local"
                defaultValue={defaultWhen()}
                className="input !py-2 text-sm"
                required
              />
            </div>
            <button type="submit" disabled={schedulePending} className="btn btn-primary !py-2 text-sm">
              {schedulePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
              Schedule
            </button>
          </form>
        </div>

        {scheduleState.message && (
          <p
            role="status"
            className={`mt-3 rounded-lg p-2.5 text-xs ${
              scheduleState.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
            }`}
          >
            {scheduleState.message}
          </p>
        )}

        <p className="mt-4 text-xs leading-relaxed text-royal-900/40">
          AI drafts are a starting point. Nothing is sent to the customer automatically &mdash; you
          read it, edit it, and send it yourself.
        </p>
      </div>
    </section>
  );
}

function defaultWhen(): string {
  const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function FollowUpHistory({
  followUps,
}: {
  followUps: {
    id: string;
    channel: string;
    status: string;
    scheduledAt: Date | string;
    sentAt: Date | string | null;
    outcome: string | null;
    finalMessage: string | null;
    aiSuggestedMessage: string | null;
    aiTone: string | null;
    aiModel: string | null;
    user: { fullName: string } | null;
  }[];
}) {
  return (
    <section className="card p-5">
      <h2 className="font-display text-lg font-semibold text-royal-950">Follow-up history</h2>
      {followUps.length === 0 ? (
        <p className="mt-3 text-sm text-royal-900/50">No follow-ups logged yet.</p>
      ) : (
        <ol className="mt-4 space-y-4">
          {followUps.map((followUp) => (
            <li key={followUp.id} className="border-l-2 border-royal-900/12 pl-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="status-pill bg-royal-50 text-royal-700">{followUp.channel}</span>
                <span
                  className={`status-pill ${
                    followUp.status === "REPLIED"
                      ? "bg-emerald-50 text-emerald-800"
                      : followUp.status === "SENT"
                        ? "bg-royal-100 text-royal-800"
                        : followUp.status === "NO_RESPONSE"
                          ? "bg-amber-50 text-amber-800"
                          : followUp.status === "CANCELLED"
                            ? "bg-royal-100 text-royal-900/50"
                            : "bg-royal-50 text-royal-700"
                  }`}
                >
                  {followUp.status.replace(/_/g, " ").toLowerCase()}
                </span>
                <span className="text-xs text-royal-900/45">
                  {new Date(followUp.scheduledAt).toLocaleString("en-NG", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
                {followUp.aiModel && (
                  <span className="text-[0.65rem] text-royal-900/35">{followUp.aiModel}</span>
                )}
              </div>

              {(followUp.finalMessage || followUp.aiSuggestedMessage) && (
                <p className="mt-2 whitespace-pre-wrap rounded-lg bg-royal-50 p-3 text-sm leading-relaxed text-royal-900/80">
                  {followUp.finalMessage ?? followUp.aiSuggestedMessage}
                </p>
              )}

              {followUp.outcome && (
                <p className="mt-1.5 text-xs text-royal-900/60">
                  Outcome: <span className="text-royal-900/80">{followUp.outcome}</span>
                </p>
              )}
              {followUp.user && (
                <p className="mt-1 text-xs text-royal-900/40">Logged by {followUp.user.fullName}</p>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function LeadNotes({
  leadId,
  notes,
}: {
  leadId: string;
  notes: { id: string; body: string; createdAt: Date | string; user: { fullName: string } | null }[];
}) {
  return (
    <section className="card p-5">
      <h2 className="font-display text-lg font-semibold text-royal-950">Internal notes</h2>
      <NotesForm leadId={leadId} />
      {notes.length > 0 && (
        <ul className="mt-4 space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded-lg bg-royal-50 p-3">
              <p className="text-sm leading-relaxed text-royal-900/80">{note.body}</p>
              <p className="mt-1.5 text-xs text-royal-900/40">
                {new Date(note.createdAt).toLocaleString("en-NG", { dateStyle: "medium" })}
                {note.user && ` by ${note.user.fullName}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function NotesForm({ leadId }: { leadId: string }) {
  const [state, action, pending] = useActionState(saveNoteAction, initialState());
  const [value, setValue] = useState("");

  return (
    <form action={action} className="mt-4">
      <input type="hidden" name="leadId" value={leadId} />
      <label className="sr-only" htmlFor="note-body">
        Note
      </label>
      <textarea
        id="note-body"
        name="body"
        rows={3}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="What happened on that call, what they wore, who referred them"
        className="input resize-y text-sm"
      />
      <div className="mt-2 flex items-center gap-3">
        <button type="submit" disabled={pending || value.trim().length < 2} className="btn btn-primary !py-2 text-sm">
          {pending ? "Saving" : "Save note"}
        </button>
        {state.message && (
          <span className={`text-xs ${state.ok ? "text-emerald-700" : "text-red-600"}`}>
            {state.message}
          </span>
        )}
      </div>
    </form>
  );
}

async function saveNoteAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { saveLeadNotesAction } = await import("@/app/admin/actions");
  return saveLeadNotesAction(_prev, formData);
}
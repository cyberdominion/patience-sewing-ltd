import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/money";
import { formatPhoneForDisplay } from "@/lib/whatsappPhone";
import { markContactHandledAction } from "@/app/admin/actions";
import { Inbox, Mail, Check } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Messages" };

export default async function AdminInboxPage() {
  const [messages, subscribers] = await Promise.all([
    prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  const open = messages.filter((m) => !m.isHandled);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-semibold text-royal-950">Messages</h1>
        <p className="mt-1 text-sm text-royal-900/60">
          {open.length} unhandled &middot; {subscribers.length} recent newsletter subscribers
        </p>
      </header>

      <section>
        <h2 className="flex items-center gap-2 font-display text-2xl font-semibold text-royal-950">
          <Inbox className="h-5 w-5 text-gold-600" /> Website enquiries
        </h2>

        {messages.length === 0 ? (
          <p className="mt-4 card p-8 text-center text-sm text-royal-900/55">
            No enquiries yet. Messages from the contact form land here and in the CRM.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`card p-5 ${message.isHandled ? "opacity-65" : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-royal-950">{message.fullName}</h3>
                      {!message.isHandled && (
                        <span className="status-pill bg-gold-100 text-gold-800">new</span>
                      )}
                      {message.subject && (
                        <span className="text-sm text-royal-900/60">{message.subject}</span>
                      )}
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-royal-900/50">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {message.email}
                      </span>
                      {message.phone && <span>{formatPhoneForDisplay(message.phone)}</span>}
                      <span>{formatDateTime(message.createdAt)}</span>
                    </p>
                  </div>
                  {!message.isHandled && (
                    <form action={markContactHandledAction}>
                      <input type="hidden" name="messageId" value={message.id} />
                      <button type="submit" className="btn btn-outline !py-1.5 text-xs">
                        <Check className="h-3.5 w-3.5" /> Mark handled
                      </button>
                    </form>
                  )}
                </div>

                <p className="mt-3 whitespace-pre-wrap border-t border-royal-900/8 pt-3 text-sm leading-relaxed text-royal-900/80">
                  {message.message}
                </p>

                <div className="mt-3 flex flex-wrap gap-3">
                  <a href={`mailto:${message.email}?subject=Re: ${message.subject ?? "Your enquiry"}`} className="btn btn-primary !py-2 text-xs">
                    Reply by email
                  </a>
                  <Link
                    href={`/admin/crm?q=${encodeURIComponent(message.phone ?? message.email)}`}
                    className="btn btn-outline !py-2 text-xs"
                  >
                    Open in CRM
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-royal-950">Newsletter subscribers</h2>
        <p className="mt-1 text-sm text-royal-900/60">
          {subscribers.length} most recent. Connect an email provider to send campaigns.
        </p>
        {subscribers.length > 0 && (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {subscribers.map((subscriber) => (
              <li key={subscriber.id} className="card px-4 py-3 text-sm">
                <a href={`mailto:${subscriber.email}`} className="text-royal-950 hover:underline">
                  {subscriber.email}
                </a>
                <span className="block text-xs text-royal-900/45">
                  via {subscriber.source ?? "site"} &middot; {formatDateTime(subscriber.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
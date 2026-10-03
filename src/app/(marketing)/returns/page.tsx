import type { Metadata } from "next";
import { waLink } from "@/lib/whatsapp";
import { Ruler, RefreshCcw, Clock, MessageCircle, Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Returns and exchanges",
  description:
    "How returns, exchanges and free adjustments work at Patience Sewing Ltd, plus how to measure for a perfect fit.",
  alternates: { canonical: "/returns" },
};

export default function ReturnsPage() {
  return (
    <div className="container-luxe py-14">
      <header className="max-w-2xl">
        <p className="eyebrow">Customer care</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-royal-950 md:text-5xl">
          Returns, exchanges and free adjustments
        </h1>
        <div className="gold-rule mt-4" />
        <p className="mt-5 leading-relaxed text-royal-900/70">
          We would rather fix it than argue about it. Most problems are fit, and fit is fixable,
          which is why we include one free adjustment.
        </p>
      </header>

      <div className="mt-12 grid gap-8 lg:grid-cols-3">
        {[
          {
            icon: RefreshCcw,
            title: "One free adjustment",
            body: "Within 7 days of delivery, tell us what needs changing and we will do it at no cost. This covers fit, hem length, sleeve length and minor alterations.",
            points: [
              "Send photos on WhatsApp so we can assess it",
              "You pay only postage if the garment has travelled",
              "Turnaround is 3 to 7 days depending on the change",
            ],
          },
          {
            icon: Ruler,
            title: "Wrong size ordered",
            body: "If you ordered the wrong size from the size chart, we can exchange it if the style is in stock. You pay the return postage and any price difference.",
            points: [
              "Exchanges only, no cash refunds on made-to-order pieces",
              "Stock moves fast on some styles",
              "Message us before you post anything back",
            ],
          },
          {
            icon: Check,
            title: "Faulty or not as described",
            body: "If a seam fails, a bead comes loose or the piece is not what we said it was, that is our fault and we fix it or replace it at our cost, including postage.",
            points: [
              "We replace the item, not just repair it",
              "You keep the original until the replacement arrives",
              "No time limit on manufacturing faults",
            ],
          },
        ].map((card) => (
          <section key={card.title} className="card p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold-100 text-gold-700">
              <card.icon className="h-5 w-5" />
            </span>
            <h2 className="mt-5 font-display text-xl font-semibold text-royal-950">
              {card.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-royal-900/70">{card.body}</p>
            <ul className="mt-4 space-y-2">
              {card.points.map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm text-royal-900/65">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-600" />
                  {point}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="mt-14 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl font-semibold text-royal-950">
            Things we cannot take back
          </h2>
          <div className="gold-rule mt-4" />
          <p className="mt-5 leading-relaxed text-royal-900/70">
            Be honest with us about these and we will always tell you before you pay.
          </p>
          <ul className="mt-5 space-y-3">
            {[
              "Custom measurements, once the toile has been approved. The fit was agreed by you, so we cannot redo it for free.",
              "Delivered pieces that have been worn, washed, ironed or altered by another tailor.",
              "Beadwork or lace that has come loose after dry cleaning by someone other than us.",
              "Changes of mind on colourway once production has started.",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-royal-900/70">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-display text-3xl font-semibold text-royal-950">
            How to start a return
          </h2>
          <div className="gold-rule mt-4" />
          <ol className="mt-5 space-y-4">
            {[
              { step: "01", title: "Message us on WhatsApp", body: "Send your order reference, photos of the piece, and what you want changed." },
              { step: "02", title: "We tell you honestly what is possible", body: "Including whether it is free, what it costs, and how long it takes. No surprises." },
              { step: "03", title: "Send it back if needed", body: "We give you the workshop address in Yenagoa. Pack it in a garment bag if you can." },
              { step: "04", title: "We fix or remake it", body: "Then it goes back to you. We message you at each stage." },
            ].map((item) => (
              <li key={item.step} className="flex gap-4">
                <span className="font-display text-2xl font-semibold text-gold-400">
                  {item.step}
                </span>
                <span>
                  <span className="block font-semibold text-royal-950">{item.title}</span>
                  <span className="block text-sm text-royal-900/70">{item.body}</span>
                </span>
              </li>
            ))}
          </ol>

          <a
            href={waLink(
              "Good day Patience Sewing Ltd, I need to start a return or adjustment. My order reference is:",
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary mt-7"
          >
            <MessageCircle className="h-4 w-4" /> Start on WhatsApp
          </a>

          <p className="mt-5 flex items-center gap-2 text-xs text-royal-900/50">
            <Clock className="h-3.5 w-3.5" />
            Returns are handled Monday to Saturday, 9am to 6pm.
          </p>
        </div>
      </section>
    </div>
  );
}
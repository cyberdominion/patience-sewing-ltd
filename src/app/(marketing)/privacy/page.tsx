import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: `How ${BRAND.legalName} collects, uses and protects your personal information.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="container-luxe py-14">
      <header className="max-w-2xl">
        <p className="eyebrow">Legal</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-royal-950">Privacy policy</h1>
        <div className="gold-rule mt-4" />
        <p className="mt-4 text-sm text-royal-900/60">Last updated 1 October 2026</p>
      </header>

      <div className="mt-10 max-w-3xl space-y-8">
        {[
          {
            heading: "What we collect",
            body: "We collect your name, email address, phone number, delivery address, order history and any measurements you send for a bespoke commission. If you apply for a wholesale account we also record your business name, shop address and trading history. Payment card details are handled entirely by Paystack and never reach our servers.",
          },
          {
            heading: "Why we collect it",
            body: "To take and deliver your order, to confirm details with you on WhatsApp, to make bespoke pieces to your measurements, to manage wholesale accounts, to answer questions about returns and adjustments, and to send you marketing you have asked for. We will not sell or rent your details to anyone.",
          },
          {
            heading: "Who can see your information",
            body: "Only the staff working on your order. Our delivery courier receives the minimum needed to deliver your parcel, that is your name, address and phone number. Our AI follow-up assistant is used internally to draft sales messages and never sends anything to you without a person reviewing it first.",
          },
          {
            heading: "How long we keep it",
            body: "Order and measurement records are kept for seven years, which is the period Nigerian tax law expects of a registered business. Marketing subscriptions are kept until you unsubscribe. You can ask us to delete anything you would rather we did not keep.",
          },
          {
            heading: "Your rights",
            body: "You can ask us what we hold about you, ask for a correction, or ask us to delete it. You can withdraw from marketing at any time using the unsubscribe link in any email, or by telling us on WhatsApp. Withdrawal from marketing does not affect the service we give you on an existing order.",
          },
          {
            heading: "Cookies",
            body: "We use a session cookie so you stay signed in, and a cart cookie so your basket survives a page refresh. Both are necessary for the site to work. We do not run advertising cookies.",
          },
          {
            heading: "Contacting us",
            body: `Questions about your data can go to the email address on our website footer, or by WhatsApp. Our workshop is in ${BRAND.city}, ${BRAND.state}, ${BRAND.country}.`,
          },
        ].map((section) => (
          <section key={section.heading}>
            <h2 className="font-display text-2xl font-semibold text-royal-950">
              {section.heading}
            </h2>
            <p className="mt-3 leading-relaxed text-royal-900/75">{section.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Terms of sale",
  description: `Terms of sale, pricing, payment and delivery terms for ${BRAND.legalName}.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="container-luxe py-14">
      <header className="max-w-2xl">
        <p className="eyebrow">Legal</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-royal-950">Terms of sale</h1>
        <div className="gold-rule mt-4" />
        <p className="mt-4 text-sm text-royal-900/60">Last updated 1 October 2026</p>
      </header>

      <div className="mt-10 max-w-3xl space-y-8">
        {[
          {
            heading: "Prices",
            body: "All prices are in Nigerian naira and include VAT where applicable. Retail and wholesale prices are shown separately. Retail prices apply to everyone unless you have an approved trade account, in which case wholesale unit prices apply to lines that meet the stated minimum quantity. We may change prices at any time, but never after you have paid for an order.",
          },
          {
            heading: "Payment",
            body: "Payments are processed by Paystack by card, bank transfer, USSD or QR. An order is only confirmed once payment has cleared. Where we extend a credit limit to an approved retailer, production begins on the agreed terms recorded against that account.",
          },
          {
            heading: "Bespoke commissions",
            body: "Bespoke pieces are made to measurements you approve. A 50% deposit secures your fitting date. Once the toile has been approved and production has begun, changes to measurements are no longer free, because the garment has been cut to the agreed shape. We will always tell you when a requested change is still possible.",
          },
          {
            heading: "Delivery",
            body: "Made-to-order pieces take the lead time shown on the product page, typically 14 days, and bespoke commissions two to three weeks. These are production times, not courier times. We dispatch within 24 hours of a piece passing final inspection, and you receive a message on WhatsApp with tracking details.",
          },
          {
            heading: "Colours and fabric",
            body: "We do our best to photograph accurately, but screens differ and wax print and Adire patterns vary between metres. Where a pattern matters to you, we will send you a photo of the actual piece before cutting it. Hand-dyed and hand-beaded pieces vary slightly, and that is part of the work.",
          },
          {
            heading: "Returns and adjustments",
            body: "One free adjustment is included within seven days of delivery. Everything else is governed by our returns and exchanges page, which forms part of these terms. Manufacturing faults are always corrected at our cost.",
          },
          {
            heading: "Trade accounts",
            body: "An approved wholesale account may be suspended or withdrawn at our discretion, including for late payment or repeated returns. Minimum order quantities and minimum order values are shown per style on your price list. Credit limits are reviewed on request and are not transferable.",
          },
          {
            heading: "Liability",
            body: "We are responsible for manufacturing faults and for goods arriving damaged. We are not liable for indirect loss. Nothing in these terms limits your rights under Nigerian consumer protection law.",
          },
          {
            heading: "Governing law",
            body: `These terms are governed by the laws of the Federal Republic of Nigeria, and the courts of ${BRAND.state} State have jurisdiction. Registered in Nigeria as ${BRAND.rcNumber}.`,
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
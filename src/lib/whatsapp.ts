import { normalisePhone } from "./whatsappPhone";

const DEFAULT_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "2348000000000";

export function whatsappNumber(): string {
  return normalisePhone(DEFAULT_NUMBER);
}

export function waLink(message?: string, number: string = whatsappNumber()): string {
  const base = `https://wa.me/${number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function presetLinks(siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "") {
  const store = siteUrl.replace(/\/$/, "");
  const where = store ? ` (my details are saved at ${store}/account/orders)` : "";
  return {
    general: waLink(
      `Good day Patience Sewing Ltd, I would like to make an enquiry about your dresses.`,
    ),
    orderStatus: waLink(
      `Good day Patience Sewing Ltd, I am following up on my order${where}. My order reference is: `,
    ),
    bespoke: waLink(
      "Good day Patience Sewing Ltd, I would like to commission a bespoke dress. Here are my details:\n\nOccasion:\nFabric preference:\nMeasurement notes:\nTimeline:",
    ),
    wholesale: waLink(
      "Good day Patience Sewing Ltd, I am a retailer interested in your wholesale prices. Please share your price list and the minimum order quantity.",
    ),
    returns: waLink(
      "Good day Patience Sewing Ltd, I need help with an exchange or adjustment on a recent order.",
    ),
  };
}
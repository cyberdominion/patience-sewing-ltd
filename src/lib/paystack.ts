import "server-only";
import crypto from "node:crypto";

const BASE = "https://api.paystack.co";

function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not configured");
  return key;
}

export type PaystackChannel =
  | "card"
  | "bank"
  | "ussd"
  | "qr"
  | "transfer";

export type InitialiseOrderInput = {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
  channels?: PaystackChannel[];
};

export type InitialiseResult = {
  authorizationUrl: string | null;
  accessCode: string;
  reference: string;
};

export async function initialiseTransaction(
  input: InitialiseOrderInput,
): Promise<InitialiseResult> {
  const res = await fetch(`${BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
      channels: input.channels ?? ["card", "bank", "ussd", "transfer", "qr"],
    }),
    cache: "no-store",
  });

  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json.message ?? "Paystack could not start this payment");
  }

  return {
    authorizationUrl: json.data?.authorization_url ?? null,
    accessCode: json.data?.access_code,
    reference: json.data?.reference ?? input.reference,
  };
}

export type VerifyResult = {
  status: string;
  reference: string;
  amountKobo: number;
  paidAt: Date | null;
  channel: PaystackChannel | null;
  email: string | null;
  metadata: Record<string, unknown> | null;
};

export async function verifyTransaction(reference: string): Promise<VerifyResult> {
  const res = await fetch(`${BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey()}` },
    cache: "no-store",
  });

  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json.message ?? "Paystack verification failed");
  }

  const d = json.data ?? {};
  return {
    status: d.status,
    reference: d.reference,
    amountKobo: d.amount ?? 0,
    paidAt: d.paid_at ? new Date(d.paid_at) : null,
    channel: d.channel ?? null,
    email: d.customer?.email ?? null,
    metadata: d.metadata ?? null,
  };
}

export type TransferRecipientInput = {
  type: "nuban";
  name: string;
  accountNumber: string;
  bankCode: string;
  currency?: "NGN";
  percentage: number;
};

/** Creates a Paystack subaccount so a split settlement can pay out to Patience Sewing. */
export async function createTransferRecipient(input: TransferRecipientInput) {
  const res = await fetch(`${BASE}/transferrecipient`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: input.type,
      name: input.name,
      account_number: input.accountNumber,
      bank_code: input.bankCode,
      currency: input.currency ?? "NGN",
      percentage_charge: input.percentage,
    }),
    cache: "no-store",
  });

  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json.message ?? "Could not create transfer recipient");
  }
  return json.data;
}

/**
 * Verifies the `x-paystack-signature` HMAC-SHA512 header on webhook deliveries.
 * Paystack signs the raw JSON body; comparing against the raw body is what makes
 * this safe, so the route handler must not parse the body before checking.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expected = crypto
    .createHmac("sha512", secret)
    .update(rawBody)
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function isLiveMode(): boolean {
  return secretKey().startsWith("sk_live");
}

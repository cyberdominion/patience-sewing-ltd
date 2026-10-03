import { prisma } from "@/lib/prisma";
import { verifyTransaction } from "@/lib/paystack";
import { formatNaira, formatDate } from "@/lib/money";
import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, XCircle, Clock, Package } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Payment confirmation",
  robots: { index: false, follow: false },
};

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; dev?: string }>;
}) {
  const { reference, dev } = await searchParams;
  if (!reference) return <MissingReference />;

  const order = await prisma.order.findUnique({
    where: { reference },
    include: { items: true },
  });

  if (!order) return <NotFound reference={reference} />;

  let paid = order.status !== "PENDING" && order.status !== "CANCELLED";
  let channel = order.paystackChannel;

  if (!paid && !dev && process.env.PAYSTACK_SECRET_KEY && !process.env.PAYSTACK_SECRET_KEY.includes("replace_me")) {
    try {
      const result = await verifyTransaction(reference);
      if (result.status === "success") {
        paid = true;
        channel = (result.channel?.toUpperCase() as never) ?? null;
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "PAID",
            amountPaid: result.amountKobo,
            paidAt: result.paidAt ?? new Date(),
            paystackReference: result.reference,
            paystackChannel: channel,
          },
        });
      } else if (result.status === "failed") {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED" },
        });
      }
    } catch {
      // Verification is best-effort here; the webhook remains the source of truth.
    }
  }

  return (
    <div className="container-luxe py-16">
      <div className="mx-auto max-w-2xl">
        <div className="card p-8 text-center">
          <span
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
              paid ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
            }`}
          >
            {paid ? (
              <CheckCircle2 className="h-8 w-8" />
            ) : (
              <Clock className="h-8 w-8" />
            )}
          </span>

          <h1 className="mt-6 font-display text-4xl font-semibold text-royal-950">
            {paid ? "Payment received" : "Payment not completed"}
          </h1>
          <div className="gold-rule mx-auto mt-4" />

          <p className="mt-5 leading-relaxed text-royal-900/70">
            {paid
              ? "Thank you. We have your order and we will message you on WhatsApp shortly to confirm the details before we start cutting."
              : "Your payment was not completed, so nothing has been charged. You can try again below, or message us on WhatsApp and we will sort it out with you."}
          </p>

          <dl className="mx-auto mt-7 max-w-sm space-y-2.5 text-left text-sm">
            <Row label="Order reference" value={order.reference} mono />
            <Row label="Total" value={formatNaira(order.totalAmount)} />
            <Row label="Items" value={String(order.items.length)} />
            <Row
              label="Pricing"
              value={order.pricingTier === "WHOLESALE" ? "Wholesale" : "Retail"}
            />
            {paid && order.paidAt && (
              <Row label="Paid on" value={formatDate(order.paidAt)} />
            )}
          </dl>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {paid ? (
              <>
                <Link href={`/account/orders/${order.reference}`} className="btn btn-primary">
                  <Package className="h-4 w-4" /> Track this order
                </Link>
                <Link href="/shop" className="btn btn-outline">
                  Continue shopping
                </Link>
              </>
            ) : (
              <>
                <Link href="/checkout" className="btn btn-primary">
                  Try payment again
                </Link>
                <Link href="/shop" className="btn btn-outline">
                  Back to shop
                </Link>
              </>
            )}
          </div>

          {paid && (
            <p className="mt-6 rounded-lg bg-royal-50 p-3 text-xs text-royal-900/65">
              Save your reference <span className="font-mono font-semibold">{order.reference}</span>.
              Quote it on WhatsApp and we can answer any question about this order.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between border-b border-royal-900/8 pb-2 last:border-0">
      <dt className="text-royal-900/60">{label}</dt>
      <dd className={`font-medium text-royal-950 ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}

function MissingReference() {
  return (
    <div className="container-luxe py-20 text-center">
      <XCircle className="mx-auto h-12 w-12 text-royal-900/30" />
      <h1 className="mt-5 font-display text-3xl font-semibold text-royal-950">
        No order reference supplied
      </h1>
      <p className="mt-3 text-royal-900/65">We could not work out which order to show you.</p>
      <Link href="/shop" className="btn btn-primary mt-7">
        Back to the shop
      </Link>
    </div>
  );
}

function NotFound({ reference }: { reference: string }) {
  return (
    <div className="container-luxe py-20 text-center">
      <XCircle className="mx-auto h-12 w-12 text-royal-900/30" />
      <h1 className="mt-5 font-display text-3xl font-semibold text-royal-950">Order not found</h1>
      <p className="mt-3 text-royal-900/65">
        We have no order matching{" "}
        <span className="font-mono text-sm">{reference}</span>. If you were charged, message us on
        WhatsApp and we will sort it out immediately.
      </p>
      <Link href="/shop" className="btn btn-primary mt-7">
        Back to the shop
      </Link>
    </div>
  );
}
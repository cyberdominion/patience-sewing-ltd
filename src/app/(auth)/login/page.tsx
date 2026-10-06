import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { LoginForm, RegisterForm } from "@/components/auth-forms";
import { Crown, Truck, ShieldCheck, Store } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: true },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getSessionUser();
  const { next } = await searchParams;

  if (user) {
    redirect(user.role === "ADMIN" ? "/admin" : "/account");
  }

  return (
    <div className="container-luxe py-16">
      <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-2 lg:items-start">
        <div className="lg:sticky lg:top-28">
          <p className="eyebrow">Welcome back</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-royal-950">
            Sign in to your account
          </h1>
          <div className="gold-rule mt-4" />
          <p className="mt-5 leading-relaxed text-royal-900/70">
            Customers can track orders and save addresses. Approved retailers see their wholesale
            price list, minimum quantities and order history.
          </p>

          <ul className="mt-8 space-y-4">
            {[
              { icon: Truck, title: "Track your orders", body: "Live production status, from cutting table to your door." },
              { icon: Store, title: "Wholesale price list", body: "Approved retailers see unit prices and minimums automatically." },
              { icon: ShieldCheck, title: "Saved addresses", body: "Check out faster on your next order." },
              { icon: Crown, title: "First access", body: "See new arrivals and restocks before they go public." },
            ].map((item) => (
              <li key={item.title} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-100 text-gold-700">
                  <item.icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-royal-950">{item.title}</span>
                  <span className="block text-sm text-royal-900/65">{item.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-7">
          <LoginForm next={next ?? ""} />
          <div className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-royal-900/10" />
            <span className="text-xs uppercase tracking-wider text-royal-900/40">New here</span>
            <span className="h-px flex-1 bg-royal-900/10" />
          </div>
          <RegisterForm />

          <p className="mt-6 text-center text-sm text-royal-900/60">
            Buying for a boutique?{" "}
            <Link href="/wholesale" className="font-semibold text-royal-800 underline underline-offset-4">
              Apply for wholesale
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

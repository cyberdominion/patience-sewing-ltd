import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CustomerNav } from "@/components/customer-nav";
import { ProfileForms } from "@/components/profile-forms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Profile and addresses",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/account/profile");

  const [addresses, retailer] = await Promise.all([
    prisma.address.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    prisma.retailerProfile.findUnique({ where: { userId: user.id } }),
  ]);

  return (
    <div className="container-luxe py-12">
      <header>
        <p className="eyebrow">My account</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-royal-950">
          Profile &amp; addresses
        </h1>
        <div className="gold-rule mt-4" />
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[16rem_1fr]">
        <CustomerNav isRetailer={Boolean(retailer)} retailerStatus={retailer?.status ?? null} />

        <ProfileForms
          user={{ fullName: user.fullName, email: user.email, phone: user.phone }}
          addresses={addresses.map((a) => ({
            id: a.id,
            label: a.label,
            line1: a.line1,
            city: a.city,
            state: a.state,
            country: a.country,
          }))}
        />
      </div>
    </div>
  );
}
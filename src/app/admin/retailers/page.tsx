import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatNaira, formatDate } from "@/lib/money";
import { formatPhoneForDisplay } from "@/lib/whatsappPhone";
import { RetailerReviewPanel } from "@/components/admin/retailer-review-panel";
import { Store, Check, X, Clock, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Retailers" };

export default async function AdminRetailersPage() {
  const [applications, profiles] = await Promise.all([
    prisma.retailerApplication.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 60,
      include: { profile: true },
    }),
    prisma.retailerProfile.findMany({
      where: { status: "APPROVED" },
      include: {
        user: { select: { email: true, fullName: true } },
        _count: { select: { orders: true } },
      },
      orderBy: { businessName: "asc" },
    }),
  ]);

  const pending = applications.filter((a) => a.status === "PENDING");
  const decided = applications.filter((a) => a.status !== "PENDING");

  const totalWholesaleValue = profiles.reduce((sum, p) => sum + p.creditLimit, 0);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-semibold text-royal-950">Retailers</h1>
        <p className="mt-1 text-sm text-royal-900/60">
          {pending.length} awaiting review &middot; {profiles.length} approved &middot;{" "}
          {formatNaira(totalWholesaleValue)} total credit extended
        </p>
      </header>

      <section>
        <h2 className="flex items-center gap-2 font-display text-2xl font-semibold text-royal-950">
          <Clock className="h-5 w-5 text-gold-600" />
          Awaiting review
          {pending.length > 0 && <span className="status-pill bg-gold-500 text-royal-950">{pending.length}</span>}
        </h2>

        {pending.length === 0 ? (
          <p className="mt-4 card p-8 text-center text-sm text-royal-900/55">
            Nothing waiting. New applications appear here the moment they are submitted.
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            {pending.map((application) => (
              <article key={application.id} className="card overflow-hidden">
                <div className="border-b border-royal-900/8 bg-royal-50/40 px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-xl font-semibold text-royal-950">
                        {application.businessName}
                      </h3>
                      <p className="mt-0.5 text-sm text-royal-900/65">
                        {application.fullName} &middot; {application.businessType}
                      </p>
                    </div>
                    <span className="status-pill bg-amber-100 text-amber-900">
                      Applied {formatDate(application.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="grid gap-5 px-5 py-4 lg:grid-cols-[1fr_20rem]">
                  <div>
                    <dl className="grid gap-4 sm:grid-cols-2">
                      <Detail label="Email" value={application.email} />
                      <Detail label="WhatsApp" value={formatPhoneForDisplay(application.phone)} />
                      <Detail
                        label="Shop address"
                        value={`${application.shopAddress}, ${application.city}, ${application.state}`}
                      />
                      <Detail
                        label="Experience"
                        value={
                          application.yearsInBusiness != null
                            ? `${application.yearsInBusiness} year${application.yearsInBusiness === 1 ? "" : "s"} in business`
                            : "Not stated"
                        }
                      />
                      <Detail label="Monthly volume" value={application.monthlyVolume ?? "Not stated"} />
                      <Detail
                        label="Interested in"
                        value={application.categories.join(", ").replace(/_/g, " ").toLowerCase()}
                      />
                    </dl>

                    {application.note && (
                      <p className="mt-4 rounded-lg bg-royal-50 p-3 text-sm leading-relaxed text-royal-900/75">
                        &ldquo;{application.note}&rdquo;
                      </p>
                    )}
                  </div>

                  <div>
                    <RetailerReviewPanel
                      applicationId={application.id}
                      businessName={application.businessName}
                      categories={application.categories}
                      monthlyVolume={application.monthlyVolume}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="flex items-center gap-2 font-display text-2xl font-semibold text-royal-950">
          <Check className="h-5 w-5 text-emerald-600" /> Approved retailers
        </h2>

        {profiles.length === 0 ? (
          <p className="mt-4 card p-8 text-center text-sm text-royal-900/55">
            No approved retailers yet.
          </p>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {profiles.map((profile) => (
              <article key={profile.id} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-royal-950">
                      {profile.businessName}
                    </h3>
                    <p className="text-xs text-royal-900/55">
                      {profile.businessType} &middot; {profile.city}, {profile.state}
                    </p>
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-100 text-gold-700">
                    <Store className="h-4 w-4" />
                  </span>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 border-y border-royal-900/8 py-3">
                  <div>
                    <dt className="text-xs text-royal-900/55">Discount</dt>
                    <dd className="text-lg font-semibold text-gold-700">{profile.discountPercent}%</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-royal-900/55">Orders</dt>
                    <dd className="text-lg font-semibold text-royal-950">{profile._count.orders}</dd>
                  </div>
                </dl>

                <p className="mt-3 flex items-center gap-1.5 text-xs text-royal-900/55">
                  <TrendingUp className="h-3.5 w-3.5 text-gold-600" />
                  Credit limit {formatNaira(profile.creditLimit)}
                </p>
                <p className="mt-2 text-xs text-royal-900/50">{profile.user.email}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <a href={`/admin/crm?q=${profile.user.email}`} className="btn btn-ghost !px-3 !py-1.5 text-xs">
                    View in CRM
                  </a>
                  <a href={`mailto:${profile.user.email}`} className="btn btn-ghost !px-3 !py-1.5 text-xs">
                    Email
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {decided.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 font-display text-2xl font-semibold text-royal-950">
            <X className="h-5 w-5 text-royal-900/40" /> Decided applications
          </h2>
          <div className="card mt-5 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-royal-900/10 bg-royal-50/60 text-left text-xs uppercase tracking-wider text-royal-900/55">
                  <th className="py-3 pl-5 pr-3 font-semibold">Business</th>
                  <th className="px-3 py-3 font-semibold">Applied</th>
                  <th className="px-3 py-3 font-semibold">Decision</th>
                  <th className="py-3 pl-3 pr-5 font-semibold">Review note</th>
                </tr>
              </thead>
              <tbody>
                {decided.map((application) => (
                  <tr key={application.id} className="border-b border-royal-900/5 last:border-0">
                    <td className="py-3 pl-5 pr-3">
                      <span className="block font-medium text-royal-950">{application.businessName}</span>
                      <span className="block text-xs text-royal-900/50">{application.fullName}</span>
                    </td>
                    <td className="px-3 py-3 text-royal-900/60">{formatDate(application.createdAt)}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`status-pill ${
                          application.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-800"
                            : application.status === "SUSPENDED"
                              ? "bg-amber-100 text-amber-900"
                              : "bg-red-50 text-red-700"
                        }`}
                      >
                        {application.status}
                      </span>
                    </td>
                    <td className="py-3 pl-3 pr-5 text-royal-900/65">{application.reviewNote ?? "No note"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-royal-900/45">{label}</dt>
      <dd className="mt-0.5 text-sm text-royal-900/80">{value}</dd>
    </div>
  );
}
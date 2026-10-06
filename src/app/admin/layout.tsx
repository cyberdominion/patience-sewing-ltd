import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Patience Sewing Admin" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let user: SessionUser | null = null;
  let sessionError: string | null = null;
  try {
    user = await getSessionUser();
  } catch (error) {
    sessionError = error instanceof Error ? error.message : "Session check failed";
  }

  if (!user && !sessionError) redirect("/login?next=/admin");
  if (user && user.role !== "ADMIN") redirect("/account");

  const [pendingRetailers, dueFollowUps, lowStock, openLeads] = await Promise.all([
    prisma.retailerApplication.count({ where: { status: "PENDING" } }),
    prisma.followUp.count({ where: { status: "PENDING", scheduledAt: { lte: new Date() } } }),
    prisma.product.count({
      where: { status: "ACTIVE", stock: { lte: 5 } },
    }),
    prisma.lead.count({ where: { stage: { in: ["NEW", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION"] } } }),
  ]);

  return (
    <AdminShell
      user={{ fullName: user?.fullName ?? "", email: user?.email ?? "" }}
      badges={{ pendingRetailers, dueFollowUps, lowStock, openLeads }}
    >
      {sessionError && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          Session debug: {sessionError}
        </div>
      )}
      {children}
    </AdminShell>
  );
}
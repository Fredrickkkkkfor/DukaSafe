import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { getAdminReports, getCurrentUserAndProfile } from "@/lib/data";
import { AdminShell } from "@/components/shells";
import { Card, DataTable, EmptyState, LinkButton, MetricCard, StatusBadge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Admin Reports",
  description: "Review DukaSafe seller safety reports."
};
export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const { profile } = await getCurrentUserAndProfile();
  if (!profile) redirect("/login?next=/admin/reports");
  if (!["admin", "operations"].includes(profile.role)) redirect("/unauthorized");
  const reports = await getAdminReports();
  const open = reports.filter((report: { status: string }) => !["resolved", "dismissed", "cancelled"].includes(report.status));
  return (
    <AdminShell>
      <div className="space-y-5">
        <Card>
          <h1 className="text-4xl font-black text-forest">Seller safety reports</h1>
          <p className="mt-2 text-charcoal/70">Reports are private operations signals. They should not create a public blacklist without review.</p>
        </Card>
        <MetricCard label="Open reports" value={open.length} icon={<AlertTriangle className="h-5 w-5" />} />
        <Card>
          <DataTable
            headers={["Reporter", "Seller", "Reason", "Status", "Created"]}
            rows={reports.map((report: { id: string; reporter_name?: string; seller_link_or_phone?: string; reason: string; status: string; created_at: string; sellers?: { slug?: string; shop_name?: string } }) => [
              report.reporter_name || "Anonymous",
              report.sellers?.slug ? <LinkButton key={report.id} href={`/s/${report.sellers.slug}`} variant="ghost" className="min-h-0 px-0 py-0">{report.sellers.shop_name}</LinkButton> : report.seller_link_or_phone || "Unmatched",
              report.reason,
              <StatusBadge key={`${report.id}-status`} status={report.status} />,
              new Date(report.created_at).toLocaleString()
            ])}
            empty={<EmptyState title="No reports yet" body="Buyer and visitor safety reports will appear here for operations review." />}
          />
        </Card>
      </div>
    </AdminShell>
  );
}

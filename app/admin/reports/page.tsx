import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { updateReportAction } from "@/lib/actions";
import { getAdminReports, getCurrentUserAndProfile } from "@/lib/data";
import { AdminShell } from "@/components/shells";
import { ActionPanel, Badge, Card, DataTable, EmptyState, LinkButton, MetricCard, Select, StatusBadge, Textarea } from "@/components/ui";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

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
  const underReview = reports.filter((report: { status: string }) => report.status === "under_admin_review");
  return (
    <AdminShell>
      <div className="space-y-5">
        <Card>
          <h1 className="text-4xl font-black text-forest">Seller safety reports</h1>
          <p className="mt-2 text-charcoal/70">Reports are private operations signals. They should not create a public blacklist without review.</p>
        </Card>
        <section className="grid gap-4 sm:grid-cols-3">
          <MetricCard label="Open reports" value={open.length} icon={<AlertTriangle className="h-5 w-5" />} />
          <MetricCard label="Under review" value={underReview.length} icon={<ShieldAlert className="h-5 w-5" />} />
          <MetricCard label="Private operations signal" value="No public blacklist" />
        </section>
        <ActionPanel
          title="Reports are private until reviewed"
          body="A report is an operations signal, not a public accusation. Review linked seller/order context and evidence before dismissing, resolving, or suspending a seller."
          tone="gold"
        />
        <Card>
          <DataTable
            headers={["Report", "Seller", "Reason", "Risk", "Status", "Action"]}
            rows={reports.map((report: { id: string; reporter_name?: string; reporter_phone?: string; seller_link_or_phone?: string; reason: string; evidence_summary?: string | null; status: string; created_at: string; sellers?: { slug?: string; shop_name?: string; trust_score?: number; seller_status?: string } }) => [
              <div key={`${report.id}-report`}><p className="font-black text-forest">{report.id.slice(0, 8)}</p><p className="text-xs text-charcoal/60">{report.reporter_name || "Anonymous"} {report.reporter_phone ? `- ${report.reporter_phone}` : ""}</p><p className="text-xs text-charcoal/60">{new Date(report.created_at).toLocaleString()}</p></div>,
              report.sellers?.slug ? <LinkButton key={report.id} href={`/s/${report.sellers.slug}`} variant="ghost" className="min-h-0 px-0 py-0">{report.sellers.shop_name}</LinkButton> : report.seller_link_or_phone || "Unmatched",
              <div key={`${report.id}-reason`}><p>{report.reason}</p><p className="mt-1 text-xs text-charcoal/60">{report.evidence_summary || "No evidence summary"}</p></div>,
              <div key={`${report.id}-risk`} className="flex flex-wrap gap-1"><Badge tone={report.sellers?.seller_status === "suspended" ? "red" : "sand"}>{report.sellers?.seller_status || "Unmatched"}</Badge>{report.evidence_summary && <Badge tone="gold">Evidence note</Badge>}</div>,
              <StatusBadge key={`${report.id}-status`} status={report.status} />,
              <form key={`${report.id}-action`} action={updateReportAction} className="grid gap-2">
                <input type="hidden" name="report_id" value={report.id} />
                <Select label="Status" name="status" defaultValue={report.status}>
                  <option value="open">Open</option>
                  <option value="under_admin_review">Under Review</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </Select>
                <Textarea label="Admin note" name="admin_notes" placeholder="What did operations decide?" />
                <ConfirmSubmitButton variant="secondary" confirmMessage="Update this seller safety report status?">Update report</ConfirmSubmitButton>
              </form>
            ])}
            empty={<EmptyState title="No reports yet" body="Buyer and visitor safety reports will appear here for operations review. Reports do not create a public blacklist automatically; admins review evidence before action." />}
          />
        </Card>
      </div>
    </AdminShell>
  );
}

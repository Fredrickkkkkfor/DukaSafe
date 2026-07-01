import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FileSearch, ShieldAlert } from "lucide-react";
import { getAdminDisputes, getCurrentUserAndProfile } from "@/lib/data";
import { AdminShell } from "@/components/shells";
import { Card, DataTable, EmptyState, LinkButton, MetricCard, StatusBadge, TrustBadge, formatStatus } from "@/components/ui";

export const metadata: Metadata = {
  title: "Admin Disputes",
  description: "Review DukaSafe dispute cases and evidence."
};
export const dynamic = "force-dynamic";

export default async function AdminDisputesPage() {
  const { profile } = await getCurrentUserAndProfile();
  if (!profile) redirect("/login?next=/admin/disputes");
  if (!["admin", "operations"].includes(profile.role)) redirect("/unauthorized");
  const disputes = await getAdminDisputes();
  const open = disputes.filter((dispute: { status: string }) => !["resolved", "dismissed", "cancelled"].includes(dispute.status));
  return (
    <AdminShell>
      <div className="space-y-5">
        <Card>
          <h1 className="text-4xl font-black text-forest">Dispute case queue</h1>
          <p className="mt-2 text-charcoal/70">Review buyer evidence, seller responses, payment proof, delivery proof, and the order timeline before issuing a resolution.</p>
        </Card>
        <section className="grid gap-4 sm:grid-cols-3">
          <MetricCard label="Total cases" value={disputes.length} icon={<FileSearch className="h-5 w-5" />} />
          <MetricCard label="Open cases" value={open.length} icon={<ShieldAlert className="h-5 w-5" />} />
          <MetricCard label="Evidence-forward review" value="Required" />
        </section>
        <Card>
          <DataTable
            headers={["Dispute", "Order", "Seller", "Status", "Evidence", "Action"]}
            rows={disputes.map((dispute: { dispute_code: string; type?: string; status: string; dispute_evidence?: unknown[]; orders?: { order_code?: string; item_name?: string }; sellers?: { shop_name?: string; trust_score?: number; trust_badge?: string } }) => [
              <div key={`${dispute.dispute_code}-case`}><p className="font-black text-forest">{dispute.dispute_code}</p><p className="text-xs text-charcoal/60">{formatStatus(dispute.type)}</p></div>,
              <div key={`${dispute.dispute_code}-order`}><p>{dispute.orders?.order_code || "Order"}</p><p className="text-xs text-charcoal/60">{dispute.orders?.item_name || "Protected order"}</p></div>,
              <div key={`${dispute.dispute_code}-seller`}><p className="font-bold">{dispute.sellers?.shop_name || "Seller"}</p><TrustBadge score={dispute.sellers?.trust_score} badge={dispute.sellers?.trust_badge} /></div>,
              <StatusBadge key={`${dispute.dispute_code}-status`} status={dispute.status} />,
              `${dispute.dispute_evidence?.length || 0} files`,
              <LinkButton key={`${dispute.dispute_code}-action`} href={`/admin/disputes/${dispute.dispute_code}`} variant="secondary">Review case</LinkButton>
            ])}
            empty={<EmptyState title="No dispute cases" body="Buyer and seller evidence cases will appear here when disputes are opened." />}
          />
        </Card>
      </div>
    </AdminShell>
  );
}

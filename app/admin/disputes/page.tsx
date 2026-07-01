import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Clock3, FileSearch, ShieldAlert, Truck } from "lucide-react";
import { getAdminDisputes, getCurrentUserAndProfile } from "@/lib/data";
import { AdminShell } from "@/components/shells";
import { Badge, Card, DataTable, EmptyState, LinkButton, MetricCard, StatusBadge, TrustBadge, formatStatus } from "@/components/ui";

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
  const awaitingSeller = disputes.filter((dispute: { status: string; seller_response?: string | null }) => dispute.status === "awaiting_seller_response" || !dispute.seller_response);
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
          <MetricCard label="Awaiting seller" value={awaitingSeller.length} icon={<Clock3 className="h-5 w-5" />} />
        </section>
        <section className="flex flex-wrap gap-2">
          {["Open", "Awaiting Seller", "Under Admin Review", "Resolved", "Dismissed"].map((tab) => <Badge key={tab} tone="sand">{tab}</Badge>)}
        </section>
        <Card>
          <DataTable
            headers={["Dispute", "Order", "Seller", "Status", "Evidence", "Risk", "Action"]}
            rows={disputes.map((dispute: { dispute_code: string; type?: string; status: string; summary?: string; seller_response?: string | null; seller_response_due_at?: string | null; dispute_evidence?: unknown[]; orders?: { order_code?: string; item_name?: string; status?: string; total_amount?: number; amount?: number; payments?: unknown[]; delivery_proofs?: unknown[] }; sellers?: { shop_name?: string; trust_score?: number; trust_badge?: string; disputed_orders_count?: number; seller_status?: string } }) => [
              <div key={`${dispute.dispute_code}-case`}><p className="font-black text-forest">{dispute.dispute_code}</p><p className="text-xs text-charcoal/60">{formatStatus(dispute.type)}</p></div>,
              <div key={`${dispute.dispute_code}-order`}><p>{dispute.orders?.order_code || "Order"}</p><p className="text-xs text-charcoal/60">{dispute.orders?.item_name || "Protected order"} - KSh {Number(dispute.orders?.total_amount || dispute.orders?.amount || 0).toLocaleString()}</p></div>,
              <div key={`${dispute.dispute_code}-seller`}><p className="font-bold">{dispute.sellers?.shop_name || "Seller"}</p><TrustBadge score={dispute.sellers?.trust_score} badge={dispute.sellers?.trust_badge} /></div>,
              <StatusBadge key={`${dispute.dispute_code}-status`} status={dispute.status} />,
              <EvidenceSummary key={`${dispute.dispute_code}-evidence`} files={dispute.dispute_evidence?.length || 0} payment={Boolean(dispute.orders?.payments?.length)} delivery={Boolean(dispute.orders?.delivery_proofs?.length)} />,
              <RiskSummary key={`${dispute.dispute_code}-risk`} dispute={dispute} />,
              <LinkButton key={`${dispute.dispute_code}-action`} href={`/admin/disputes/${dispute.dispute_code}`} variant="secondary">Review case</LinkButton>
            ])}
            empty={<EmptyState title="No dispute cases" body="Buyer and seller evidence cases will appear here when disputes are opened." />}
          />
        </Card>
      </div>
    </AdminShell>
  );
}

function EvidenceSummary({ files, payment, delivery }: { files: number; payment: boolean; delivery: boolean }) {
  return (
    <div className="grid gap-1 text-xs">
      <span>{files ? `${files} evidence file${files === 1 ? "" : "s"}` : "Text-only complaint / no files"}</span>
      <span>Payment proof: {payment ? "recorded" : "missing"}</span>
      <span>Delivery proof: {delivery ? "recorded" : "missing"}</span>
    </div>
  );
}

function RiskSummary({ dispute }: { dispute: { seller_response?: string | null; seller_response_due_at?: string | null; orders?: { delivery_proofs?: unknown[]; payments?: unknown[]; total_amount?: number; amount?: number }; sellers?: { disputed_orders_count?: number } } }) {
  const highValue = Number(dispute.orders?.total_amount || dispute.orders?.amount || 0) >= 5000;
  return (
    <div className="flex flex-wrap gap-1">
      {!dispute.seller_response && <Badge tone="gold">No seller response</Badge>}
      {!dispute.orders?.delivery_proofs?.length && <Badge tone="gold"><Truck className="h-3 w-3" /> No delivery proof</Badge>}
      {dispute.orders?.payments?.length ? <Badge tone="green">Payment proof</Badge> : <Badge tone="red">No payment proof</Badge>}
      {(dispute.sellers?.disputed_orders_count || 0) > 1 && <Badge tone="red">Repeat seller</Badge>}
      {highValue && <Badge tone="gold">High value</Badge>}
    </div>
  );
}

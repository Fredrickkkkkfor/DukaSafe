import type { Metadata } from "next";
import { AlertTriangle, Clock3, FileText, ShieldCheck } from "lucide-react";
import { getSellerDisputes } from "@/lib/data";
import { SellerShell } from "@/components/shells";
import { ActionPanel, Badge, Card, EmptyState, LinkButton, MetricCard, StatusBadge, formatStatus } from "@/components/ui";

export const metadata: Metadata = {
  title: "Seller Disputes",
  description: "Respond to DukaSafe buyer disputes with counter-evidence."
};

export default async function SellerDisputesPage() {
  const { seller, disputes } = await getSellerDisputes();
  if (!seller) {
    return <SellerShell><EmptyState title="Seller profile needed" body="Verify your shop before managing disputes." action={<LinkButton href="/seller/register">Verify My Shop</LinkButton>} /></SellerShell>;
  }
  const open = disputes.filter((dispute: { status: string }) => !["resolved", "dismissed", "cancelled"].includes(dispute.status));
  const awaiting = disputes.filter((dispute: { status: string }) => dispute.status === "awaiting_seller_response" || dispute.status === "open");
  const underReview = disputes.filter((dispute: { status: string }) => dispute.status === "under_admin_review");
  const resolved = disputes.filter((dispute: { status: string }) => ["resolved", "dismissed"].includes(dispute.status));
  return (
    <SellerShell>
      <div className="space-y-5">
        <Card>
          <h1 className="text-4xl font-black text-forest">Disputes</h1>
          <p className="mt-2 text-charcoal/70">Upload counter-evidence and respond before the deadline so DukaSafe can review both sides fairly.</p>
        </Card>
        <section className="grid gap-4 sm:grid-cols-4">
          <MetricCard label="Open" value={open.length} icon={<AlertTriangle className="h-5 w-5" />} />
          <MetricCard label="Awaiting response" value={awaiting.length} icon={<Clock3 className="h-5 w-5" />} />
          <MetricCard label="Under review" value={underReview.length} icon={<FileText className="h-5 w-5" />} />
          <MetricCard label="Resolved / dismissed" value={resolved.length} icon={<ShieldCheck className="h-5 w-5" />} />
        </section>
        <div className="flex flex-wrap gap-2">
          {["Open", "Awaiting Seller Response", "Under Review", "Resolved", "Dismissed"].map((label) => <Badge key={label} tone="sand">{label}</Badge>)}
        </div>
        <ActionPanel
          title="Seller response rule"
          body="If a dispute appears here, respond with clear notes and upload dispatch proof, product photos, rider confirmation, or chat screenshots. DukaSafe reviews both sides using the evidence trail."
          tone="gold"
        />
        <section className="grid gap-4">
          {disputes.length ? disputes.map((dispute: { id: string; dispute_code: string; status: string; type?: string; title?: string; summary: string; seller_response_due_at?: string; dispute_evidence?: unknown[]; orders?: { order_code?: string; item_name?: string; amount?: number; status?: string } }) => (
            <Card key={dispute.id} className="grid gap-4 md:grid-cols-[1fr_12rem]">
              <div>
                <StatusBadge status={dispute.status} />
                <h2 className="mt-3 text-2xl font-black text-forest">{dispute.dispute_code}</h2>
                <p className="mt-1 text-sm text-sage">Order {dispute.orders?.order_code} - {dispute.orders?.item_name || "Protected order"}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <Info label="Type" value={formatStatus(dispute.type)} />
                  <Info label="Required action" value={requiredAction(dispute.status)} />
                  <Info label="Evidence" value={`${dispute.dispute_evidence?.length || 0} files`} />
                </div>
                <p className="mt-3 text-charcoal/70">{dispute.title || dispute.summary}</p>
                {dispute.seller_response_due_at
                  ? <p className="mt-3 text-sm font-bold text-amber">Seller response due: {new Date(dispute.seller_response_due_at).toLocaleString()}</p>
                  : <p className="mt-3 text-sm font-bold text-sage">Respond quickly so admin can compare buyer and seller evidence.</p>}
              </div>
              <LinkButton href={`/seller/disputes/${dispute.dispute_code}`} className="self-center">{dispute.status === "open" || dispute.status === "awaiting_seller_response" ? "Respond" : "View Case"}</LinkButton>
            </Card>
          )) : (
            <EmptyState
              title="No open disputes"
              body="Buyer disputes will appear here with order terms, buyer evidence, response deadlines, and a counter-evidence upload flow. Keep payment and delivery proof on every order so you are ready if a case appears."
              action={<LinkButton href="/seller/orders" variant="secondary">Review order evidence</LinkButton>}
            />
          )}
        </section>
      </div>
    </SellerShell>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-2xl bg-sand p-3"><p className="text-xs font-bold uppercase text-sage">{label}</p><p className="mt-1 font-black text-forest">{value || "Not recorded"}</p></div>;
}

function requiredAction(status: string) {
  if (status === "open" || status === "awaiting_seller_response") return "Submit response";
  if (status === "under_admin_review") return "Wait for admin";
  if (status === "resolved") return "Review outcome";
  if (status === "dismissed") return "No action required";
  return "View case";
}

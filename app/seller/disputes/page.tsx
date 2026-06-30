import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { getSellerDisputes } from "@/lib/data";
import { SellerShell } from "@/components/shells";
import { Card, EmptyState, LinkButton, MetricCard, StatusBadge } from "@/components/ui";

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
  return (
    <SellerShell>
      <div className="space-y-5">
        <Card>
          <h1 className="text-4xl font-black text-forest">Disputes</h1>
          <p className="mt-2 text-charcoal/70">Upload counter-evidence and respond before the deadline so DukaSafe can review both sides fairly.</p>
        </Card>
        <MetricCard label="Open disputes" value={open.length} icon={<AlertTriangle className="h-5 w-5" />} />
        <section className="grid gap-4">
          {disputes.length ? disputes.map((dispute: { id: string; dispute_code: string; status: string; title?: string; summary: string; seller_response_due_at?: string; orders?: { order_code?: string; item_name?: string } }) => (
            <Card key={dispute.id} className="grid gap-4 md:grid-cols-[1fr_12rem]">
              <div>
                <StatusBadge status={dispute.status} />
                <h2 className="mt-3 text-2xl font-black text-forest">{dispute.dispute_code}</h2>
                <p className="mt-1 text-sm text-sage">Order {dispute.orders?.order_code} - {dispute.orders?.item_name || "Protected order"}</p>
                <p className="mt-3 text-charcoal/70">{dispute.title || dispute.summary}</p>
                {dispute.seller_response_due_at && <p className="mt-3 text-sm font-bold text-amber">Seller response due: {new Date(dispute.seller_response_due_at).toLocaleString()}</p>}
              </div>
              <LinkButton href={`/seller/disputes/${dispute.dispute_code}`} className="self-center">Respond</LinkButton>
            </Card>
          )) : <EmptyState title="No disputes" body="Buyer disputes will appear here with evidence and response deadlines." />}
        </section>
      </div>
    </SellerShell>
  );
}

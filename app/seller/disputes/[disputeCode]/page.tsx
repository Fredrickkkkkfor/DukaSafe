import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { sellerRespondDisputeAction } from "@/lib/actions";
import { getSellerDisputeByCode } from "@/lib/data";
import { SellerShell } from "@/components/shells";
import { Button, Card, Input, StatusBadge, Textarea, Timeline } from "@/components/ui";

export const metadata: Metadata = {
  title: "Respond to Dispute",
  description: "Submit seller response and counter-evidence for a DukaSafe dispute."
};

export default async function SellerDisputeDetailPage({ params }: { params: Promise<{ disputeCode: string }> }) {
  const route = await params;
  const { dispute } = await getSellerDisputeByCode(route.disputeCode);
  if (!dispute) notFound();
  return (
    <SellerShell>
      <div className="grid gap-5 lg:grid-cols-[1fr_0.82fr]">
        <Card>
          <StatusBadge status={dispute.status} />
          <h1 className="mt-3 text-4xl font-black text-forest">{dispute.dispute_code}</h1>
          <p className="mt-2 text-charcoal/70">{dispute.summary}</p>
          <div className="mt-5 rounded-3xl bg-sand p-4 text-sm text-charcoal/75">
            <p><strong>Order:</strong> {dispute.orders?.order_code}</p>
            <p><strong>Item:</strong> {dispute.orders?.item_name}</p>
            <p><strong>Buyer requested:</strong> {dispute.buyer_requested_outcome || "Review by DukaSafe"}</p>
          </div>
          <div className="mt-6">
            <h2 className="text-2xl font-black text-forest">Buyer evidence</h2>
            <div className="mt-3 grid gap-3">
              {(dispute.dispute_evidence || []).map((item: { id: string; title?: string; evidence_type?: string; created_at?: string }) => (
                <div key={item.id} className="rounded-2xl bg-white/70 p-3 text-sm">
                  <p className="font-black text-forest">{item.title || item.evidence_type}</p>
                  <p className="text-charcoal/60">{item.created_at ? new Date(item.created_at).toLocaleString() : "Uploaded"}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6">
            <Timeline events={[{ title: "Dispute opened", notes: dispute.summary, created_at: dispute.created_at, new_status: "disputed" }]} />
          </div>
        </Card>
        <Card>
          <h2 className="text-2xl font-black text-forest">Seller response</h2>
          <p className="mt-2 text-sm text-charcoal/70">Explain what happened and upload dispatch proof, rider confirmation, product photos, or chat screenshots.</p>
          <form action={sellerRespondDisputeAction} className="mt-5 grid gap-4">
            <input type="hidden" name="dispute_id" value={dispute.id} />
            <input type="hidden" name="dispute_code" value={dispute.dispute_code} />
            <input type="hidden" name="order_id" value={dispute.order_id} />
            <Textarea label="Response" name="seller_response" required defaultValue={dispute.seller_response || ""} />
            <Input label="Counter-evidence" name="counter_evidence" type="file" multiple accept="image/png,image/jpeg,image/webp,application/pdf" />
            <Button type="submit">Submit Response</Button>
          </form>
        </Card>
      </div>
    </SellerShell>
  );
}

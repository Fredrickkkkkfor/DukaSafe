import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { resolveDisputeAction, suspendSellerAction } from "@/lib/actions";
import { getCurrentUserAndProfile, getDisputeByCode } from "@/lib/data";
import { AdminShell } from "@/components/shells";
import { Button, Card, Input, Select, StatusBadge, Stepper, Textarea, Timeline, TrustBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Admin Dispute Review", description: "Review DukaSafe dispute evidence and issue a resolution." };

export default async function AdminDisputeReviewPage({ params }: { params: Promise<{ disputeCode: string }> }) {
  const route = await params;
  const { profile } = await getCurrentUserAndProfile();
  if (!profile || !["admin", "operations"].includes(profile.role)) redirect(`/login?next=/admin/disputes/${route.disputeCode}`);
  const dispute = await getDisputeByCode(route.disputeCode);
  if (!dispute) notFound();
  return (
    <AdminShell>
      <div className="space-y-5">
        <Card className="grid gap-5 lg:grid-cols-[1fr_18rem]">
          <div>
            <StatusBadge status={dispute.status} />
            <h1 className="mt-3 text-4xl font-black text-forest">Dispute {dispute.dispute_code}</h1>
            <p className="mt-2 text-charcoal/70">{dispute.title || dispute.summary}</p>
            <div className="mt-5"><Stepper active={3} steps={["Complaint", "Evidence", "Seller Response", "Admin Review", "Resolution"]} /></div>
          </div>
          <Card className="rounded-3xl bg-sand">
            <p className="text-sm font-black text-forest">{dispute.sellers?.shop_name}</p>
            <div className="mt-2"><TrustBadge score={dispute.sellers?.trust_score} badge={dispute.sellers?.trust_badge} /></div>
            <p className="mt-4 text-sm text-charcoal/70">Order {dispute.orders?.order_code}</p>
          </Card>
        </Card>
        <section className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
          <Card>
            <h2 className="text-2xl font-black text-forest">Evidence panels</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <EvidencePanel title="Buyer evidence" items={dispute.dispute_evidence || []} />
              <EvidencePanel title="Seller evidence" items={[]} />
            </div>
            <div className="mt-6"><Timeline events={[{ title: "Complaint raised", notes: dispute.summary, created_at: dispute.created_at, new_status: "disputed" }]} /></div>
          </Card>
          <Card>
            <h2 className="text-2xl font-black text-forest">Issue resolution</h2>
            <form action={resolveDisputeAction} className="mt-4 grid gap-4">
              <input type="hidden" name="dispute_id" value={dispute.id} />
              <input type="hidden" name="order_id" value={dispute.order_id} />
              <Select label="Resolution" name="resolution" required>
                <option value="refund">Refund</option>
                <option value="partial_refund">Partial Refund</option>
                <option value="dismissed">Dismissed</option>
                <option value="more_evidence_needed">More Evidence Needed</option>
              </Select>
              <Input label="Refund amount" name="refund_amount" type="number" defaultValue={0} />
              <Textarea label="Admin notes" name="resolution_notes" required />
              <Button type="submit">Issue Resolution</Button>
            </form>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="secondary">Message Buyer</Button>
              <Button type="button" variant="secondary">Message Seller</Button>
            </div>
            <form action={suspendSellerAction} className="mt-3">
              <input type="hidden" name="seller_id" value={dispute.seller_id} />
              <input type="hidden" name="notes" value={`Suspended during dispute ${dispute.dispute_code}`} />
              <Button type="submit" variant="danger" className="w-full">Suspend Seller</Button>
            </form>
          </Card>
        </section>
      </div>
    </AdminShell>
  );
}

function EvidencePanel({ title, items }: { title: string; items: Array<{ id: string; title?: string; evidence_type?: string; created_at?: string }> }) {
  return (
    <div className="rounded-3xl bg-white/70 p-4">
      <h3 className="font-black text-forest">{title}</h3>
      <div className="mt-3 grid gap-2 text-sm">
        {items.length ? items.map((item) => <div key={item.id} className="rounded-2xl bg-sand p-3"><p className="font-bold">{item.title || item.evidence_type}</p><p className="text-xs text-charcoal/60">{item.created_at ? new Date(item.created_at).toLocaleString() : "Uploaded"}</p></div>) : <p className="text-charcoal/60">No evidence uploaded yet.</p>}
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { resolveDisputeAction, suspendSellerAction } from "@/lib/actions";
import { getCurrentUserAndProfile, getDisputeByCode } from "@/lib/data";
import { AdminShell } from "@/components/shells";
import { ActionPanel, Badge, Button, Card, DataTable, EmptyState, Input, Select, StatusBadge, Stepper, Textarea, Timeline, TrustBadge, formatStatus } from "@/components/ui";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

export const metadata: Metadata = { title: "Admin Dispute Review", description: "Review DukaSafe dispute evidence and issue a resolution." };
export const dynamic = "force-dynamic";

export default async function AdminDisputeReviewPage({ params }: { params: Promise<{ disputeCode: string }> }) {
  const route = await params;
  const { profile } = await getCurrentUserAndProfile();
  if (!profile) redirect(`/login?next=/admin/disputes/${route.disputeCode}`);
  if (!["admin", "operations"].includes(profile.role)) redirect("/unauthorized");
  const dispute = await getDisputeByCode(route.disputeCode);
  if (!dispute) notFound();
  const order = dispute.orders;
  const buyerEvidence = dispute.dispute_evidence?.filter((item: { uploaded_by?: string }) => item.uploaded_by === dispute.buyer_id) || dispute.dispute_evidence || [];
  const sellerEvidence = dispute.dispute_evidence?.filter((item: { uploaded_by?: string }) => item.uploaded_by === dispute.sellers?.user_id) || [];
  const timeline = [
    ...(order?.order_status_events || []),
    { title: "Dispute opened", notes: dispute.summary, created_at: dispute.created_at, new_status: "disputed" },
    ...(dispute.seller_responded_at ? [{ title: "Seller responded", notes: dispute.seller_response, created_at: dispute.seller_responded_at, new_status: "under_admin_review" }] : []),
    ...(dispute.resolved_at ? [{ title: "Admin resolution logged", notes: dispute.resolution_notes, created_at: dispute.resolved_at, new_status: dispute.status }] : [])
  ];
  return (
    <AdminShell>
      <div className="space-y-5">
        <Card className="grid gap-5 lg:grid-cols-[1fr_18rem]">
          <div>
            <StatusBadge status={dispute.status} />
            <h1 className="mt-3 text-4xl font-black text-forest">Dispute {dispute.dispute_code}</h1>
            <p className="mt-2 text-charcoal/70">{dispute.title || dispute.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="gold">{formatStatus(dispute.type)}</Badge>
              <Badge tone={dispute.seller_response ? "green" : "gold"}>{dispute.seller_response ? "Seller responded" : "Awaiting seller response"}</Badge>
            </div>
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
              <CasePanel title="Buyer position" body={dispute.summary} meta={`Requested: ${dispute.buyer_requested_outcome || "Not specified"}`} />
              <CasePanel title="Seller position" body={dispute.seller_response || "No seller response recorded yet."} meta={dispute.seller_response_due_at ? `Due: ${new Date(dispute.seller_response_due_at).toLocaleString()}` : "No due date recorded"} />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <EvidencePanel title="Buyer evidence" items={buyerEvidence} />
              <EvidencePanel title="Seller evidence" items={sellerEvidence} />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <ProofPanel title="Payment proof" items={order?.payments || []} />
              <ProofPanel title="Delivery proof" items={order?.delivery_proofs || []} />
            </div>
            <div className="mt-6"><Timeline events={timeline} /></div>
          </Card>
          <Card>
            <h2 className="text-2xl font-black text-forest">Issue resolution</h2>
            <ActionPanel title="Neutral review required" body="Review buyer evidence, seller response, payment proof, delivery proof, and the timeline before selecting a resolution." tone="gold" />
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
              <ConfirmSubmitButton confirmMessage={`Issue final resolution for ${dispute.dispute_code}?`}>Issue Resolution</ConfirmSubmitButton>
            </form>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="secondary">Message Buyer</Button>
              <Button type="button" variant="secondary">Message Seller</Button>
            </div>
            <form action={suspendSellerAction} className="mt-3">
              <input type="hidden" name="seller_id" value={dispute.seller_id} />
              <input type="hidden" name="notes" value={`Suspended during dispute ${dispute.dispute_code}`} />
              <ConfirmSubmitButton variant="danger" className="w-full" confirmMessage={`Suspend ${dispute.sellers?.shop_name || "this seller"} while reviewing ${dispute.dispute_code}?`}>Suspend Seller</ConfirmSubmitButton>
            </form>
          </Card>
        </section>
        <Card>
          <h2 className="text-2xl font-black text-forest">Order snapshot</h2>
          <div className="mt-4">
            <DataTable
              headers={["Order", "Buyer", "Seller", "Amount", "Status", "Payment", "Delivery"]}
              rows={order ? [[
                order.order_code,
                order.buyer_full_name,
                dispute.sellers?.shop_name || "Seller",
                `KSh ${Number(order.total_amount || order.amount || 0).toLocaleString()}`,
                <StatusBadge key="order-status" status={order.status} />,
                order.payments?.length ? `${order.payments.length} proof record(s)` : "No payment proof",
                order.delivery_proofs?.length ? `${order.delivery_proofs.length} proof record(s)` : "No delivery proof"
              ]] : []}
              empty={<EmptyState title="Order snapshot unavailable" body="The linked order could not be loaded for this dispute." />}
            />
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}

function CasePanel({ title, body, meta }: { title: string; body?: string | null; meta: string }) {
  return (
    <div className="rounded-3xl bg-white/70 p-4 ring-1 ring-forest/10">
      <h3 className="font-black text-forest">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-charcoal/75">{body || "Not recorded"}</p>
      <p className="mt-3 text-xs font-bold text-sage">{meta}</p>
    </div>
  );
}

function EvidencePanel({ title, items }: { title: string; items: Array<{ id: string; title?: string; evidence_type?: string; created_at?: string; storage_path?: string | null; mime_type?: string | null; uploaded_by?: string | null }> }) {
  return (
    <div className="rounded-3xl bg-white/70 p-4">
      <h3 className="font-black text-forest">{title}</h3>
      <div className="mt-3 grid gap-2 text-sm">
        {items.length ? items.map((item) => <div key={item.id} className="rounded-2xl bg-sand p-3"><p className="font-bold">{item.title || formatStatus(item.evidence_type)}</p><p className="text-xs text-charcoal/60">{item.created_at ? new Date(item.created_at).toLocaleString() : "Uploaded"} - {item.mime_type || "file"} - {item.storage_path ? "private storage" : "metadata only"}</p></div>) : <p className="text-charcoal/60">No evidence uploaded yet.</p>}
      </div>
    </div>
  );
}

function ProofPanel({ title, items }: { title: string; items: Array<{ id: string; status?: string; proof_storage_path?: string | null; storage_path?: string | null; created_at?: string | null; amount?: number; courier_name?: string | null }> }) {
  return (
    <div className="rounded-3xl bg-white/70 p-4 ring-1 ring-forest/10">
      <h3 className="font-black text-forest">{title}</h3>
      <div className="mt-3 grid gap-2 text-sm">
        {items.length ? items.map((item) => (
          <div key={item.id} className="rounded-2xl bg-sand p-3">
            <p className="font-bold">{item.status ? formatStatus(item.status) : item.courier_name || "Proof uploaded"}</p>
            <p className="text-xs text-charcoal/60">{item.created_at ? new Date(item.created_at).toLocaleString() : "Uploaded"} - {item.proof_storage_path || item.storage_path ? "private storage" : "metadata only"}</p>
          </div>
        )) : <p className="text-charcoal/60">No proof uploaded yet.</p>}
      </div>
    </div>
  );
}

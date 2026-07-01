import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PackageCheck, ShieldAlert, Truck } from "lucide-react";
import { confirmDeliveryAction, createReviewAction, markDispatchedAction } from "@/lib/actions";
import { getCurrentUserAndProfile, getOrderByCode } from "@/lib/data";
import { ActionPanel, Badge, Button, Card, DataTable, EmptyState, Input, LinkButton, StatusBadge, Stepper, StickyMobileCTA, Textarea, Timeline, TrustBadge, formatStatus } from "@/components/ui";
import { PageShell, PublicHeader } from "@/components/shells";

export const metadata: Metadata = { title: "Order Tracking", description: "Track a DukaSafe protected order and evidence trail." };

const statuses = ["pending", "payment_uploaded", "paid", "dispatched", "delivered", "closed", "disputed"];

export default async function OrderTrackingPage({ params, searchParams }: { params: Promise<{ orderCode: string }>; searchParams: Promise<{ error?: string; delivered?: string; reviewed?: string }> }) {
  const route = await params;
  const query = await searchParams;
  const { user, profile } = await getCurrentUserAndProfile();
  const { order, events, payments, deliveryProofs, disputes } = await getOrderByCode(route.orderCode);
  if (!order) notFound();
  const active = Math.max(0, statuses.indexOf(order.status));
  const next = getNextAction(order.status);
  const isBuyer = user?.id === order.buyer_id;
  const isSeller = user?.id === order.sellers?.user_id;
  const isAdmin = profile?.role === "admin" || profile?.role === "operations";
  const canDispatch = isSeller && order.status === "paid";
  const canConfirmDelivery = isBuyer && ["dispatched", "delivered"].includes(order.status);
  const disputeWindowOpen = order.dispute_window_closes_at ? new Date(order.dispute_window_closes_at).getTime() >= new Date().getTime() : false;
  const canDispute = isBuyer && !["cancelled", "refunded", "disputed"].includes(order.status) && (order.status !== "closed" || disputeWindowOpen);
  return (
    <>
      <PublicHeader />
      <PageShell className="space-y-5">
        <Card className="grid gap-5 lg:grid-cols-[1fr_20rem]">
          <div>
            <Badge tone="green">Order {order.order_code}</Badge>
            <h1 className="mt-4 text-4xl font-black text-forest">Track your protected order</h1>
            <p className="mt-2 text-charcoal/70">Every update is recorded as part of the buyer-seller evidence trail.</p>
            <div className="mt-5"><Stepper active={active} steps={["Pending", "Payment Uploaded", "Paid/Verified", "Dispatched", "Delivered", "Closed", "Disputed"]} /></div>
            <div className="mt-5">
              <ActionPanel title={next.title} body={next.body} tone={next.tone} />
            </div>
            {query.error && (
              <div className="mt-4">
                <ActionPanel title="Action not available" body={orderErrorMessage(query.error)} tone="gold" />
              </div>
            )}
            {query.delivered && (
              <div className="mt-4">
                <ActionPanel title="Delivery confirmed" body="Thanks. This order is closed, seller trust history has been updated, and you can now leave a verified review." tone="green" />
              </div>
            )}
            {query.reviewed && (
              <div className="mt-4">
                <ActionPanel title="Review submitted" body="Your verified review is saved and will help other buyers understand this seller's track record." tone="green" />
              </div>
            )}
          </div>
          <Card className="rounded-3xl bg-sand">
            <StatusBadge status={order.status} />
            <h2 className="mt-3 text-xl font-black text-forest">{order.item_name}</h2>
            <p className="mt-1 text-sm text-charcoal/65">{order.sellers?.shop_name}</p>
            <div className="mt-3"><TrustBadge score={order.sellers?.trust_score} badge={order.sellers?.trust_badge} /></div>
            <p className="mt-4 text-2xl font-black">KSh {Number(order.total_amount || order.amount).toLocaleString()}</p>
          </Card>
        </Card>

        <section className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <Card>
            <h2 className="text-2xl font-black text-forest">Evidence trail</h2>
            <div className="mt-5"><Timeline events={events} /></div>
          </Card>
          <div className="space-y-5">
            <Card>
              <h2 className="text-xl font-black text-forest">Order summary</h2>
              <div className="mt-4 grid gap-2 text-sm text-charcoal/70">
                <p><strong>Buyer:</strong> {order.buyer_full_name} - {order.buyer_phone}</p>
                <p><strong>Delivery:</strong> {order.delivery_location}</p>
                <p><strong>Payment proof:</strong> {formatStatus(order.payment_status)}</p>
                <p><strong>Delivery proof:</strong> {deliveryProofs.length ? "Uploaded" : "Pending"}</p>
                <p><strong>Delivered:</strong> {order.delivered_at ? new Date(order.delivered_at).toLocaleString() : "Not confirmed yet"}</p>
                <p><strong>Dispute window:</strong> {order.dispute_window_closes_at ? `Closes ${new Date(order.dispute_window_closes_at).toLocaleString()}` : "Opens after delivery confirmation"}</p>
              </div>
            </Card>
            <Card>
              <h2 className="text-xl font-black text-forest">Buyer protection status</h2>
              <div className="mt-4 grid gap-3 text-sm">
                <EvidenceRow label="Order terms" value="Recorded" />
                <EvidenceRow label="Payment proof" value={payments.length ? "Recorded" : "Pending"} />
                <EvidenceRow label="Seller confirmation" value={["paid", "dispatched", "delivered", "closed"].includes(order.status) ? "Recorded" : "Pending"} />
                <EvidenceRow label="Delivery proof" value={deliveryProofs.length ? "Recorded" : "Pending"} />
                <EvidenceRow label="Dispute evidence" value={disputes.length ? "Case opened" : "None"} />
              </div>
              <p className="mt-4 rounded-2xl bg-sand p-3 text-sm leading-6 text-charcoal/70">If something goes wrong, DukaSafe uses this timeline, payment proof, delivery proof, and dispute evidence to review the case.</p>
            </Card>
            {disputes[0] && (
              <Card className="border border-red-200 bg-red-50">
                <h2 className="text-xl font-black text-red-800">Dispute status</h2>
                <div className="mt-3"><StatusBadge status={disputes[0].status} /></div>
                <p className="mt-3 text-sm leading-6 text-red-900/75">DukaSafe is reviewing buyer and seller evidence. Follow this page for seller response, admin review, and final resolution updates.</p>
              </Card>
            )}
            <Card>
              <h2 className="text-xl font-black text-forest">Actions</h2>
              <div className="mt-4 grid gap-3">
                {canDispatch && (
                  <form action={markDispatchedAction} className="grid gap-3">
                    <input type="hidden" name="order_id" value={order.id} />
                    <input type="hidden" name="order_code" value={order.order_code} />
                    <Input label="Delivery proof" name="delivery_proof" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" required />
                    <Input label="Courier" name="courier_name" placeholder="Rider / courier name" />
                    <Input label="Tracking code" name="tracking_code" />
                    <Textarea label="Dispatch notes" name="notes" />
                    <Button type="submit" variant="secondary"><Truck className="h-4 w-4" /> Mark as dispatched</Button>
                  </form>
                )}
                {canConfirmDelivery && (
                  <form action={confirmDeliveryAction}>
                    <input type="hidden" name="order_id" value={order.id} />
                    <input type="hidden" name="order_code" value={order.order_code} />
                    <Button type="submit" className="w-full"><PackageCheck className="h-4 w-4" /> Confirm delivery</Button>
                  </form>
                )}
                {canDispute && <LinkButton href={`/orders/${order.order_code}/dispute`} variant="danger"><ShieldAlert className="h-4 w-4" /> Raise dispute</LinkButton>}
                {isAdmin && <LinkButton href="/admin/orders" variant="secondary">Inspect in Admin</LinkButton>}
                {!canDispatch && !canConfirmDelivery && !canDispute && !isAdmin && (
                  <EmptyState title="No action needed" body="The next available action will appear here when this order reaches the right stage." />
                )}
              </div>
            </Card>
          </div>
        </section>

        <Card>
          <h2 className="text-2xl font-black text-forest">Payments, proofs, and disputes</h2>
          <div className="mt-4">
            <DataTable
              headers={["Type", "Status", "Details"]}
              rows={[
                ...payments.map((p: { status: string; amount: number }) => ["Payment", <StatusBadge key="payment" status={p.status} />, `KSh ${Number(p.amount).toLocaleString()}`]),
                ...deliveryProofs.map((p: { courier_name?: string }) => ["Delivery proof", <StatusBadge key="delivery" status="uploaded" />, p.courier_name || "Evidence uploaded"]),
                ...disputes.map((d: { dispute_code: string; status: string }) => [`Dispute ${d.dispute_code}`, <StatusBadge key={d.dispute_code} status={d.status} />, "Case opened"])
              ]}
              empty={<EmptyState title="No attached evidence yet" body="Payment, delivery, and dispute evidence appears here when uploaded." />}
            />
          </div>
        </Card>
        {order.status === "closed" && (
          <Card>
            <h2 className="text-2xl font-black text-forest">Rate your seller</h2>
            <p className="mt-2 text-sm text-charcoal/70">Your verified review helps other buyers shop safely and helps genuine sellers build trust.</p>
            <form action={createReviewAction} className="mt-5 grid gap-4 md:grid-cols-[10rem_1fr]">
              <input type="hidden" name="order_id" value={order.id} />
              <input type="hidden" name="order_code" value={order.order_code} />
              <input type="hidden" name="seller_id" value={order.seller_id} />
              <Input label="Rating" name="rating" type="number" min={1} max={5} defaultValue={5} required />
              <Textarea label="Comment" name="comment" required placeholder="Tell other buyers what went well." />
              <label className="flex items-center gap-2 text-sm font-bold text-forest md:col-span-2">
                <input type="checkbox" name="is_public" defaultChecked />
                Show this review publicly on the seller profile
              </label>
              <Button type="submit" className="md:col-span-2">Submit Verified Review</Button>
            </form>
          </Card>
        )}
      </PageShell>
      {(canConfirmDelivery || canDispute) && (
        <StickyMobileCTA>
          {canConfirmDelivery && (
            <form action={confirmDeliveryAction} className="flex-1">
              <input type="hidden" name="order_id" value={order.id} />
              <input type="hidden" name="order_code" value={order.order_code} />
              <button type="submit" className="min-h-12 w-full rounded-2xl bg-forest px-3 text-sm font-bold text-white">Confirm Delivery</button>
            </form>
          )}
          {canDispute && <LinkButton href={`/orders/${order.order_code}/dispute`} variant="secondary" className="flex-1">Raise Dispute</LinkButton>}
        </StickyMobileCTA>
      )}
    </>
  );
}

function orderErrorMessage(error: string) {
  const messages: Record<string, string> = {
    "dispatch-requires-paid": "Payment must be confirmed before dispatch proof can be uploaded.",
    "delivery-proof-required": "Upload a dispatch receipt, rider photo, or courier proof before marking the order as dispatched.",
    "payment-not-ready": "Payment proof must be uploaded before the seller can confirm or flag payment.",
    "delivery-not-ready": "Only the buyer can confirm delivery after dispatch proof has been recorded.",
    "dispute-not-available": "The dispute window is closed or the order status does not allow a new dispute.",
    "dispute-already-open": "A dispute is already open for this order. Follow the existing case in the evidence trail."
  };
  return messages[error] || "This action is not available for the current order status.";
}

function getNextAction(status: string): { title: string; body: string; tone: "sand" | "green" | "red" | "gold" } {
  switch (status) {
    case "pending":
      return { title: "Waiting for payment proof", body: "Upload M-PESA confirmation proof so the seller can prepare the order.", tone: "gold" };
    case "payment_uploaded":
      return { title: "Seller should confirm payment", body: "Payment proof has been recorded. The seller should confirm and dispatch before delivery.", tone: "gold" };
    case "paid":
      return { title: "Seller should dispatch", body: "Payment is accepted. The seller needs to upload dispatch or delivery proof.", tone: "sand" };
    case "dispatched":
      return { title: "Buyer should confirm delivery", body: "Delivery proof is recorded. Confirm delivery if the item is correct, or raise a dispute if something is wrong.", tone: "green" };
    case "disputed":
      return { title: "DukaSafe is reviewing evidence", body: "A dispute is open. Buyer, seller, and admin evidence will be recorded in the timeline.", tone: "red" };
    case "closed":
      return { title: "Order completed safely", body: "This order is closed. You can keep the receipt and leave a verified review when available.", tone: "green" };
    default:
      return { title: `${formatStatus(status)} status`, body: "Check the timeline for the latest evidence and next step.", tone: "sand" };
  }
}

function EvidenceRow({ label, value }: { label: string; value: string }) {
  const positive = ["Recorded", "Case opened"].includes(value);
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/75 px-4 py-3 ring-1 ring-forest/10">
      <span className="font-bold text-forest">{label}</span>
      <Badge tone={positive ? "green" : "sand"}>{value}</Badge>
    </div>
  );
}

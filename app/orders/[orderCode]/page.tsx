import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PackageCheck, ShieldAlert, Truck } from "lucide-react";
import { confirmDeliveryAction, markDispatchedAction } from "@/lib/actions";
import { getOrderByCode } from "@/lib/data";
import { ActionPanel, Badge, Button, Card, DataTable, EmptyState, Input, LinkButton, StatusBadge, Stepper, StickyMobileCTA, Textarea, Timeline, formatStatus } from "@/components/ui";
import { PageShell, PublicHeader } from "@/components/shells";

export const metadata: Metadata = { title: "Order Tracking", description: "Track a DukaSafe protected order and evidence trail." };

const statuses = ["pending", "payment_uploaded", "dispatched", "delivered", "closed"];

export default async function OrderTrackingPage({ params }: { params: Promise<{ orderCode: string }> }) {
  const route = await params;
  const { order, events, payments, deliveryProofs, disputes } = await getOrderByCode(route.orderCode);
  if (!order) notFound();
  const active = Math.max(0, statuses.indexOf(order.status));
  const next = getNextAction(order.status);
  return (
    <>
      <PublicHeader />
      <PageShell className="space-y-5">
        <Card className="grid gap-5 lg:grid-cols-[1fr_20rem]">
          <div>
            <Badge tone="green">Order {order.order_code}</Badge>
            <h1 className="mt-4 text-4xl font-black text-forest">Track your protected order</h1>
            <p className="mt-2 text-charcoal/70">Every update is recorded as part of the buyer-seller evidence trail.</p>
            <div className="mt-5"><Stepper active={active} steps={["Pending", "Paid", "Dispatched", "Delivered", "Closed"]} /></div>
            <div className="mt-5">
              <ActionPanel title={next.title} body={next.body} tone={next.tone} />
            </div>
          </div>
          <Card className="rounded-3xl bg-sand">
            <StatusBadge status={order.status} />
            <h2 className="mt-3 text-xl font-black text-forest">{order.item_name}</h2>
            <p className="mt-1 text-sm text-charcoal/65">{order.sellers?.shop_name}</p>
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
              </div>
            </Card>
            <Card>
              <h2 className="text-xl font-black text-forest">Actions</h2>
              <div className="mt-4 grid gap-3">
                <form action={markDispatchedAction} className="grid gap-3">
                  <input type="hidden" name="order_id" value={order.id} />
                  <input type="hidden" name="order_code" value={order.order_code} />
                  <input type="hidden" name="seller_id" value={order.seller_id} />
                  <Input label="Delivery proof" name="delivery_proof" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" />
                  <Input label="Courier" name="courier_name" placeholder="Rider / courier name" />
                  <Input label="Tracking code" name="tracking_code" />
                  <Textarea label="Dispatch notes" name="notes" />
                  <Button type="submit" variant="secondary"><Truck className="h-4 w-4" /> Mark as dispatched</Button>
                </form>
                <form action={confirmDeliveryAction}>
                  <input type="hidden" name="order_id" value={order.id} />
                  <input type="hidden" name="order_code" value={order.order_code} />
                  <Button type="submit" className="w-full"><PackageCheck className="h-4 w-4" /> Confirm delivery</Button>
                </form>
                <LinkButton href={`/orders/${order.order_code}/dispute`} variant="danger"><ShieldAlert className="h-4 w-4" /> Raise dispute</LinkButton>
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
      </PageShell>
      <StickyMobileCTA>
        <form action={confirmDeliveryAction} className="flex-1">
          <input type="hidden" name="order_id" value={order.id} />
          <input type="hidden" name="order_code" value={order.order_code} />
          <button type="submit" className="min-h-12 w-full rounded-2xl bg-forest px-3 text-sm font-bold text-white">Confirm Delivery</button>
        </form>
        <LinkButton href={`/orders/${order.order_code}/dispute`} variant="secondary" className="flex-1">Raise Dispute</LinkButton>
      </StickyMobileCTA>
    </>
  );
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

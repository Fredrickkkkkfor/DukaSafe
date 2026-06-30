import type { Metadata } from "next";
import { AlertTriangle, CreditCard, PackageCheck, Truck } from "lucide-react";
import { confirmPaymentAction, flagPaymentAction, markDispatchedAction } from "@/lib/actions";
import { getSellerOrders } from "@/lib/data";
import { SellerShell } from "@/components/shells";
import { ActionPanel, Button, Card, DataTable, EmptyState, Input, LinkButton, MetricCard, StatusBadge, Textarea, formatStatus } from "@/components/ui";

export const metadata: Metadata = {
  title: "Seller Orders",
  description: "Manage DukaSafe protected orders, payment proof, and dispatch evidence."
};

export default async function SellerOrdersPage() {
  const { seller, orders } = await getSellerOrders();
  if (!seller) {
    return <SellerShell><EmptyState title="Seller profile needed" body="Verify your shop before managing protected orders." action={<LinkButton href="/seller/register">Verify My Shop</LinkButton>} /></SellerShell>;
  }
  const paymentUploaded = orders.filter((order: { status: string }) => order.status === "payment_uploaded");
  const paid = orders.filter((order: { status: string }) => order.status === "paid");
  const disputed = orders.filter((order: { status: string }) => order.status === "disputed");

  return (
    <SellerShell>
      <div className="space-y-5">
        <Card>
          <h1 className="text-4xl font-black text-forest">Orders requiring action</h1>
          <p className="mt-2 text-charcoal/70">Confirm payment proof, upload dispatch evidence, and keep buyers updated from one workflow.</p>
        </Card>
        <section className="grid gap-4 sm:grid-cols-4">
          <MetricCard label="All orders" value={orders.length} icon={<PackageCheck className="h-5 w-5" />} />
          <MetricCard label="Payment Uploaded" value={paymentUploaded.length} icon={<CreditCard className="h-5 w-5" />} />
          <MetricCard label="Ready to Dispatch" value={paid.length} icon={<Truck className="h-5 w-5" />} />
          <MetricCard label="Disputed" value={disputed.length} icon={<AlertTriangle className="h-5 w-5" />} />
        </section>
        <ActionPanel title="Seller protection rule" body="Only dispatch after payment proof is recorded and accepted. Always upload dispatch proof so false claims can be reviewed with evidence." tone="gold" />
        <section className="grid gap-4">
          {orders.length ? orders.map((order: { id: string; order_code: string; seller_id: string; buyer_full_name: string; item_name?: string; amount: number; status: string; payment_status: string }) => (
            <Card key={order.id} className="grid gap-5 lg:grid-cols-[1fr_22rem]">
              <div>
                <StatusBadge status={order.status} />
                <h2 className="mt-3 text-2xl font-black text-forest">{order.order_code}</h2>
                <p className="mt-1 text-charcoal/70">{order.item_name || "Protected order"} for {order.buyer_full_name}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <Info label="Amount" value={`KSh ${Number(order.amount).toLocaleString()}`} />
                  <Info label="Payment" value={formatStatus(order.payment_status)} />
                  <Info label="Required action" value={nextSellerAction(order.status)} />
                </div>
              </div>
              <div className="grid gap-3 rounded-3xl bg-sand p-4">
                {order.status === "payment_uploaded" && (
                  <>
                    <form action={confirmPaymentAction}>
                      <input type="hidden" name="order_id" value={order.id} />
                      <input type="hidden" name="order_code" value={order.order_code} />
                      <Button type="submit" className="w-full">Confirm Payment</Button>
                    </form>
                    <form action={flagPaymentAction} className="grid gap-2">
                      <input type="hidden" name="order_id" value={order.id} />
                      <input type="hidden" name="order_code" value={order.order_code} />
                      <Input label="Flag note" name="notes" placeholder="Why does this proof need review?" />
                      <Button type="submit" variant="secondary">Request Review</Button>
                    </form>
                  </>
                )}
                {order.status === "paid" && (
                  <form action={markDispatchedAction} className="grid gap-3">
                    <input type="hidden" name="order_id" value={order.id} />
                    <input type="hidden" name="order_code" value={order.order_code} />
                    <Input label="Delivery proof" name="delivery_proof" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" required />
                    <Input label="Courier" name="courier_name" />
                    <Input label="Tracking code" name="tracking_code" />
                    <Textarea label="Dispatch notes" name="notes" />
                    <Button type="submit">Mark as Dispatched</Button>
                  </form>
                )}
                {order.status === "disputed" && <LinkButton href="/seller/disputes" variant="danger">View Dispute</LinkButton>}
                <LinkButton href={`/orders/${order.order_code}`} variant="secondary">Open Timeline</LinkButton>
              </div>
            </Card>
          )) : (
            <EmptyState title="No orders yet" body="Protected orders will appear here when buyers use your checkout links." action={<LinkButton href="/seller/create-link">Create protected link</LinkButton>} />
          )}
        </section>
        <Card>
          <h2 className="text-2xl font-black text-forest">Compact order table</h2>
          <div className="mt-4">
            <DataTable
              headers={["Order", "Buyer", "Item", "Amount", "Status"]}
              rows={orders.map((order: { order_code: string; buyer_full_name: string; item_name?: string; amount: number; status: string }) => [order.order_code, order.buyer_full_name, order.item_name || "Item", `KSh ${Number(order.amount).toLocaleString()}`, <StatusBadge key={order.order_code} status={order.status} />])}
              empty={<EmptyState title="No orders to show" body="Order history will appear here." />}
            />
          </div>
        </Card>
      </div>
    </SellerShell>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-2xl bg-white/70 p-3"><p className="text-xs font-bold uppercase text-sage">{label}</p><p className="mt-1 font-black text-forest">{value}</p></div>;
}

function nextSellerAction(status: string) {
  if (status === "payment_uploaded") return "Confirm payment";
  if (status === "paid") return "Upload dispatch proof";
  if (status === "disputed") return "Respond to dispute";
  if (status === "dispatched") return "Wait for buyer";
  return "Monitor";
}

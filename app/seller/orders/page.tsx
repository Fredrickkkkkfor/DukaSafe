import type { Metadata } from "next";
import { AlertTriangle, Clock3, CreditCard, FileText, PackageCheck, Phone, Truck } from "lucide-react";
import { confirmPaymentAction, flagPaymentAction, markDispatchedAction } from "@/lib/actions";
import { getSellerOrders } from "@/lib/data";
import { SellerShell } from "@/components/shells";
import { ActionPanel, Button, Card, DataTable, EmptyState, Input, LinkButton, MetricCard, StatusBadge, Textarea, formatStatus } from "@/components/ui";

export const metadata: Metadata = {
  title: "Seller Orders",
  description: "Manage DukaSafe protected orders, payment proof, and dispatch evidence."
};

type SellerOrder = {
  id: string;
  order_code: string;
  buyer_full_name: string;
  buyer_phone?: string | null;
  item_name?: string | null;
  amount: number;
  total_amount?: number | null;
  status: string;
  payment_status: string;
  payment_proof_storage_path?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  payments?: Array<{ id: string; amount?: number | null; status?: string | null; mpesa_receipt_code?: string | null; payer_phone?: string | null; created_at?: string | null }>;
  delivery_proofs?: Array<{ id: string }>;
  disputes?: Array<{ id: string; dispute_code?: string }>;
  order_status_events?: Array<{ title?: string | null; notes?: string | null; created_at?: string | null; new_status?: string | null }>;
};

export default async function SellerOrdersPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const query = await searchParams;
  const { seller, orders } = await getSellerOrders();
  if (!seller) {
    return <SellerShell><EmptyState title="Seller profile needed" body="Verify your shop before managing protected orders." action={<LinkButton href="/seller/register">Verify My Shop</LinkButton>} /></SellerShell>;
  }
  const allOrders = orders as SellerOrder[];
  const paymentUploaded = allOrders.filter((order) => order.status === "payment_uploaded");
  const paid = allOrders.filter((order) => order.status === "paid");
  const disputed = allOrders.filter((order) => order.status === "disputed");
  const visibleOrders = filterOrders(allOrders, query.filter);

  return (
    <SellerShell>
      <div className="space-y-5">
        <Card>
          <h1 className="text-4xl font-black text-forest">Orders requiring action</h1>
          <p className="mt-2 text-charcoal/70">Review evidence first, record every decision, and keep buyers updated from one workflow.</p>
        </Card>
        <section className="grid gap-4 sm:grid-cols-4">
          <LinkButton href="/seller/orders" variant={query.filter ? "secondary" : "primary"} className="justify-start"><PackageCheck className="h-5 w-5" /> All Orders <span className="ml-auto text-xl">{allOrders.length}</span></LinkButton>
          <LinkButton href="/seller/orders?filter=payment_uploaded" variant={query.filter === "payment_uploaded" ? "primary" : "secondary"} className="justify-start"><CreditCard className="h-5 w-5" /> Payment Uploaded <span className="ml-auto text-xl">{paymentUploaded.length}</span></LinkButton>
          <LinkButton href="/seller/orders?filter=paid" variant={query.filter === "paid" ? "primary" : "secondary"} className="justify-start"><Truck className="h-5 w-5" /> Ready to Dispatch <span className="ml-auto text-xl">{paid.length}</span></LinkButton>
          <LinkButton href="/seller/orders?filter=disputed" variant={query.filter === "disputed" ? "primary" : "secondary"} className="justify-start"><AlertTriangle className="h-5 w-5" /> Disputed <span className="ml-auto text-xl">{disputed.length}</span></LinkButton>
        </section>
        <ActionPanel title="Seller protection rule" body="Only dispatch after payment proof is recorded and accepted. Always upload dispatch proof so false claims can be reviewed with evidence." tone="gold" />
        <section className="grid gap-4">
          {visibleOrders.length ? visibleOrders.map((order) => {
            const payment = order.payments?.[0];
            const events = [...(order.order_status_events || [])].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).slice(0, 2);
            return (
            <Card key={order.id} className="grid gap-5 lg:grid-cols-[1fr_22rem]">
              <div>
                <StatusBadge status={order.status} />
                <h2 className="mt-3 text-2xl font-black text-forest">{order.order_code}</h2>
                <p className="mt-1 text-charcoal/70">{order.item_name || "Protected order"} for {order.buyer_full_name}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-sm text-charcoal/70">
                  {order.buyer_phone && <span className="inline-flex items-center gap-1 rounded-full bg-sand px-3 py-1"><Phone className="h-3.5 w-3.5" /> {order.buyer_phone}</span>}
                  <span className="inline-flex items-center gap-1 rounded-full bg-sand px-3 py-1"><Clock3 className="h-3.5 w-3.5" /> Last update {order.updated_at ? new Date(order.updated_at).toLocaleString() : "not recorded"}</span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Info label="Expected amount" value={`KSh ${Number(order.total_amount || order.amount).toLocaleString()}`} />
                  <Info label="Payment" value={formatStatus(order.payment_status)} />
                  <Info label="Required action" value={nextSellerAction(order.status)} />
                  <Info label="Evidence" value={evidenceState(order)} />
                </div>
                {order.status === "payment_uploaded" && (
                  <div className="mt-4 rounded-3xl bg-amber/10 p-4">
                    <p className="font-black text-forest">Payment proof review</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <Info label="Submitted amount" value={payment?.amount ? `KSh ${Number(payment.amount).toLocaleString()}` : "Not recorded"} />
                      <Info label="M-PESA code" value={payment?.mpesa_receipt_code || "Not provided"} />
                      <Info label="Proof uploaded" value={payment?.created_at ? new Date(payment.created_at).toLocaleString() : order.payment_proof_storage_path ? "Stored securely" : "Missing"} />
                      <Info label="Buyer phone" value={payment?.payer_phone || order.buyer_phone || "Not recorded"} />
                    </div>
                    <p className="mt-3 text-sm font-bold text-[#8a5a24]">Only confirm after checking proof against the expected amount and buyer details.</p>
                  </div>
                )}
                <div className="mt-4 rounded-3xl bg-sand p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-forest">Evidence timeline preview</p>
                    <FileText className="h-5 w-5 text-sage" />
                  </div>
                  <div className="mt-3 grid gap-2">
                    {events.length ? events.map((event, index) => (
                      <div key={`${event.title}-${index}`} className="rounded-2xl bg-white/75 p-3">
                        <p className="font-bold text-forest">{event.title || formatStatus(event.new_status)}</p>
                        <p className="text-xs text-charcoal/60">{event.created_at ? new Date(event.created_at).toLocaleString() : "Time not recorded"}</p>
                      </div>
                    )) : <p className="text-sm text-charcoal/65">No timeline events recorded yet.</p>}
                  </div>
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
                      <Input label="Flag note" name="notes" minLength={10} required placeholder="Explain what does not match." />
                      <Button type="submit" variant="secondary">Request Review</Button>
                    </form>
                    <p className="text-xs leading-5 text-charcoal/60">After confirming payment, the order becomes ready for dispatch proof upload. Request review if amount, phone, or screenshot looks unclear.</p>
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
                {["closed", "delivered"].includes(order.status) && <ActionPanel title="Completed safely" body="No action required. Keep the timeline available in case evidence is needed later." tone="green" />}
                <LinkButton href={`/orders/${order.order_code}`} variant="secondary">View evidence timeline</LinkButton>
              </div>
            </Card>
          );}) : (
            <EmptyState title={allOrders.length ? "No orders match this filter" : "No orders yet"} body={allOrders.length ? "Try another status filter to see other protected orders." : "Protected orders will appear here when buyers use your checkout links."} action={<LinkButton href={allOrders.length ? "/seller/orders" : "/seller/create-link"}>{allOrders.length ? "Show all orders" : "Create protected link"}</LinkButton>} />
          )}
        </section>
        <Card>
          <h2 className="text-2xl font-black text-forest">Order register</h2>
          <div className="mt-4">
            <DataTable
              headers={["Order", "Buyer", "Item", "Amount", "Status", "Timeline"]}
              rows={visibleOrders.map((order) => [order.order_code, order.buyer_full_name, order.item_name || "Item", `KSh ${Number(order.total_amount || order.amount).toLocaleString()}`, <StatusBadge key={order.order_code} status={order.status} />, <LinkButton key={`${order.order_code}-timeline`} href={`/orders/${order.order_code}`} variant="ghost" className="min-h-0 px-0 py-0">View</LinkButton>])}
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
  if (["closed", "delivered"].includes(status)) return "No action required";
  return "View timeline";
}

function evidenceState(order: SellerOrder) {
  const states = [
    order.payment_proof_storage_path || order.payments?.length ? "Payment proof" : null,
    order.delivery_proofs?.length ? "Delivery proof" : null,
    order.disputes?.length ? "Dispute evidence" : null
  ].filter(Boolean);
  return states.length ? states.join(", ") : "No evidence yet";
}

function filterOrders(orders: SellerOrder[], filter?: string) {
  if (filter === "payment_uploaded") return orders.filter((order) => order.status === "payment_uploaded");
  if (filter === "paid") return orders.filter((order) => order.status === "paid");
  if (filter === "disputed") return orders.filter((order) => order.status === "disputed");
  return orders;
}

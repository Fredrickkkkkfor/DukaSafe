import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2, Clock3, FileText, PackageCheck, Truck } from "lucide-react";
import { getBuyerOrders } from "@/lib/data";
import { Badge, Card, DataTable, EmptyState, LinkButton, StatusBadge, TrustBadge, formatStatus } from "@/components/ui";
import { BuyerMobileNav, PageShell, PublicHeader } from "@/components/shells";

export const metadata: Metadata = {
  title: "My Orders",
  description: "Track your DukaSafe protected orders and dispute windows."
};

type BuyerOrder = {
  order_code: string;
  sellers?: { shop_name?: string; slug?: string; trust_score?: number; trust_badge?: string; verified?: boolean };
  item_name?: string;
  amount: number;
  total_amount?: number;
  status: string;
  payment_status?: string;
  payment_proof_storage_path?: string | null;
  delivery_proof_storage_path?: string | null;
  updated_at?: string | null;
  products?: { product_image_url?: string | null };
  payments?: Array<{ status?: string; created_at?: string | null }>;
  delivery_proofs?: Array<{ id: string; created_at?: string | null }>;
  disputes?: Array<{ dispute_code?: string; status?: string; seller_response_due_at?: string | null }>;
};

export default async function BuyerOrdersPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const query = await searchParams;
  const { user, orders } = await getBuyerOrders();
  if (!user) redirect("/login?next=/orders");
  const buyerOrders = orders as BuyerOrder[];
  const awaitingSeller = buyerOrders.filter((order) => ["payment_uploaded", "paid"].includes(order.status));
  const inDelivery = buyerOrders.filter((order) => ["dispatched", "delivered"].includes(order.status));
  const disputedOrders = buyerOrders.filter((order) => order.status === "disputed" || (order.disputes || []).length > 0);
  const completed = buyerOrders.filter((order) => ["closed", "refunded"].includes(order.status));
  const visibleOrders = filterOrders(buyerOrders, query.filter);

  return (
    <>
      <PublicHeader />
      <PageShell className="space-y-5">
        <Card>
          <h1 className="text-4xl font-black text-forest">My protected orders</h1>
          <p className="mt-2 text-charcoal/70">Track payment proof, dispatch evidence, delivery timelines, and disputes from one place.</p>
        </Card>
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <FilterMetric href="/orders" active={!query.filter} icon={<PackageCheck className="h-5 w-5" />} label="All Orders" value={buyerOrders.length} />
          <FilterMetric href="/orders?filter=awaiting_seller" active={query.filter === "awaiting_seller"} icon={<Clock3 className="h-5 w-5" />} label="Awaiting Seller" value={awaitingSeller.length} />
          <FilterMetric href="/orders?filter=in_delivery" active={query.filter === "in_delivery"} icon={<Truck className="h-5 w-5" />} label="In Delivery" value={inDelivery.length} />
          <FilterMetric href="/orders?filter=disputed" active={query.filter === "disputed"} icon={<AlertTriangle className="h-5 w-5" />} label="Disputed" value={disputedOrders.length} />
          <FilterMetric href="/orders?filter=completed" active={query.filter === "completed"} icon={<CheckCircle2 className="h-5 w-5" />} label="Completed" value={completed.length} />
        </section>

        <section className="grid gap-4">
          {visibleOrders.length ? visibleOrders.map((order) => {
            const dispute = order.disputes?.[0];
            return (
              <Card key={order.order_code} className="grid gap-5 lg:grid-cols-[10rem_1fr_18rem]">
                <div className="overflow-hidden rounded-3xl bg-sand">
                  {order.products?.product_image_url ? (
                    <div className="h-full min-h-36 bg-cover bg-center" style={{ backgroundImage: `url(${order.products.product_image_url})` }} aria-label={`${order.item_name} product image`} />
                  ) : (
                    <div className="grid h-full min-h-36 place-items-center text-center text-sm font-bold text-sage">Protected order</div>
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={order.status} />
                    {dispute && <Badge tone="red">Dispute {formatStatus(dispute.status)}</Badge>}
                  </div>
                  <h2 className="mt-3 text-2xl font-black text-forest">{order.order_code}</h2>
                  <p className="mt-1 text-charcoal/70">{order.item_name || "Protected order"}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-forest">{order.sellers?.shop_name || "Seller"}</span>
                    <TrustBadge score={order.sellers?.trust_score} badge={order.sellers?.trust_badge} />
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Info label="Amount" value={`KSh ${Number(order.total_amount || order.amount).toLocaleString()}`} />
                    <Info label="Payment proof" value={order.payment_proof_storage_path || order.payments?.length ? formatStatus(order.payment_status || "proof_uploaded") : "Not uploaded"} />
                    <Info label="Delivery proof" value={order.delivery_proof_storage_path || order.delivery_proofs?.length ? "Recorded" : "Pending"} />
                    <Info label="Last updated" value={order.updated_at ? new Date(order.updated_at).toLocaleDateString() : "Not recorded"} />
                  </div>
                </div>
                <div className="rounded-3xl bg-sand p-4">
                  <p className="text-sm font-black text-forest">Next step</p>
                  <p className="mt-2 text-sm leading-6 text-charcoal/70">{nextBuyerStep(order)}</p>
                  <div className="mt-4 grid gap-2">
                    <LinkButton href={`/orders/${order.order_code}`} className="w-full">Track order</LinkButton>
                    <LinkButton href={`/orders/${order.order_code}`} variant="secondary" className="w-full"><FileText className="h-4 w-4" /> View evidence timeline</LinkButton>
                    {dispute && <LinkButton href={`/orders/${order.order_code}`} variant="danger" className="w-full">View dispute</LinkButton>}
                    {!dispute && canRaiseIssue(order.status) && <LinkButton href={`/orders/${order.order_code}/dispute`} variant="secondary" className="w-full">Raise issue</LinkButton>}
                  </div>
                </div>
              </Card>
            );
          }) : (
            <EmptyState title={buyerOrders.length ? "No orders match this filter" : "No protected orders yet"} body={buyerOrders.length ? "Try another order status filter." : "Check a seller before paying. Protected checkout links record order terms, payment proof, and dispute evidence."} action={<LinkButton href={buyerOrders.length ? "/orders" : "/check"}>{buyerOrders.length ? "Show all orders" : "Check a Seller"}</LinkButton>} />
          )}
        </section>

        <Card>
          <h2 className="text-2xl font-black text-forest">Order register</h2>
          <p className="mt-2 text-sm text-charcoal/60">A compact desktop register for scanning all protected orders.</p>
          <div className="mt-4">
          <DataTable
            headers={["Order", "Seller", "Item", "Amount", "Status", "Next step"]}
            rows={visibleOrders.map((order) => [
              order.order_code,
              order.sellers?.shop_name || "Seller",
              order.item_name || "Protected order",
              `KSh ${Number(order.total_amount || order.amount).toLocaleString()}`,
              <StatusBadge key={`${order.order_code}-status`} status={order.status} />,
              <LinkButton key={`${order.order_code}-open`} href={`/orders/${order.order_code}`} variant="secondary">{order.status === "disputed" ? "View dispute" : "Track"}</LinkButton>
            ])}
            empty={<EmptyState title="No orders yet" body="When you use a protected checkout link, your order and evidence trail will appear here." action={<LinkButton href="/check">Check a Seller</LinkButton>} />}
          />
          </div>
        </Card>
      </PageShell>
      <BuyerMobileNav />
    </>
  );
}

function FilterMetric({ href, active, icon, label, value }: { href: string; active?: boolean; icon: React.ReactNode; label: string; value: number }) {
  return <LinkButton href={href} variant={active ? "primary" : "secondary"} className="justify-start">{icon}<span>{label}</span><span className="ml-auto text-xl">{value}</span></LinkButton>;
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-2xl bg-white/75 p-3"><p className="text-xs font-bold uppercase text-sage">{label}</p><p className="mt-1 font-black text-forest">{value}</p></div>;
}

function filterOrders(orders: BuyerOrder[], filter?: string) {
  if (filter === "awaiting_seller") return orders.filter((order) => ["payment_uploaded", "paid"].includes(order.status));
  if (filter === "in_delivery") return orders.filter((order) => ["dispatched", "delivered"].includes(order.status));
  if (filter === "disputed") return orders.filter((order) => order.status === "disputed" || (order.disputes || []).length > 0);
  if (filter === "completed") return orders.filter((order) => ["closed", "refunded"].includes(order.status));
  return orders;
}

function canRaiseIssue(status: string) {
  return !["pending", "cancelled", "refunded", "disputed"].includes(status);
}

function nextBuyerStep(order: BuyerOrder) {
  const dispute = order.disputes?.[0];
  if (dispute) {
    if (dispute.status === "open" || dispute.status === "awaiting_seller_response") return "View dispute. Seller response is pending before admin review.";
    if (dispute.status === "under_admin_review") return "Awaiting admin review. DukaSafe is comparing buyer and seller evidence.";
    return `View dispute outcome: ${formatStatus(dispute.status)}.`;
  }
  if (order.status === "pending") return "Upload or confirm M-PESA proof so the seller can review payment.";
  if (order.status === "payment_uploaded") return "Wait for the seller to check payment proof and accept before dispatch.";
  if (order.status === "paid") return "Seller should dispatch and upload delivery proof.";
  if (order.status === "dispatched") return "Check delivery. Confirm only if the item is correct, or raise an issue.";
  if (order.status === "closed") return "Completed safely. You can keep this timeline as your receipt.";
  return "Open the evidence timeline for the latest status.";
}

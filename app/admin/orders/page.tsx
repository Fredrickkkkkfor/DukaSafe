import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Download, Filter, FileText, ShieldAlert, ShoppingBag, Truck } from "lucide-react";
import { getAdminOrders, getAdminReports, getCurrentUserAndProfile } from "@/lib/data";
import { AdminShell } from "@/components/shells";
import { Badge, Card, DataTable, EmptyState, Input, LinkButton, MetricCard, Select, StatusBadge, TrustBadge, formatStatus } from "@/components/ui";

export const metadata: Metadata = { title: "Admin Orders & Transactions", description: "Monitor DukaSafe orders, payments, delivery proofs, and disputes." };
export const dynamic = "force-dynamic";

type AdminOrder = {
  order_code: string;
  buyer_full_name: string;
  buyer_phone?: string;
  sellers?: { shop_name?: string; slug?: string; trust_score?: number; trust_badge?: string; seller_status?: string };
  item_name?: string;
  amount: number;
  total_amount?: number;
  status: string;
  payment_status: string;
  payment_proof_storage_path?: string | null;
  delivery_proof_storage_path?: string | null;
  updated_at?: string | null;
  payments?: Array<{ status?: string; proof_storage_path?: string | null; mpesa_receipt_code?: string | null; created_at?: string | null }>;
  delivery_proofs?: Array<{ proof_storage_path?: string | null; created_at?: string | null }>;
  disputes?: Array<{ dispute_code: string; status?: string }>;
  order_status_events?: Array<{ id: string }>;
};

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; payment?: string; dispute?: string; seller?: string }> }) {
  const query = await searchParams;
  const { profile } = await getCurrentUserAndProfile();
  if (!profile) redirect("/login?next=/admin/orders");
  if (!["admin", "operations"].includes(profile.role)) redirect("/unauthorized");
  const [orders, reports] = await Promise.all([getAdminOrders(), getAdminReports()]);
  const adminOrders = orders as AdminOrder[];
  const visibleOrders = filterAdminOrders(adminOrders, query);
  const completed = adminOrders.filter((o) => o.status === "closed").length;
  const disputed = adminOrders.filter((o) => (o.disputes || []).length > 0 || o.status === "disputed").length;
  const gmv = adminOrders
    .filter((o) => !["cancelled", "refunded"].includes(o.status))
    .reduce((sum, o) => sum + Number(o.total_amount || o.amount || 0), 0);
  return (
    <AdminShell>
      <div className="space-y-5">
        <Card>
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <Badge tone="gold">Operations</Badge>
              <h1 className="mt-3 text-4xl font-black text-forest">Orders & Transactions</h1>
              <p className="mt-2 text-charcoal/70">Filterable view of protected orders, payment evidence, delivery proof, and dispute status.</p>
            </div>
            <LinkButton href="/admin/orders?export=csv" className="inline-flex"><Download className="h-4 w-4" /> Export logs</LinkButton>
          </div>
        </Card>
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard label="Total orders" value={adminOrders.length} icon={<ShoppingBag className="h-5 w-5" />} />
          <MetricCard label="Completed" value={completed} />
          <MetricCard label="Disputed" value={disputed} icon={<ShieldAlert className="h-5 w-5" />} />
          <MetricCard label="GMV" value={`KSh ${gmv.toLocaleString()}`} />
          <MetricCard label="Reports / risk flags" value={reports.length} />
        </section>
        <Card>
          <form className="grid gap-3 md:grid-cols-5" action="/admin/orders">
            <Select label="Status" name="status" defaultValue={query.status || ""}><option value="">All statuses</option>{["pending", "payment_uploaded", "paid", "dispatched", "closed", "disputed", "refunded"].map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}</Select>
            <Select label="Payment" name="payment" defaultValue={query.payment || ""}><option value="">All payments</option>{["pending", "proof_uploaded", "verified", "failed"].map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}</Select>
            <Select label="Dispute" name="dispute" defaultValue={query.dispute || ""}><option value="">All disputes</option><option value="open">Open</option><option value="resolved">Resolved</option><option value="none">No dispute</option></Select>
            <Input label="Seller" name="seller" defaultValue={query.seller || ""} placeholder="Seller" />
            <button className="mt-0 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-sand px-4 text-sm font-bold text-forest md:mt-7"><Filter className="h-4 w-4" /> Apply filters</button>
          </form>
        </Card>
        <Card>
          <DataTable
            headers={["Order", "Buyer", "Seller", "Amount", "Status", "Evidence", "Action needed"]}
            rows={visibleOrders.map((order) => [
              <div key={`${order.order_code}-order`}>
                <LinkButton href={`/orders/${order.order_code}`} variant="ghost" className="min-h-0 px-0 py-0">{order.order_code}</LinkButton>
                <p className="mt-1 text-xs text-charcoal/60">{order.item_name || "Protected order"}</p>
              </div>,
              <div key={`${order.order_code}-buyer`}><p>{order.buyer_full_name}</p><p className="text-xs text-charcoal/60">{order.buyer_phone || "Phone hidden"}</p></div>,
              <div key={`${order.order_code}-seller`}><p className="font-bold text-forest">{order.sellers?.shop_name || "Seller"}</p><TrustBadge score={order.sellers?.trust_score} badge={order.sellers?.trust_badge} /></div>,
              `KSh ${Number(order.total_amount || order.amount).toLocaleString()}`,
              <div key={`${order.order_code}-status`} className="grid gap-1"><StatusBadge status={order.status} /><StatusBadge status={order.payment_status} /></div>,
              <EvidenceStack key={`${order.order_code}-evidence`} order={order} />,
              <AdminOrderAction key={`${order.order_code}-action`} order={order} />
            ])}
            empty={<EmptyState title="No orders match these filters" body={adminOrders.length ? "Clear filters to return to the full transaction register." : "Protected transactions will appear here once buyers place orders."} action={adminOrders.length ? <LinkButton href="/admin/orders" variant="secondary">Clear filters</LinkButton> : undefined} />}
          />
        </Card>
      </div>
    </AdminShell>
  );
}

function filterAdminOrders(orders: AdminOrder[], query: { status?: string; payment?: string; dispute?: string; seller?: string }) {
  return orders.filter((order) => {
    if (query.status && order.status !== query.status) return false;
    if (query.payment && order.payment_status !== query.payment) return false;
    if (query.dispute === "open" && !(order.disputes || []).some((d) => !["resolved", "dismissed", "cancelled"].includes(d.status || ""))) return false;
    if (query.dispute === "resolved" && !(order.disputes || []).some((d) => ["resolved", "dismissed"].includes(d.status || ""))) return false;
    if (query.dispute === "none" && (order.disputes || []).length) return false;
    if (query.seller && !order.sellers?.shop_name?.toLowerCase().includes(query.seller.toLowerCase())) return false;
    return true;
  });
}

function EvidenceStack({ order }: { order: AdminOrder }) {
  return (
    <div className="grid gap-1 text-xs">
      <span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> Payment: {order.payment_proof_storage_path || order.payments?.length ? "proof recorded" : "missing"}</span>
      <span className="inline-flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> Delivery: {order.delivery_proof_storage_path || order.delivery_proofs?.length ? "proof recorded" : "pending"}</span>
      <span>Timeline: {order.order_status_events?.length || 0} events</span>
      {order.updated_at && <span>Updated {new Date(order.updated_at).toLocaleDateString()}</span>}
    </div>
  );
}

function AdminOrderAction({ order }: { order: AdminOrder }) {
  const dispute = order.disputes?.[0];
  if (dispute) return <LinkButton href={`/admin/disputes/${dispute.dispute_code}`} variant="danger">Review Dispute</LinkButton>;
  if (order.payment_status === "proof_uploaded") return <LinkButton href={`/orders/${order.order_code}`} variant="secondary">View Payment Proof</LinkButton>;
  if (order.status === "dispatched") return <LinkButton href={`/orders/${order.order_code}`} variant="secondary">View Delivery Proof</LinkButton>;
  return <LinkButton href={`/orders/${order.order_code}`} variant="secondary">Open Order</LinkButton>;
}

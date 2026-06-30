import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Download, Filter, ShieldAlert, ShoppingBag } from "lucide-react";
import { getAdminOrders, getAdminReports, getCurrentUserAndProfile } from "@/lib/data";
import { AdminShell } from "@/components/shells";
import { Badge, Card, DataTable, EmptyState, LinkButton, MetricCard, Select, StatusBadge, formatStatus } from "@/components/ui";

export const metadata: Metadata = { title: "Admin Orders & Transactions", description: "Monitor DukaSafe orders, payments, delivery proofs, and disputes." };

export default async function AdminOrdersPage() {
  const { profile } = await getCurrentUserAndProfile();
  if (!profile) redirect("/login?next=/admin/orders");
  if (!["admin", "operations"].includes(profile.role)) redirect("/unauthorized");
  const [orders, reports] = await Promise.all([getAdminOrders(), getAdminReports()]);
  const completed = orders.filter((o: { status: string }) => o.status === "closed").length;
  const disputed = orders.filter((o: { disputes?: unknown[] }) => (o.disputes || []).length > 0).length;
  const gmv = orders.reduce((sum: number, o: { total_amount?: number; amount: number }) => sum + Number(o.total_amount || o.amount || 0), 0);
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
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-forest px-5 py-3 text-sm font-bold text-white"><Download className="h-4 w-4" /> Export logs</button>
          </div>
        </Card>
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard label="Total orders" value={orders.length} icon={<ShoppingBag className="h-5 w-5" />} />
          <MetricCard label="Completed" value={completed} />
          <MetricCard label="Disputed" value={disputed} icon={<ShieldAlert className="h-5 w-5" />} />
          <MetricCard label="GMV" value={`KSh ${gmv.toLocaleString()}`} />
          <MetricCard label="Reports" value={reports.length} />
        </section>
        <Card>
          <div className="grid gap-3 md:grid-cols-5">
            <Select label="Status" name="status"><option>All statuses</option>{["pending", "payment_uploaded", "dispatched", "closed", "disputed"].map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}</Select>
            <Select label="Payment" name="payment"><option>All payments</option>{["pending", "proof_uploaded", "verified"].map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}</Select>
            <Select label="Dispute" name="dispute"><option>All disputes</option><option>Open</option><option>Resolved</option></Select>
            <input className="min-h-12 rounded-2xl border border-forest/10 bg-white/80 px-4 text-sm md:mt-7" placeholder="Seller" />
            <button className="mt-0 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-sand px-4 text-sm font-bold text-forest md:mt-7"><Filter className="h-4 w-4" /> Apply filters</button>
          </div>
        </Card>
        <Card>
          <DataTable
            headers={["Order", "Buyer", "Seller", "Amount", "Status", "Payment", "Dispute"]}
            rows={orders.map((order: { order_code: string; buyer_full_name: string; sellers?: { shop_name: string }; amount: number; total_amount?: number; status: string; payment_status: string; disputes?: Array<{ dispute_code: string }> }) => [
              <LinkButton key={order.order_code} href={`/orders/${order.order_code}`} variant="ghost" className="min-h-0 px-0 py-0">{order.order_code}</LinkButton>,
              order.buyer_full_name,
              order.sellers?.shop_name || "Seller",
              `KSh ${Number(order.total_amount || order.amount).toLocaleString()}`,
              <StatusBadge key={`${order.order_code}-status`} status={order.status} />,
              <StatusBadge key={`${order.order_code}-payment`} status={order.payment_status} />,
              order.disputes?.[0] ? <LinkButton key={`${order.order_code}-dispute`} href={`/admin/disputes/${order.disputes[0].dispute_code}`} variant="secondary">Review</LinkButton> : "None"
            ])}
            empty={<EmptyState title="No orders yet" body="Protected transactions will appear here once buyers place orders." />}
          />
        </Card>
      </div>
    </AdminShell>
  );
}

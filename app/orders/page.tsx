import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AlertTriangle, PackageCheck, Search } from "lucide-react";
import { getBuyerOrders } from "@/lib/data";
import { Card, DataTable, EmptyState, LinkButton, MetricCard, StatusBadge } from "@/components/ui";
import { MobileNav, PageShell, PublicHeader } from "@/components/shells";

export const metadata: Metadata = {
  title: "My Orders",
  description: "Track your DukaSafe protected orders and dispute windows."
};

export default async function BuyerOrdersPage() {
  const { user, orders } = await getBuyerOrders();
  if (!user) redirect("/login?next=/orders");
  const activeOrders = orders.filter((order: { status: string }) => !["closed", "cancelled", "refunded"].includes(order.status));
  const disputedOrders = orders.filter((order: { status: string }) => order.status === "disputed");

  return (
    <>
      <PublicHeader />
      <PageShell className="space-y-5">
        <Card>
          <h1 className="text-4xl font-black text-forest">My protected orders</h1>
          <p className="mt-2 text-charcoal/70">Return to seller profiles, payment proof, delivery timelines, and dispute support from one place.</p>
        </Card>
        <section className="grid gap-4 sm:grid-cols-3">
          <MetricCard label="All orders" value={orders.length} icon={<PackageCheck className="h-5 w-5" />} />
          <MetricCard label="Active" value={activeOrders.length} icon={<Search className="h-5 w-5" />} />
          <MetricCard label="Disputed" value={disputedOrders.length} icon={<AlertTriangle className="h-5 w-5" />} />
        </section>
        <Card>
          <DataTable
            headers={["Order", "Seller", "Item", "Amount", "Status", "Next step"]}
            rows={orders.map((order: { order_code: string; sellers?: { shop_name?: string }; item_name?: string; amount: number; total_amount?: number; status: string }) => [
              order.order_code,
              order.sellers?.shop_name || "Seller",
              order.item_name || "Protected order",
              `KSh ${Number(order.total_amount || order.amount).toLocaleString()}`,
              <StatusBadge key={`${order.order_code}-status`} status={order.status} />,
              <LinkButton key={`${order.order_code}-open`} href={`/orders/${order.order_code}`} variant="secondary">Track</LinkButton>
            ])}
            empty={<EmptyState title="No orders yet" body="When you use a protected checkout link, your order and evidence trail will appear here." action={<LinkButton href="/check">Check a Seller</LinkButton>} />}
          />
        </Card>
      </PageShell>
      <MobileNav items={[
        { href: "/check", label: "Check", icon: <Search className="h-5 w-5" /> },
        { href: "/orders", label: "Orders", icon: <PackageCheck className="h-5 w-5" /> },
        { href: "/protection-charter", label: "Help", icon: <AlertTriangle className="h-5 w-5" /> }
      ]} />
    </>
  );
}

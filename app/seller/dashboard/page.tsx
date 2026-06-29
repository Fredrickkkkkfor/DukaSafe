import type { Metadata } from "next";
import { AlertTriangle, BadgeCheck, PackagePlus, ShoppingBag, Star } from "lucide-react";
import { getSellerWorkspace } from "@/lib/data";
import { Badge, Card, DataTable, EmptyState, LinkButton, MetricCard, StatusBadge, TrustBadge } from "@/components/ui";
import { SellerShell } from "@/components/shells";

export const metadata: Metadata = { title: "Seller Dashboard", description: "Manage DukaSafe orders, product links, disputes, and trust score." };

export default async function SellerDashboardPage() {
  const { seller, products, orders, reviews, disputes } = await getSellerWorkspace();
  if (!seller) {
    return <SellerShell><EmptyState title="Seller profile not found" body="Submit your seller verification application before managing protected order links." action={<LinkButton href="/seller/register">Verify My Shop</LinkButton>} /></SellerShell>;
  }
  return (
    <SellerShell>
      <div className="space-y-5">
        <Card className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <TrustBadge score={seller.trust_score} badge={seller.trust_badge} />
            <h1 className="mt-3 text-4xl font-black text-forest">Welcome back, {seller.shop_name}</h1>
            <p className="mt-2 text-charcoal/70">Track trust score, active orders, disputes, reviews, and protected product links.</p>
          </div>
          <LinkButton href="/seller/create-link"><PackagePlus className="h-4 w-4" /> Create protected link</LinkButton>
        </Card>
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard label="Trust score" value={Math.round(Number(seller.trust_score || 0))} icon={<BadgeCheck className="h-5 w-5" />} />
          <MetricCard label="Completed" value={seller.completed_orders_count || 0} icon={<ShoppingBag className="h-5 w-5" />} />
          <MetricCard label="Active orders" value={orders.filter((o: { status: string }) => !["closed", "cancelled", "refunded"].includes(o.status)).length} icon={<ShoppingBag className="h-5 w-5" />} />
          <MetricCard label="Open disputes" value={disputes.filter((d: { status: string }) => !["resolved", "dismissed"].includes(d.status)).length} icon={<AlertTriangle className="h-5 w-5" />} />
          <MetricCard label="Rating" value={`${seller.rating_average || 0}/5`} icon={<Star className="h-5 w-5" />} />
        </section>
        <Card>
          <h2 className="text-2xl font-black text-forest">Recent orders</h2>
          <div className="mt-4">
            <DataTable
              headers={["Order", "Item", "Amount", "Status", "Action"]}
              rows={orders.map((order: { order_code: string; item_name?: string; amount: number; status: string }) => [order.order_code, order.item_name || "Order item", `KSh ${Number(order.amount).toLocaleString()}`, <StatusBadge key={order.order_code} status={order.status} />, <LinkButton key={`${order.order_code}-link`} href={`/orders/${order.order_code}`} variant="secondary">Open</LinkButton>])}
              empty={<EmptyState title="No orders yet" body="Orders will appear as buyers use your protected checkout links." />}
            />
          </div>
        </Card>
        <section className="grid gap-5 lg:grid-cols-2">
          <Card>
            <h2 className="text-2xl font-black text-forest">Product links</h2>
            <div className="mt-4 grid gap-3">
              {products.length ? products.map((product: { id: string; name: string; price: number; status: string }) => <div key={product.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white/70 p-3"><div><p className="font-black text-forest">{product.name}</p><p className="text-sm text-charcoal/60">KSh {Number(product.price).toLocaleString()}</p></div><StatusBadge status={product.status} /></div>) : <EmptyState title="No product links" body="Create your first protected checkout link." action={<LinkButton href="/seller/create-link">Create link</LinkButton>} />}
            </div>
          </Card>
          <Card>
            <h2 className="text-2xl font-black text-forest">Reviews & disputes</h2>
            <div className="mt-4 grid gap-3">
              <Badge tone="sand">Verification status: {seller.verification_status}</Badge>
              {reviews.slice(0, 3).map((review: { id: string; rating: number; comment?: string }) => <div key={review.id} className="rounded-2xl bg-white/70 p-3 text-sm"><strong>{review.rating}/5</strong> {review.comment}</div>)}
              {!reviews.length && <p className="text-sm text-charcoal/65">Verified buyer reviews will appear here.</p>}
            </div>
          </Card>
        </section>
      </div>
    </SellerShell>
  );
}

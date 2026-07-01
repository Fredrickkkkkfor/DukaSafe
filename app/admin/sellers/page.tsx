import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AlertTriangle, PackageCheck, ShieldCheck, Star } from "lucide-react";
import { suspendSellerAction } from "@/lib/actions";
import { getAdminSellers, getCurrentUserAndProfile } from "@/lib/data";
import { AdminShell } from "@/components/shells";
import { Badge, Card, DataTable, EmptyState, Input, LinkButton, MetricCard, StatusBadge, TrustBadge } from "@/components/ui";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

export const metadata: Metadata = {
  title: "Admin Sellers",
  description: "Review seller status, trust metrics, disputes, and risk signals."
};
export const dynamic = "force-dynamic";

type AdminSeller = {
  id: string;
  shop_name: string;
  slug: string;
  category?: string;
  location_city?: string | null;
  location_area?: string | null;
  seller_status: string;
  verification_status: string;
  verified: boolean;
  trust_score: number;
  trust_badge?: string;
  completed_orders_count?: number;
  disputed_orders_count?: number;
  rating_average?: number;
  created_at?: string;
  products?: Array<{ id: string; status: string }>;
  orders?: Array<{ id: string; status: string }>;
  disputes?: Array<{ id: string; status: string }>;
};

export default async function AdminSellersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const query = await searchParams;
  const { profile } = await getCurrentUserAndProfile();
  if (!profile) redirect("/login?next=/admin/sellers");
  if (!["admin", "operations"].includes(profile.role)) redirect("/unauthorized");
  const sellers = (await getAdminSellers()) as AdminSeller[];
  const visible = sellers.filter((seller) => {
    if (query.status && seller.seller_status !== query.status && seller.verification_status !== query.status) return false;
    if (query.q && !`${seller.shop_name} ${seller.slug} ${seller.location_city}`.toLowerCase().includes(query.q.toLowerCase())) return false;
    return true;
  });
  const active = sellers.filter((seller) => seller.seller_status === "active").length;
  const suspended = sellers.filter((seller) => seller.seller_status === "suspended").length;
  const disputed = sellers.filter((seller) => (seller.disputed_orders_count || 0) > 0 || (seller.disputes || []).length > 0).length;

  return (
    <AdminShell>
      <div className="space-y-5">
        <Card>
          <Badge tone="gold">Seller operations</Badge>
          <h1 className="mt-3 text-4xl font-black text-forest">Seller risk and trust register</h1>
          <p className="mt-2 text-charcoal/70">Inspect seller status, trust score, active products, disputes, reports, and operational risk before taking platform action.</p>
        </Card>
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="All sellers" value={sellers.length} icon={<ShieldCheck className="h-5 w-5" />} />
          <MetricCard label="Active" value={active} icon={<PackageCheck className="h-5 w-5" />} />
          <MetricCard label="Suspended" value={suspended} icon={<AlertTriangle className="h-5 w-5" />} />
          <MetricCard label="With disputes" value={disputed} icon={<Star className="h-5 w-5" />} />
        </section>
        <Card>
          <form action="/admin/sellers" className="grid gap-3 md:grid-cols-[1fr_14rem_10rem]">
            <Input label="Search sellers" name="q" defaultValue={query.q || ""} placeholder="Shop, slug, location..." />
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-forest">Status</span>
              <select name="status" defaultValue={query.status || ""} className="focus-ring min-h-12 w-full rounded-2xl border border-forest/10 bg-white/85 px-4 text-sm text-charcoal shadow-sm">
                <option value="">All statuses</option>
                {["active", "pending", "suspended", "approved", "needs_more_info", "rejected"].map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
              </select>
            </label>
            <button className="mt-0 min-h-12 rounded-2xl bg-sand px-4 text-sm font-bold text-forest md:mt-7">Filter</button>
          </form>
        </Card>
        <Card>
          <DataTable
            headers={["Seller", "Trust", "Status", "Orders", "Risk", "Actions"]}
            rows={visible.map((seller) => [
              <div key={`${seller.id}-seller`}><p className="font-black text-forest">{seller.shop_name}</p><p className="text-xs text-charcoal/60">{seller.category || "Uncategorised"} - {seller.location_city || "No city"}{seller.location_area ? `, ${seller.location_area}` : ""}</p></div>,
              <div key={`${seller.id}-trust`}><TrustBadge score={seller.trust_score} badge={seller.trust_badge} /><p className="mt-1 text-xs text-charcoal/60">{Number(seller.rating_average || 0).toFixed(1)}/5 rating</p></div>,
              <div key={`${seller.id}-status`} className="grid gap-1"><StatusBadge status={seller.seller_status} /><StatusBadge status={seller.verification_status} /></div>,
              <div key={`${seller.id}-orders`} className="text-xs"><p>Completed: {seller.completed_orders_count || 0}</p><p>Products: {seller.products?.length || 0}</p><p>Orders: {seller.orders?.length || 0}</p></div>,
              <div key={`${seller.id}-risk`} className="flex flex-wrap gap-1">{(seller.disputed_orders_count || 0) > 0 && <Badge tone="red">{seller.disputed_orders_count} disputes</Badge>}{seller.seller_status === "suspended" && <Badge tone="red">Checkout paused</Badge>}{!seller.verified && <Badge tone="gold">Not verified</Badge>}</div>,
              <div key={`${seller.id}-actions`} className="grid gap-2">
                <LinkButton href={`/s/${seller.slug}`} variant="secondary">View seller</LinkButton>
                <LinkButton href={`/admin/orders?seller=${encodeURIComponent(seller.shop_name)}`} variant="secondary">View orders</LinkButton>
                {seller.seller_status !== "suspended" && (
                  <form action={suspendSellerAction}>
                    <input type="hidden" name="seller_id" value={seller.id} />
                    <input type="hidden" name="notes" value="Suspended from admin seller risk register." />
                    <ConfirmSubmitButton variant="danger" confirmMessage={`Suspend ${seller.shop_name}? Checkout links will be paused.`}>Suspend</ConfirmSubmitButton>
                  </form>
                )}
              </div>
            ])}
            empty={<EmptyState title="No sellers match these filters" body="Clear the search or status filter to return to the full seller register." action={<LinkButton href="/admin/sellers" variant="secondary">Clear filters</LinkButton>} />}
          />
        </Card>
      </div>
    </AdminShell>
  );
}

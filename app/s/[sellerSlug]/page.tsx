import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MessageCircle, PackageCheck, ShieldAlert, ShieldCheck, Star } from "lucide-react";
import { getSellerBySlug } from "@/lib/data";
import { reportSellerAction } from "@/lib/actions";
import { Badge, Button, Card, EmptyState, LinkButton, MetricCard, Textarea, TrustBadge } from "@/components/ui";
import { PageShell, PublicHeader } from "@/components/shells";

export async function generateMetadata({ params }: { params: Promise<{ sellerSlug: string }> }): Promise<Metadata> {
  const route = await params;
  const { seller } = await getSellerBySlug(route.sellerSlug);
  return { title: seller ? `${seller.shop_name} - Verified Seller Profile` : "Seller Profile", description: "DukaSafe verified seller profile." };
}

export default async function SellerProfilePage({ params }: { params: Promise<{ sellerSlug: string }> }) {
  const route = await params;
  const { seller, products, reviews } = await getSellerBySlug(route.sellerSlug);
  if (!seller) notFound();
  return (
    <>
      <PublicHeader />
      <PageShell className="space-y-6">
        <Card className="grid gap-6 lg:grid-cols-[1fr_18rem]">
          <div>
            <TrustBadge score={seller.trust_score} badge={seller.trust_badge} />
            <h1 className="mt-4 text-4xl font-black text-forest">{seller.shop_name}</h1>
            <p className="mt-2 text-lg font-semibold text-sage">{seller.category} - {seller.location_city}{seller.location_area ? `, ${seller.location_area}` : ""}</p>
            <p className="mt-4 max-w-2xl text-charcoal/70">{seller.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">{(seller.delivery_regions || []).map((region: string) => <Badge key={region} tone="sand">{region}</Badge>)}</div>
          </div>
          <Card className="rounded-3xl bg-sand">
            <p className="text-sm font-black text-forest">Masked WhatsApp</p>
            <p className="mt-2 text-2xl font-black">{seller.masked_whatsapp || "Hidden until order"}</p>
            <p className="mt-3 text-sm text-charcoal/65">Contact details unlock after a protected order is placed.</p>
            <LinkButton href="#products" className="mt-5 w-full">Shop Safely</LinkButton>
          </Card>
        </Card>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Trust score" value={`${Math.round(Number(seller.trust_score || 0))}/100`} icon={<ShieldCheck className="h-5 w-5" />} />
          <MetricCard label="Completed orders" value={seller.completed_orders_count || 0} icon={<PackageCheck className="h-5 w-5" />} />
          <MetricCard label="Rating" value={`${seller.rating_average || 0}/5`} icon={<Star className="h-5 w-5" />} />
          <MetricCard label="Refund window" value={`${seller.refund_window_hours || 24}h`} icon={<ShieldAlert className="h-5 w-5" />} />
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <Card>
            <h2 className="text-2xl font-black text-forest">Delivery & refund policy</h2>
            <p className="mt-4 text-sm leading-6 text-charcoal/75">{seller.delivery_terms}</p>
            <div className="mt-4 rounded-3xl bg-white/70 p-4 text-sm leading-6 text-charcoal/75">{seller.refund_policy}</div>
          </Card>
          <Card>
            <h2 className="text-2xl font-black text-forest">Recent verified reviews</h2>
            <div className="mt-4 grid gap-3">
              {reviews.length ? reviews.map((review: { id: string; rating: number; comment?: string }) => <div key={review.id} className="rounded-2xl bg-white/70 p-3 text-sm"><p className="font-black text-amber">{review.rating}/5</p><p className="mt-1 text-charcoal/70">{review.comment}</p></div>) : <EmptyState title="No public reviews yet" body="Verified order reviews will appear here." />}
            </div>
          </Card>
        </section>

        <section id="products" className="space-y-4">
          <h2 className="text-3xl font-black text-forest">Active protected links</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {products.length ? products.map((product: { id: string; name: string; price: number; description?: string; currency?: string }) => (
              <Card key={product.id}>
                <Badge tone="green">Protected checkout</Badge>
                <h3 className="mt-3 text-xl font-black text-forest">{product.name}</h3>
                <p className="mt-2 text-sm text-charcoal/65">{product.description}</p>
                <p className="mt-4 text-2xl font-black">KSh {Number(product.price).toLocaleString()}</p>
                <LinkButton href={`/checkout/${product.id}`} className="mt-5 w-full">Shop Safely</LinkButton>
              </Card>
            )) : <EmptyState title="No active product links" body="This seller has no public checkout links right now." />}
          </div>
        </section>

        <Card>
          <h2 className="text-2xl font-black text-forest">Report concern</h2>
          <form action={reportSellerAction} className="mt-4 grid gap-4 md:grid-cols-2">
            <input type="hidden" name="seller_id" value={seller.id} />
            <input name="reporter_name" className="min-h-12 rounded-2xl border border-forest/10 bg-white/80 px-4" placeholder="Your name" />
            <input name="reporter_phone" className="min-h-12 rounded-2xl border border-forest/10 bg-white/80 px-4" placeholder="+254..." />
            <input name="seller_link_or_phone" className="min-h-12 rounded-2xl border border-forest/10 bg-white/80 px-4 md:col-span-2" defaultValue={`/s/${seller.slug}`} />
            <Textarea name="reason" label="Concern" required className="md:col-span-2" />
            <Textarea name="evidence_summary" label="Evidence summary" className="md:col-span-2" />
            <Button type="submit" variant="secondary"><MessageCircle className="h-4 w-4" /> Submit report</Button>
          </form>
        </Card>
      </PageShell>
    </>
  );
}

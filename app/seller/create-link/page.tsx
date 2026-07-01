import type { Metadata } from "next";
import { headers } from "next/headers";
import { PackagePlus } from "lucide-react";
import { createProductAction } from "@/lib/actions";
import { getSellerWorkspace } from "@/lib/data";
import { ActionPanel, Button, Card, Input, LinkButton, Select, Textarea, TrustBadge, formatStatus } from "@/components/ui";
import { SellerShell } from "@/components/shells";
import { ShareLinkActions } from "@/components/share-link-actions";

export const metadata: Metadata = { title: "Create Protected Link", description: "Create a DukaSafe protected product checkout link." };

export default async function CreateLinkPage({ searchParams }: { searchParams: Promise<{ created?: string; error?: string }> }) {
  const query = await searchParams;
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const proto = requestHeaders.get("x-forwarded-proto") || "http";
  const baseUrl = host ? `${proto}://${host}` : undefined;
  const { seller, products } = await getSellerWorkspace();
  const canCreateLinks = Boolean(seller?.verified && seller.seller_status === "active" && seller.verification_status === "approved");
  return (
    <SellerShell>
      <div className="grid gap-5 lg:grid-cols-[1fr_0.72fr]">
        <Card>
          <h1 className="text-4xl font-black text-forest">Create a protected order link</h1>
          <p className="mt-2 text-charcoal/70">Share this link on TikTok, WhatsApp, or Instagram instead of posting a raw M-PESA number.</p>
          {query.error && <div className="mt-5"><ActionPanel title="Check your product link" body={query.error} tone="red" /></div>}
          {!seller ? (
            <ActionPanel
              title="Verification required"
              body="Create your seller profile and submit documents before DukaSafe can issue protected checkout links for buyers."
              action={<LinkButton href="/seller/register">Verify My Shop</LinkButton>}
              tone="gold"
            />
          ) : !canCreateLinks ? (
            <ActionPanel
              title={`Checkout links locked: ${formatStatus(seller.verification_status)}`}
              body={seller.verification_status === "needs_more_info"
                ? "Operations needs more details before your shop can sell through DukaSafe. Update your application and resubmit it for review."
                : "Protected checkout links become available after DukaSafe approves your seller verification and activates your shop."}
              action={<LinkButton href={seller.verification_status === "needs_more_info" || seller.verification_status === "rejected" ? "/seller/register" : "/seller/pending"} variant="secondary">Review verification status</LinkButton>}
              tone={seller.verification_status === "rejected" ? "red" : "gold"}
            />
          ) : (
            <form action={createProductAction} className="mt-6 grid gap-4 md:grid-cols-2">
              <Input label="Product name" name="name" defaultValue="White tulle set" required />
              <Input label="Price in KSh" name="price" type="number" defaultValue={1800} required />
              <Textarea label="Description" name="description" required className="md:col-span-2" defaultValue="Elegant white tulle outfit with soft lining, perfect for events and content shoots." />
              <Input label="Product image" name="product_image" type="file" accept="image/png,image/jpeg,image/webp" />
              <Input label="Available sizes" name="available_sizes" defaultValue="S, M, L" />
              <Input label="Delivery options" name="delivery_options" defaultValue="CBD pickup, Rider delivery, Nationwide courier" required className="md:col-span-2" />
              <Textarea label="Delivery terms" name="delivery_terms" required className="md:col-span-2" defaultValue={seller.delivery_terms || "Same-day Nairobi CBD pickup and 24-48hr delivery within major towns."} />
              <Textarea label="Refund policy" name="refund_policy" required className="md:col-span-2" defaultValue={seller.refund_policy || "Refunds reviewed within 24 hours when evidence supports the buyer claim."} />
              <Select label="Refund window" name="refund_window_hours" defaultValue="24">
                <option value="0">No refund window</option>
                <option value="24">24 hours</option>
                <option value="48">48 hours</option>
                <option value="72">72 hours</option>
              </Select>
              <Textarea label="Special notes" name="special_notes" className="md:col-span-2" defaultValue="Confirm size before dispatch. Proof photos are captured before delivery." />
              <Button type="submit" className="md:col-span-2"><PackagePlus className="h-4 w-4" /> Generate protected link</Button>
            </form>
          )}
        </Card>
        <aside className="space-y-5">
          <Card className="bg-forest text-white">
            <p className="text-sm font-bold text-white/70">Live checkout preview</p>
            <h2 className="mt-3 text-2xl font-black">White tulle set</h2>
            <p className="mt-2 text-3xl font-black">KSh 1,800</p>
            <div className="mt-4 rounded-3xl bg-white/10 p-4">
              <p className="font-black">{seller?.shop_name || "Your shop"}</p>
              <div className="mt-2"><TrustBadge score={seller?.trust_score || 50} badge={seller?.trust_badge || "under_review"} /></div>
            </div>
          </Card>
          {query.created && (
            <Card>
              <h2 className="text-xl font-black text-forest">Link generated</h2>
              <p className="mt-2 break-all rounded-2xl bg-sand p-3 text-sm">/checkout/{query.created}</p>
              <ShareLinkActions path={`/checkout/${query.created}`} baseUrl={baseUrl} />
            </Card>
          )}
          <Card>
            <h2 className="text-xl font-black text-forest">Recent links</h2>
            <div className="mt-3 grid gap-2 text-sm">
              {products.slice(0, 4).map((product: { id: string; name: string; price: number }) => <LinkButton key={product.id} href={`/checkout/${product.id}`} variant="ghost" className="justify-between">{product.name}<span>KSh {Number(product.price).toLocaleString()}</span></LinkButton>)}
            </div>
          </Card>
        </aside>
      </div>
    </SellerShell>
  );
}

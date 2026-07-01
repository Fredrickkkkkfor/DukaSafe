import type { Metadata } from "next";
import { headers } from "next/headers";
import { PackagePlus } from "lucide-react";
import { createProductAction } from "@/lib/actions";
import { getSellerWorkspace } from "@/lib/data";
import { ActionPanel, Badge, Button, Card, Input, LinkButton, Select, StatusBadge, Textarea, TrustBadge, formatStatus } from "@/components/ui";
import { SellerShell } from "@/components/shells";
import { ShareLinkActions } from "@/components/share-link-actions";
import { FileUpload } from "@/components/file-upload";

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
              <Input label="Product name" name="name" placeholder="Example: White tulle set" required />
              <Input label="Price in KSh" name="price" type="number" min={1} placeholder="1800" required />
              <Textarea label="Description" name="description" required className="md:col-span-2" placeholder="Describe condition, size, colour, included items, and what the buyer should confirm before paying." />
              <div className="md:col-span-2">
                <FileUpload name="product_image" label="Product image" hint="Clear product photo. PNG, JPG, or WEBP up to 8 MB." />
              </div>
              <Input label="Available sizes" name="available_sizes" placeholder="S, M, L or One size" />
              <Input label="Delivery options" name="delivery_options" placeholder="CBD pickup, Rider delivery, Nationwide courier" required className="md:col-span-2" />
              <Textarea label="Delivery terms" name="delivery_terms" required className="md:col-span-2" placeholder={seller.delivery_terms || "Example: Dispatch after payment proof is accepted. Nairobi same-day rider, parcels to Nakuru and Naivasha."} />
              <Textarea label="Refund policy" name="refund_policy" required className="md:col-span-2" placeholder={seller.refund_policy || "Example: Evidence-based refund review within 48 hours for wrong, damaged, or counterfeit items."} />
              <Select label="Refund window" name="refund_window_hours" defaultValue="24">
                <option value="0">No refund window</option>
                <option value="24">24 hours</option>
                <option value="48">48 hours</option>
                <option value="72">72 hours</option>
              </Select>
              <Textarea label="Special notes" name="special_notes" className="md:col-span-2" placeholder="Example: Buyer should confirm size before dispatch. Seller will upload dispatch proof." />
              <Button type="submit" className="md:col-span-2"><PackagePlus className="h-4 w-4" /> Generate protected link</Button>
            </form>
          )}
        </Card>
        <aside className="space-y-5">
          <Card className="border border-forest/10 bg-white/85">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold uppercase tracking-wide text-sage">Checkout preview</p>
              <Badge tone="gold">Protected checkout</Badge>
            </div>
            <div className="mt-4 rounded-3xl bg-sand p-4">
              <div className="grid h-36 place-items-center rounded-2xl bg-white/70 text-sm font-bold text-sage">Product image preview</div>
              <h2 className="mt-4 text-2xl font-black text-forest">Your product name</h2>
              <p className="mt-2 text-3xl font-black text-forest">KSh price</p>
              <div className="mt-4 rounded-2xl bg-white/80 p-3">
                <p className="font-black text-forest">{seller?.shop_name || "Your shop"}</p>
                <div className="mt-2"><TrustBadge score={seller?.trust_score || 50} badge={seller?.trust_badge || "under_review"} /></div>
              </div>
              <div className="mt-4 rounded-2xl bg-forest px-4 py-3 text-center text-sm font-black text-white">Buyer opens protected checkout</div>
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
            <div className="mt-3 grid gap-3 text-sm">
              {products.slice(0, 4).map((product: { id: string; name: string; price: number; status?: string; created_at?: string }) => (
                <div key={product.id} className="rounded-2xl bg-sand p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-forest">{product.name}</p>
                      <p className="text-xs text-charcoal/60">KSh {Number(product.price).toLocaleString()} {product.created_at ? `- ${new Date(product.created_at).toLocaleDateString()}` : ""}</p>
                    </div>
                    <StatusBadge status={product.status || "active"} />
                  </div>
                  <ShareLinkActions path={`/checkout/${product.id}`} baseUrl={baseUrl} />
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </SellerShell>
  );
}

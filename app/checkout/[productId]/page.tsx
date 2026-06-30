import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CreditCard, LockKeyhole, ShieldCheck } from "lucide-react";
import { createOrderAction } from "@/lib/actions";
import { getCurrentUserAndProfile, getProductForCheckout } from "@/lib/data";
import { ActionPanel, Badge, Button, Card, Input, LinkButton, Select, Stepper, StickyMobileCTA, Textarea, TrustBadge } from "@/components/ui";
import { PageShell, PublicHeader } from "@/components/shells";

export const metadata: Metadata = { title: "Protected Checkout", description: "Place a DukaSafe protected order with M-PESA payment proof." };

export default async function CheckoutPage({ params }: { params: Promise<{ productId: string }> }) {
  const route = await params;
  const { user } = await getCurrentUserAndProfile();
  const { product, seller } = await getProductForCheckout(route.productId);
  if (!product || !seller) redirect("/check");
  const canCheckout = product.status === "active" && seller.verified && seller.seller_status === "active";
  const protectionFee = Math.max(50, Math.round(Number(product.price) * 0.03));
  const total = Number(product.price) + protectionFee;
  const needsAuth = !user && product.id !== "demo-product";
  return (
    <>
      <PublicHeader />
      <PageShell className="grid gap-5 lg:grid-cols-[0.7fr_1fr]">
        <aside className="space-y-4">
          <Card>
            <Badge tone="green"><LockKeyhole className="h-3.5 w-3.5" /> Protected checkout</Badge>
            <h1 className="mt-4 text-3xl font-black text-forest">{product.name}</h1>
            <p className="mt-2 text-sm leading-6 text-charcoal/70">{product.description}</p>
            <p className="mt-5 text-4xl font-black">KSh {Number(product.price).toLocaleString()}</p>
            <div className="mt-5 rounded-3xl bg-sand p-4">
              <p className="text-sm font-black text-forest">{seller.shop_name}</p>
              <div className="mt-2"><TrustBadge score={seller.trust_score} badge={seller.trust_badge} /></div>
            </div>
          </Card>
          <Card>
            <h2 className="text-xl font-black text-forest">M-PESA instructions</h2>
            <div className="mt-4 grid gap-2 text-sm text-charcoal/75">
              <p>1. Pay <strong>KSh {total.toLocaleString()}</strong> to the seller&apos;s verified DukaSafe payment details.</p>
              <p>2. Upload your M-PESA screenshot before submitting.</p>
              <p>3. DukaSafe records the evidence trail for buyer protection.</p>
            </div>
          </Card>
        </aside>
        <Card>
          <h2 className="text-2xl font-black text-forest">Complete protected order</h2>
          <div className="mt-4"><Stepper active={0} steps={["Pending", "Paid", "Dispatched", "Delivered", "Closed"]} /></div>
          {!canCheckout ? (
            <ActionPanel
              title="Protected checkout paused"
              body="This product link is no longer active, or the seller is not currently verified and active. Do not send money directly."
              tone="red"
              action={<LinkButton href={`/s/${seller.slug}`} variant="secondary">View seller profile</LinkButton>}
            />
          ) : needsAuth ? (
            <div className="mt-6 rounded-3xl bg-sand p-5">
              <p className="font-bold text-forest">Create a buyer account to place this protected order.</p>
              <a href={`/signup?next=/checkout/${product.id}`} className="mt-4 inline-flex rounded-2xl bg-forest px-5 py-3 font-bold text-white">Create account</a>
            </div>
          ) : (
            <form action={createOrderAction} className="mt-6 grid gap-4 md:grid-cols-2">
              <input type="hidden" name="product_id" value={product.id} />
              <Input label="Full name" name="buyer_full_name" required />
              <Input label="Phone" name="buyer_phone" placeholder="+254..." required />
              <Input label="Email" name="buyer_email" type="email" />
              <Select label="Delivery method" name="delivery_method" required>
                {(product.delivery_options?.length ? product.delivery_options : ["CBD pickup", "Rider delivery", "Nationwide courier"]).map((option: string) => <option key={option}>{option}</option>)}
              </Select>
              <Input label="Delivery location" name="delivery_location" required className="md:col-span-2" />
              <Select label="Size" name="selected_size">
                <option value="">No size selected</option>
                {(product.available_sizes || []).map((size: string) => <option key={size}>{size}</option>)}
              </Select>
              <Input label="M-PESA payment screenshot" name="payment_proof" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" />
              <Textarea label="Delivery notes" name="delivery_notes" className="md:col-span-2" />
              <div className="rounded-3xl bg-white/70 p-4 md:col-span-2">
                <div className="flex justify-between text-sm"><span>Item</span><strong>KSh {Number(product.price).toLocaleString()}</strong></div>
                <div className="mt-2 flex justify-between text-sm"><span>Buyer protection fee</span><strong>KSh {protectionFee.toLocaleString()}</strong></div>
                <div className="mt-3 flex justify-between border-t border-forest/10 pt-3 text-lg font-black text-forest"><span>Total</span><span>KSh {total.toLocaleString()}</span></div>
              </div>
              <Button id="confirm-order" type="submit" className="md:col-span-2"><CreditCard className="h-4 w-4" /> Confirm Protected Order</Button>
            </form>
          )}
        </Card>
      </PageShell>
      {canCheckout && !needsAuth && (
        <StickyMobileCTA>
          <a href="#confirm-order" className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-forest px-4 text-sm font-bold text-white">Confirm Protected Order</a>
        </StickyMobileCTA>
      )}
    </>
  );
}

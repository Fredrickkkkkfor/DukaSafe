import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { getPolicy } from "@/lib/data";
import { Badge, Card, LinkButton, Stepper } from "@/components/ui";
import { PageShell, PublicHeader } from "@/components/shells";

export const metadata: Metadata = { title: "Protection Charter", description: "DukaSafe buyer and seller protection rules." };

export default async function ProtectionCharterPage() {
  const buyer = await getPolicy("buyer-protection");
  const seller = await getPolicy("seller-protection");
  return (
    <>
      <PublicHeader />
      <PageShell className="space-y-6">
        <section className="text-center">
          <Badge tone="gold"><ShieldCheck className="h-3.5 w-3.5" /> DukaSafe Protection Charter</Badge>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-black text-forest sm:text-6xl">Clear rules for buyers, sellers, refunds, and disputes.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-charcoal/70">Every protected checkout records terms, payment proof, delivery evidence, and dispute actions so decisions can be fair and evidence-led.</p>
        </section>
        <section className="grid gap-5 lg:grid-cols-2">
          <CharterCard title={buyer?.title || "Buyer Protection"} body={buyer?.body || "Buyers are protected by recorded order details, payment proof, delivery status, and dispute evidence. If the item is not delivered, wrong, damaged, counterfeit, or the seller disappears, the buyer can raise a structured case."} />
          <CharterCard title={seller?.title || "Seller Protection"} body={seller?.body || "Genuine sellers are protected by requiring payment evidence before dispatch, recording delivery proof, and resolving disputes using evidence rather than assumptions."} />
        </section>
        <Card>
          <h2 className="text-2xl font-black text-forest">Dispute process timeline</h2>
          <div className="mt-5"><Stepper active={2} steps={["Complaint Raised", "Evidence Uploaded", "Seller Response", "Admin Review", "Resolution Logged"]} /></div>
        </Card>
        <section className="grid gap-4 md:grid-cols-3">
          {[
            ["Plain-language order terms", "The checkout stores item, price, size, delivery method, refund window, and special notes before payment."],
            ["Protected evidence", "M-PESA proof, delivery proof, ID documents, and dispute uploads are stored in protected Supabase Storage buckets."],
            ["Neutral decisions", "Admins review both sides and can refund, partially refund, dismiss, or request more evidence."]
          ].map(([title, body]) => <Card key={title}><h3 className="text-xl font-black text-forest">{title}</h3><p className="mt-3 text-sm leading-6 text-charcoal/70">{body}</p></Card>)}
        </section>
        <section className="grid gap-4 md:grid-cols-3">
          {[
            ["If the seller does not dispatch", "Open the order timeline, check whether payment proof was recorded, then raise a dispute if dispatch proof is missing."],
            ["If the item is wrong", "Upload photos, describe what arrived, and keep the original order terms visible for admin review."],
            ["If a buyer or seller disagrees", "Both sides can provide evidence. DukaSafe compares proof, dates, order terms, and delivery records before a resolution is logged."]
          ].map(([title, body]) => <Card key={title} className="border border-amber/20 bg-amber/10"><h3 className="text-xl font-black text-forest">{title}</h3><p className="mt-3 text-sm leading-6 text-charcoal/75">{body}</p></Card>)}
        </section>
        <Card className="text-center">
          <Badge tone="green">Ready to act</Badge>
          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-black text-forest">Use the charter before money moves, not only after something goes wrong.</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <LinkButton href="/check">Check a Seller</LinkButton>
            <LinkButton href="/orders" variant="secondary">View My Orders</LinkButton>
            <LinkButton href="/check" variant="secondary">Start Protected Checkout</LinkButton>
            <LinkButton href="/seller/register" variant="secondary">Verify My Shop</LinkButton>
          </div>
        </Card>
      </PageShell>
    </>
  );
}

function CharterCard({ title, body }: { title: string; body: string }) {
  return <Card><h2 className="text-2xl font-black text-forest">{title}</h2><p className="mt-4 leading-7 text-charcoal/72">{body}</p></Card>;
}

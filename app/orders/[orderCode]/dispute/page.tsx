import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { raiseDisputeAction } from "@/lib/actions";
import { getCurrentUserAndProfile, getOrderByCode } from "@/lib/data";
import { Button, Card, Input, Select, Textarea } from "@/components/ui";
import { PageShell, PublicHeader } from "@/components/shells";

export const metadata: Metadata = { title: "Raise Dispute", description: "Raise a structured DukaSafe dispute with evidence." };

export default async function RaiseDisputePage({ params }: { params: Promise<{ orderCode: string }> }) {
  const route = await params;
  const { user } = await getCurrentUserAndProfile();
  if (!user) redirect(`/login?next=/orders/${route.orderCode}/dispute`);
  const { order } = await getOrderByCode(route.orderCode);
  if (!order) notFound();
  return (
    <>
      <PublicHeader />
      <PageShell className="grid gap-5 lg:grid-cols-[0.75fr_1fr]">
        <Card>
          <h1 className="text-3xl font-black text-forest">Raise a dispute</h1>
          <p className="mt-3 text-sm leading-6 text-charcoal/70">Use this when the item is not delivered, incorrect, counterfeit, damaged, or the seller disappears. Upload screenshots, chat logs, and photos.</p>
          <div className="mt-5 rounded-3xl bg-sand p-4 text-sm">
            <p><strong>Order:</strong> {order.order_code}</p>
            <p><strong>Item:</strong> {order.item_name}</p>
            <p><strong>Seller:</strong> {order.sellers?.shop_name}</p>
          </div>
        </Card>
        <Card>
          <form action={raiseDisputeAction} className="grid gap-4">
            <input type="hidden" name="order_id" value={order.id} />
            <input type="hidden" name="order_code" value={order.order_code} />
            <Select label="Dispute type" name="type" required>
              <option value="item_not_received">Item not received</option>
              <option value="wrong_item">Wrong item</option>
              <option value="counterfeit_or_fake">Counterfeit or fake</option>
              <option value="damaged_item">Damaged item</option>
              <option value="seller_disappeared">Seller disappeared</option>
              <option value="other">Other</option>
            </Select>
            <Input label="Short title" name="title" required />
            <Textarea label="Complaint text" name="summary" required />
            <Textarea label="Requested outcome" name="buyer_requested_outcome" placeholder="Refund, replacement, partial refund..." />
            <Input label="Evidence uploads" name="evidence" type="file" multiple accept="image/png,image/jpeg,image/webp,application/pdf" />
            <Button type="submit">Submit dispute</Button>
          </form>
        </Card>
      </PageShell>
    </>
  );
}

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { raiseDisputeAction } from "@/lib/actions";
import { getCurrentUserAndProfile } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ActionPanel, Badge, Button, Card, Input, LinkButton, StatusBadge, Stepper, StickyMobileCTA, Textarea } from "@/components/ui";
import { PageShell, PublicHeader } from "@/components/shells";
import { FileUpload } from "@/components/file-upload";

export const metadata: Metadata = { title: "Raise Dispute", description: "Raise a structured DukaSafe dispute with evidence." };

export default async function RaiseDisputePage({ params, searchParams }: { params: Promise<{ orderCode: string }>; searchParams: Promise<{ error?: string }> }) {
  const route = await params;
  const query = await searchParams;
  const { user } = await getCurrentUserAndProfile();
  if (!user) redirect(`/login?next=/orders/${route.orderCode}/dispute`);
  const supabase = await createSupabaseServerClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*, sellers(shop_name)")
    .eq("order_code", route.orderCode)
    .eq("buyer_id", user.id)
    .maybeSingle();
  if (!order) notFound();
  const disputeWindowOpen = order.dispute_window_closes_at ? new Date(order.dispute_window_closes_at).getTime() >= new Date().getTime() : false;
  const canDispute = !["cancelled", "refunded", "disputed"].includes(order.status) && (order.status !== "closed" || disputeWindowOpen);
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
            <div className="mt-3"><StatusBadge status={order.status} /></div>
          </div>
          <div className="mt-5">
            <ActionPanel
              title={canDispute ? "What happens next" : "Dispute not available"}
              body={canDispute
                ? "DukaSafe will record your evidence, notify the seller, and give the seller a response deadline before admin review."
                : "This order cannot accept a new dispute because it is already disputed, refunded, cancelled, or the dispute window has closed."}
              tone={canDispute ? "gold" : "red"}
              action={!canDispute && <LinkButton href={`/orders/${order.order_code}`} variant="secondary">Back to order</LinkButton>}
            />
          </div>
          <div className="mt-5 rounded-3xl bg-white/70 p-4 text-sm leading-6 text-charcoal/70">
            <p><strong>Dispute window:</strong> {order.dispute_window_closes_at ? `Closes ${new Date(order.dispute_window_closes_at).toLocaleString()}` : "Open while the order is active"}</p>
            <p><strong>Seller response:</strong> Usually due within 48 hours after submission.</p>
            <p><strong>Evidence:</strong> Screenshots, product photos, payment proof, delivery photos, and chat logs help resolve faster.</p>
          </div>
          <div className="mt-5">
            <Stepper active={0} steps={["Complaint raised", "Evidence uploaded", "Seller response", "Admin review", "Resolution logged"]} />
          </div>
        </Card>
        <Card>
          {canDispute ? (
            <form action={raiseDisputeAction} className="grid gap-4">
              {query.error && <ActionPanel title="Check your dispute details" body={query.error} tone="red" />}
              <input type="hidden" name="order_id" value={order.id} />
              <input type="hidden" name="order_code" value={order.order_code} />
              <div>
                <p className="mb-2 text-sm font-bold text-forest">Dispute type</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    ["item_not_received", "Item not received"],
                    ["wrong_item", "Wrong item"],
                    ["counterfeit_or_fake", "Counterfeit/fake"],
                    ["damaged_item", "Damaged item"],
                    ["seller_disappeared", "Seller disappeared"],
                    ["other", "Other"]
                  ].map(([value, label], index) => (
                    <label key={value} className="flex min-h-14 items-center gap-3 rounded-2xl border border-forest/10 bg-white/75 px-4 text-sm font-bold text-forest">
                      <input type="radio" name="type" value={value} required defaultChecked={index === 0} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              <Input label="Short title" name="title" required minLength={3} />
              <div>
                <Textarea label="Complaint text" name="summary" required minLength={20} placeholder="Describe what happened clearly in at least 20 characters." />
                <p className="mt-2 text-xs font-bold text-sage">Describe what happened in at least 20 characters.</p>
              </div>
              <Textarea label="Requested outcome" name="buyer_requested_outcome" placeholder="Refund, replacement, partial refund..." />
              <FileUpload name="evidence" label="Evidence uploads" multiple accept="image/png,image/jpeg,image/webp,application/pdf" hint="Screenshots, product photos, chat logs, or PDF evidence up to 8 MB each." />
              <ActionPanel title="Evidence helps" body="If you can add a screenshot or photo, it helps DukaSafe resolve faster. Item-not-received cases may still be submitted when physical evidence is not available." tone="sand" />
              <div className="flex flex-wrap gap-2">
                <Badge tone="sand">Complaint raised</Badge>
                <Badge tone="sand">Seller response</Badge>
                <Badge tone="sand">Admin review</Badge>
                <Badge tone="sand">Resolution logged</Badge>
              </div>
              <Button id="submit-dispute" type="submit">Submit dispute</Button>
            </form>
          ) : (
            <ActionPanel title="No new dispute can be opened" body="Return to the order timeline to view existing evidence, status changes, or resolved cases." action={<LinkButton href={`/orders/${order.order_code}`}>Open order timeline</LinkButton>} tone="red" />
          )}
        </Card>
      </PageShell>
      {canDispute && (
        <StickyMobileCTA>
          <a href="#submit-dispute" className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-forest px-4 text-sm font-bold text-white">Submit Dispute</a>
        </StickyMobileCTA>
      )}
    </>
  );
}

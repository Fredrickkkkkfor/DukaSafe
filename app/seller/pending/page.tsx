import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import { getSellerWorkspace } from "@/lib/data";
import { ActionPanel, Card, LinkButton, StatusBadge, Stepper, formatStatus } from "@/components/ui";
import { SellerShell } from "@/components/shells";

export const metadata: Metadata = { title: "Verification Pending", description: "Your DukaSafe seller verification is under review." };

export default async function SellerPendingPage() {
  const { user, seller } = await getSellerWorkspace();
  if (!user) redirect("/login?next=/seller/pending");
  if (!seller) redirect("/seller/register");
  if (seller.seller_status === "suspended" || seller.seller_status === "banned") redirect("/account-restricted");
  if (seller.verification_status === "approved" && seller.seller_status === "active") redirect("/seller/dashboard");
  const needsAction = seller.verification_status === "needs_more_info" || seller.verification_status === "rejected";
  return (
    <SellerShell>
      <Card>
        <div className="mx-auto max-w-3xl text-center">
          <ShieldCheck className="mx-auto h-14 w-14 text-amber" />
          <div className="mt-4 flex justify-center"><StatusBadge status={seller.verification_status} /></div>
          <h1 className="mt-5 text-4xl font-black text-forest">{needsAction ? "Your verification needs attention." : "Your shop is under review."}</h1>
          <p className="mt-3 text-charcoal/70">
            {needsAction
              ? "Update the requested details so DukaSafe operations can continue reviewing your shop."
              : "Our operations team checks identity, shop proof, social account ownership, and payment details. Review usually takes 24-48 hours."}
          </p>
          <div className="mt-6"><Stepper active={needsAction ? 1 : 2} steps={["Application submitted", formatStatus(seller.verification_status), "Social account check", "Verified badge issued"]} /></div>
          {needsAction && (
            <div className="mt-6 text-left">
              <ActionPanel
                title={formatStatus(seller.verification_status)}
                body={seller.rejection_reason || "Upload clearer documents, confirm your shop links, or correct payment details so review can continue."}
                action={<LinkButton href="/seller/register" variant="secondary">Update application</LinkButton>}
                tone={seller.verification_status === "rejected" ? "red" : "gold"}
              />
            </div>
          )}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <LinkButton href="/seller/dashboard" variant="secondary"><CheckCircle2 className="h-4 w-4" /> Go to Seller Dashboard</LinkButton>
            <LinkButton href="/seller/register" variant={needsAction ? "primary" : "secondary"}><Clock3 className="h-4 w-4" /> {needsAction ? "Update Application" : "Edit Application"}</LinkButton>
          </div>
        </div>
      </Card>
    </SellerShell>
  );
}

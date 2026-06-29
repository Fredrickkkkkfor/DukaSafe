import type { Metadata } from "next";
import { CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import { Card, LinkButton, Stepper } from "@/components/ui";
import { SellerShell } from "@/components/shells";

export const metadata: Metadata = { title: "Verification Pending", description: "Your DukaSafe seller verification is under review." };

export default function SellerPendingPage() {
  return (
    <SellerShell>
      <Card>
        <div className="mx-auto max-w-3xl text-center">
          <ShieldCheck className="mx-auto h-14 w-14 text-amber" />
          <h1 className="mt-5 text-4xl font-black text-forest">Your shop is under review.</h1>
          <p className="mt-3 text-charcoal/70">Our operations team checks identity, shop proof, social account ownership, and payment details. Review usually takes 24-48 hours.</p>
          <div className="mt-6"><Stepper active={1} steps={["Application submitted", "ID review", "Social account check", "Verified badge issued"]} /></div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <LinkButton href="/seller/dashboard"><CheckCircle2 className="h-4 w-4" /> Go to Seller Dashboard</LinkButton>
            <LinkButton href="/seller/register" variant="secondary"><Clock3 className="h-4 w-4" /> Edit Application</LinkButton>
          </div>
        </div>
      </Card>
    </SellerShell>
  );
}

import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { Card, LinkButton } from "@/components/ui";
import { PageShell, PublicHeader } from "@/components/shells";

export const metadata: Metadata = {
  title: "Account Restricted",
  description: "Your DukaSafe account needs support review."
};

export default function AccountRestrictedPage() {
  return (
    <>
      <PublicHeader />
      <PageShell className="grid place-items-center">
        <Card className="max-w-lg text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-amber" />
          <h1 className="mt-5 text-4xl font-black text-forest">Account access is restricted.</h1>
          <p className="mt-3 text-charcoal/70">
            Some DukaSafe features are paused for this account. Buyer safety, seller protection, and evidence records remain preserved.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <LinkButton href="/check" variant="secondary">Check a Seller</LinkButton>
            <LinkButton href="/report-concern">Contact Support</LinkButton>
          </div>
        </Card>
      </PageShell>
    </>
  );
}

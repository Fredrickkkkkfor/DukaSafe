import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { Card, LinkButton } from "@/components/ui";
import { PageShell, PublicHeader } from "@/components/shells";

export const metadata: Metadata = {
  title: "Access Needed",
  description: "This DukaSafe page requires a different account role."
};

export default function UnauthorizedPage() {
  return (
    <>
      <PublicHeader />
      <PageShell className="grid place-items-center">
        <Card className="max-w-lg text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-amber" />
          <h1 className="mt-5 text-4xl font-black text-forest">You do not have access to this page.</h1>
          <p className="mt-3 text-charcoal/70">
            This area is protected for a different DukaSafe role. Use the right dashboard, or log in with another account.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <LinkButton href="/orders" variant="secondary">Go to My Orders</LinkButton>
            <LinkButton href="/seller/dashboard">Seller Dashboard</LinkButton>
          </div>
          <LinkButton href="/login" variant="ghost" className="mt-3">Log in with another account</LinkButton>
        </Card>
      </PageShell>
    </>
  );
}

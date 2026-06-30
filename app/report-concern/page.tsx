import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { reportSellerAction } from "@/lib/actions";
import { Button, Card, Input, Textarea } from "@/components/ui";
import { PageShell, PublicHeader } from "@/components/shells";

export const metadata: Metadata = {
  title: "Report Concern",
  description: "Report a seller safety concern to DukaSafe operations."
};

export default function ReportConcernPage({ searchParams }: { searchParams: Promise<{ seller?: string }> }) {
  return (
    <>
      <PublicHeader />
      <PageShell className="grid gap-5 lg:grid-cols-[0.75fr_1fr]">
        <Card>
          <ShieldAlert className="h-12 w-12 text-amber" />
          <h1 className="mt-5 text-4xl font-black text-forest">Report a seller concern</h1>
          <p className="mt-3 text-charcoal/70">
            Reports help DukaSafe review seller safety. Do not submit false claims; operations reviews reports before any action is taken.
          </p>
        </Card>
        <Card>
          <form action={reportSellerAction} className="grid gap-4">
            <ReportConcernFields searchParams={searchParams} />
          </form>
        </Card>
      </PageShell>
    </>
  );
}

async function ReportConcernFields({ searchParams }: { searchParams: Promise<{ seller?: string }> }) {
  const query = await searchParams;
  return (
    <>
      <Input label="Seller link, phone, or shop name" name="seller_link_or_phone" defaultValue={query.seller || ""} required />
      <Input label="Your name" name="reporter_name" />
      <Input label="Your phone" name="reporter_phone" placeholder="+254..." />
      <Textarea label="Reason" name="reason" required placeholder="Tell us what happened." />
      <Textarea label="Evidence summary" name="evidence_summary" placeholder="Mention screenshots, payment messages, chat logs, or order links." />
      <Button type="submit">Submit report</Button>
    </>
  );
}

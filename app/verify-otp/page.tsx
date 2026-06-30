import type { Metadata } from "next";
import { verifyOtpAction } from "@/lib/actions";
import { Badge, Button, Card, Input, LinkButton } from "@/components/ui";
import { PageShell, PublicHeader } from "@/components/shells";

export const metadata: Metadata = {
  title: "Verify Code",
  description: "Enter your DukaSafe secure sign-in code."
};

export default async function VerifyOtpPage({ searchParams }: { searchParams: Promise<{ phone?: string; next?: string; mode?: string; error?: string; role?: string }> }) {
  const query = await searchParams;
  return (
    <>
      <PublicHeader />
      <PageShell className="grid place-items-center">
        <Card className="w-full max-w-md">
          <Badge tone="gold">Secure code</Badge>
          <h1 className="mt-4 text-3xl font-black text-forest">Enter your secure code</h1>
          <p className="mt-2 text-sm text-charcoal/65">We sent a six-digit code to {query.phone || "your phone"}.</p>
          {query.error && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{query.error}</p>}
          <form action={verifyOtpAction} className="mt-6 grid gap-4">
            <input type="hidden" name="phone" value={query.phone || ""} />
            <input type="hidden" name="next" value={query.next || ""} />
            <input type="hidden" name="mode" value={query.mode || "login"} />
            <input type="hidden" name="role" value={query.role || "buyer"} />
            <Input label="Six-digit code" name="token" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required />
            <Button type="submit">Verify and continue</Button>
          </form>
          <div className="mt-5 flex flex-col gap-2 text-sm">
            <LinkButton href={`/login${query.next ? `?next=${encodeURIComponent(query.next)}` : ""}`} variant="ghost" className="min-h-0 justify-start px-0 py-0">Change phone number</LinkButton>
            <p className="text-charcoal/60">Code expired or wrong? Request a new one from the previous screen.</p>
          </div>
        </Card>
      </PageShell>
    </>
  );
}

import type { Metadata } from "next";
import { signInAction } from "@/lib/actions";
import { Card, Input, LinkButton, Button } from "@/components/ui";
import { PageShell, PublicHeader } from "@/components/shells";

export const metadata: Metadata = { title: "Login", description: "Sign in to your DukaSafe account." };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const query = await searchParams;
  return (
    <>
      <PublicHeader />
      <PageShell className="grid place-items-center">
        <Card className="w-full max-w-md">
          <h1 className="text-3xl font-black text-forest">Welcome back</h1>
          <p className="mt-2 text-sm text-charcoal/65">Continue to protected checkout, seller tools, or admin operations.</p>
          {query.error && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{query.error}</p>}
          <form action={signInAction} className="mt-6 grid gap-4">
            <input type="hidden" name="next" value={query.next || ""} />
            <Input label="Email" name="email" type="email" required />
            <Input label="Password" name="password" type="password" required minLength={6} />
            <Button type="submit">Sign in</Button>
          </form>
          <p className="mt-5 text-sm text-charcoal/65">New here? <LinkButton href="/signup" variant="ghost" className="min-h-0 px-1 py-0">Create account</LinkButton></p>
        </Card>
      </PageShell>
    </>
  );
}

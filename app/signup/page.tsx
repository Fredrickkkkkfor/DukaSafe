import type { Metadata } from "next";
import { signUpAction } from "@/lib/actions";
import { Button, Card, Input, Select } from "@/components/ui";
import { PageShell, PublicHeader } from "@/components/shells";

export const metadata: Metadata = { title: "Create Account", description: "Create a DukaSafe buyer, seller, or operations account." };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const query = await searchParams;
  return (
    <>
      <PublicHeader />
      <PageShell className="grid place-items-center">
        <Card className="w-full max-w-md">
          <h1 className="text-3xl font-black text-forest">Create your account</h1>
          <p className="mt-2 text-sm text-charcoal/65">Use buyer checkout, submit seller verification, or access operations tools.</p>
          {query.error && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{query.error}</p>}
          <form action={signUpAction} className="mt-6 grid gap-4">
            <input type="hidden" name="next" value={query.next || ""} />
            <Input label="Full name" name="full_name" required />
            <Input label="Email" name="email" type="email" required />
            <Input label="Password" name="password" type="password" required minLength={6} />
            <Select label="Account type" name="role" defaultValue="buyer">
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
              <option value="operations">Operations</option>
            </Select>
            <Button type="submit">Create account</Button>
          </form>
        </Card>
      </PageShell>
    </>
  );
}

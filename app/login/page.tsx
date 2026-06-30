import type { Metadata } from "next";
import { sendPhoneOtpAction, signInAction } from "@/lib/actions";
import { Card, Input, LinkButton, Button, Badge } from "@/components/ui";
import { PageShell, PublicHeader } from "@/components/shells";

export const metadata: Metadata = { title: "Login", description: "Sign in to your DukaSafe account." };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const query = await searchParams;
  const phoneUnavailable = isPhoneAuthUnavailable(query.error);
  return (
    <>
      <PublicHeader />
      <PageShell className="grid place-items-center">
        <Card className="w-full max-w-md">
          <Badge tone="gold">Secure sign in</Badge>
          <h1 className="mt-4 text-3xl font-black text-forest">Welcome back</h1>
          <p className="mt-2 text-sm text-charcoal/65">We use your account to protect orders, evidence, and disputes.</p>
          {query.error && (
            <p className={`mt-4 rounded-2xl p-3 text-sm font-bold ${phoneUnavailable ? "bg-amber/15 text-forest" : "bg-red-50 text-red-700"}`}>
              {authErrorMessage(query.error)}
            </p>
          )}
          <form action={sendPhoneOtpAction} className="mt-6 grid gap-4 rounded-3xl bg-sand p-4">
            <input type="hidden" name="next" value={query.next || ""} />
            <input type="hidden" name="mode" value="login" />
            <Input label="Continue with phone number" name="phone" placeholder="+254..." required />
            <p className="text-xs text-charcoal/60">We&apos;ll send a secure code to confirm it&apos;s you.</p>
            <Button type="submit">Send code</Button>
          </form>
          <div className="my-5 flex items-center gap-3 text-xs font-bold uppercase text-sage"><span className="h-px flex-1 bg-forest/10" /> Email fallback <span className="h-px flex-1 bg-forest/10" /></div>
          <form action={signInAction} className="grid gap-4">
            <input type="hidden" name="next" value={query.next || ""} />
            <Input label="Email" name="email" type="email" required />
            <Input label="Password" name="password" type="password" required minLength={6} />
            <Button type="submit">Sign in</Button>
          </form>
          <div className="mt-5 flex flex-col gap-2 text-sm text-charcoal/65">
            <p>New here? <LinkButton href={`/signup${query.next ? `?next=${encodeURIComponent(query.next)}` : ""}`} variant="ghost" className="min-h-0 px-1 py-0">Create account</LinkButton></p>
            <LinkButton href="/check" variant="ghost" className="min-h-0 justify-start px-0 py-0">Continue to check seller</LinkButton>
          </div>
        </Card>
      </PageShell>
    </>
  );
}

function authErrorMessage(error: string) {
  if (isPhoneAuthUnavailable(error)) return "Phone sign-in is not enabled yet. Use email below to continue safely.";
  const messages: Record<string, string> = {
    "missing-supabase-env": "Supabase environment variables are missing. Add them before signing in."
  };
  return messages[error] || error;
}

function isPhoneAuthUnavailable(error?: string) {
  return error === "phone-auth-unavailable" || error?.toLowerCase() === "unsupported phone provider";
}

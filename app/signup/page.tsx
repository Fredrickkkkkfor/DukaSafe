import type { Metadata } from "next";
import { sendPhoneOtpAction, signUpAction } from "@/lib/actions";
import { Badge, Button, Card, Input, LinkButton } from "@/components/ui";
import { PageShell, PublicHeader } from "@/components/shells";

export const metadata: Metadata = { title: "Create Account", description: "Create a DukaSafe buyer, seller, or operations account." };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const query = await searchParams;
  const fallbackRole = query.next?.startsWith("/seller") ? "seller" : "buyer";
  const phoneUnavailable = isPhoneAuthUnavailable(query.error);
  return (
    <>
      <PublicHeader />
      <PageShell className="grid place-items-center">
        <Card className="w-full max-w-md">
          <Badge tone="gold">Protected account</Badge>
          <h1 className="mt-4 text-3xl font-black text-forest">Create your DukaSafe account</h1>
          <p className="mt-2 text-sm text-charcoal/65">Choose how you want to use DukaSafe. Admin roles are assigned privately by operations.</p>
          {query.error && (
            <p className={`mt-4 rounded-2xl p-3 text-sm font-bold ${phoneUnavailable ? "bg-amber/15 text-forest" : "bg-red-50 text-red-700"}`}>
              {authErrorMessage(query.error)}
            </p>
          )}
          <form action={sendPhoneOtpAction} className="mt-6 grid gap-4 rounded-3xl bg-sand p-4">
            <input type="hidden" name="next" value={query.next || ""} />
            <input type="hidden" name="mode" value="signup" />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="cursor-pointer rounded-3xl bg-white/75 p-4 ring-1 ring-forest/10">
                <input className="sr-only peer" type="radio" name="role" value="buyer" defaultChecked />
                <span className="block text-lg font-black text-forest peer-checked:text-amber">I am buying safely</span>
                <span className="mt-1 block text-xs text-charcoal/60">Track orders, payment proof, delivery, and disputes.</span>
              </label>
              <label className="cursor-pointer rounded-3xl bg-white/75 p-4 ring-1 ring-forest/10">
                <input className="sr-only peer" type="radio" name="role" value="seller" />
                <span className="block text-lg font-black text-forest peer-checked:text-amber">I want to verify my shop</span>
                <span className="mt-1 block text-xs text-charcoal/60">Submit ID, shop proof, M-PESA details, and socials.</span>
              </label>
            </div>
            <Input label="Phone number" name="phone" placeholder="+254..." required />
            <Button type="submit">Send secure code</Button>
          </form>
          <div className="my-5 flex items-center gap-3 text-xs font-bold uppercase text-sage"><span className="h-px flex-1 bg-forest/10" /> Email fallback <span className="h-px flex-1 bg-forest/10" /></div>
          <form action={signUpAction} className="grid gap-4">
            <input type="hidden" name="next" value={query.next || ""} />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="cursor-pointer rounded-3xl bg-white/75 p-4 ring-1 ring-forest/10">
                <input className="sr-only peer" type="radio" name="role" value="buyer" defaultChecked={fallbackRole === "buyer"} />
                <span className="block text-sm font-black text-forest peer-checked:text-amber">Buyer account</span>
                <span className="mt-1 block text-xs text-charcoal/60">Track protected orders.</span>
              </label>
              <label className="cursor-pointer rounded-3xl bg-white/75 p-4 ring-1 ring-forest/10">
                <input className="sr-only peer" type="radio" name="role" value="seller" defaultChecked={fallbackRole === "seller"} />
                <span className="block text-sm font-black text-forest peer-checked:text-amber">Seller account</span>
                <span className="mt-1 block text-xs text-charcoal/60">Continue verification.</span>
              </label>
            </div>
            <Input label="Full name" name="full_name" required />
            <Input label="Email" name="email" type="email" required />
            <Input label="Password" name="password" type="password" required minLength={6} />
            <Button type="submit">{fallbackRole === "seller" ? "Create Seller Account" : "Create Account"}</Button>
          </form>
          <p className="mt-5 text-sm text-charcoal/65">Already have an account? <LinkButton href="/login" variant="ghost" className="min-h-0 px-1 py-0">Sign in</LinkButton></p>
        </Card>
      </PageShell>
    </>
  );
}

function authErrorMessage(error: string) {
  if (isPhoneAuthUnavailable(error)) return "Phone sign-in is not enabled yet. Use email below to continue safely.";
  const messages: Record<string, string> = {
    "missing-supabase-env": "Supabase environment variables are missing. Add them before creating accounts."
  };
  return messages[error] || error;
}

function isPhoneAuthUnavailable(error?: string) {
  return error === "phone-auth-unavailable" || error?.toLowerCase() === "unsupported phone provider";
}

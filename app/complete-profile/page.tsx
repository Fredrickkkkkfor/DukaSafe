import type { Metadata } from "next";
import { completeProfileAction } from "@/lib/actions";
import { getCurrentUserAndProfile } from "@/lib/data";
import { ActionPanel, Button, Card, Input, Select } from "@/components/ui";
import { PageShell, PublicHeader } from "@/components/shells";

export const metadata: Metadata = {
  title: "Complete Profile",
  description: "Finish setting up your DukaSafe profile."
};

export default async function CompleteProfilePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  const { user, profile } = await getCurrentUserAndProfile();
  const roleLocked = Boolean(profile?.onboarding_completed && profile?.role);
  const selectedRole = profile?.role === "seller" ? "seller" : "buyer";
  return (
    <>
      <PublicHeader />
      <PageShell className="grid place-items-center">
        <Card className="w-full max-w-xl">
          <h1 className="text-3xl font-black text-forest">{roleLocked ? "Profile settings" : "Complete your profile"}</h1>
          <p className="mt-2 text-sm text-charcoal/65">This helps DukaSafe protect your orders, evidence, and seller verification data.</p>
          {query.error && <div className="mt-5"><ActionPanel title="Check your profile" body={query.error} tone="red" /></div>}
          {roleLocked && (
            <div className="mt-5">
              <ActionPanel
                title={`Role locked: ${profile?.role}`}
                body="For safety, completed buyer, seller, and operations roles are not changed casually from this page. Seller upgrades go through verification, and admin roles are assigned only by operations."
                tone="sand"
              />
            </div>
          )}
          <form action={completeProfileAction} className="mt-6 grid gap-4 md:grid-cols-2">
            <Input label="Full name" name="full_name" defaultValue={profile?.full_name || user?.user_metadata?.full_name || ""} required />
            <div>
              <Input label="Phone" name="phone" defaultValue={profile?.phone || ""} placeholder="+254..." required={selectedRole === "seller"} />
              <p className="mt-2 text-xs leading-5 text-charcoal/60">Used for order protection, M-PESA verification, and dispute communication. Sellers must add a phone number before verification.</p>
            </div>
            <Select label="Preferred language" name="preferred_language" defaultValue={profile?.preferred_language || "en"}>
              <option value="en">English</option>
              <option value="sw">Swahili</option>
            </Select>
            <Input label="Default location" name="default_location" defaultValue={profile?.default_location || ""} placeholder="Nairobi, Nakuru..." />
            {roleLocked ? (
              <input type="hidden" name="role" value={selectedRole} />
            ) : (
              <Select label="I want to use DukaSafe as" name="role" defaultValue={selectedRole}>
                <option value="buyer">Buyer</option>
                <option value="seller">Seller - continue to verification</option>
              </Select>
            )}
            <Button type="submit" className="md:col-span-2">Save and continue</Button>
          </form>
        </Card>
      </PageShell>
    </>
  );
}

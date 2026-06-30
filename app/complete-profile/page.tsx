import type { Metadata } from "next";
import { completeProfileAction } from "@/lib/actions";
import { getCurrentUserAndProfile } from "@/lib/data";
import { Button, Card, Input, Select } from "@/components/ui";
import { PageShell, PublicHeader } from "@/components/shells";

export const metadata: Metadata = {
  title: "Complete Profile",
  description: "Finish setting up your DukaSafe profile."
};

export default async function CompleteProfilePage() {
  const { user, profile } = await getCurrentUserAndProfile();
  return (
    <>
      <PublicHeader />
      <PageShell className="grid place-items-center">
        <Card className="w-full max-w-xl">
          <h1 className="text-3xl font-black text-forest">Complete your profile</h1>
          <p className="mt-2 text-sm text-charcoal/65">This helps DukaSafe protect your orders, evidence, and seller verification data.</p>
          <form action={completeProfileAction} className="mt-6 grid gap-4 md:grid-cols-2">
            <Input label="Full name" name="full_name" defaultValue={profile?.full_name || user?.user_metadata?.full_name || ""} required />
            <Input label="Phone" name="phone" defaultValue={profile?.phone || ""} placeholder="+254..." />
            <Select label="Preferred language" name="preferred_language" defaultValue={profile?.preferred_language || "en"}>
              <option value="en">English</option>
              <option value="sw">Swahili</option>
            </Select>
            <Input label="Default location" name="default_location" defaultValue={profile?.default_location || ""} placeholder="Nairobi, Nakuru..." />
            <Select label="I want to use DukaSafe as" name="role" defaultValue={profile?.role === "seller" ? "seller" : "buyer"}>
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
            </Select>
            <Button type="submit" className="md:col-span-2">Save and continue</Button>
          </form>
        </Card>
      </PageShell>
    </>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FileCheck2, Link2, Phone, ShieldCheck, Store } from "lucide-react";
import { registerSellerAction } from "@/lib/actions";
import { getSellerWorkspace } from "@/lib/data";
import { ActionPanel, Button, Card, Input, LinkButton, Select, StatusBadge, Stepper, Textarea, formatStatus } from "@/components/ui";
import { PageShell, PublicHeader } from "@/components/shells";
import { FileUpload } from "@/components/file-upload";

export const metadata: Metadata = { title: "Seller Registration", description: "Apply for DukaSafe seller verification." };

export default async function SellerRegisterPage() {
  const { user, profile, seller } = await getSellerWorkspace();
  if (!user) redirect("/signup?next=/seller/register");
  if (seller?.seller_status === "suspended" || seller?.seller_status === "banned") redirect("/account-restricted");
  if (seller?.verification_status === "approved" && seller.seller_status === "active") redirect("/seller/dashboard");
  if (seller?.verification_status === "pending_review" || seller?.verification_status === "submitted") redirect("/seller/pending");
  const resubmission = seller?.verification_status === "needs_more_info" || seller?.verification_status === "rejected";
  return (
    <>
      <PublicHeader />
      <PageShell className="space-y-5">
        <Card>
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
            <div>
              <h1 className="text-4xl font-black text-forest">{resubmission ? "Update your verification" : "Verify your shop"}</h1>
              <p className="mt-3 max-w-2xl text-charcoal/70">Submit your identity, shop details, social links, and M-PESA information for DukaSafe review. Review usually takes 24-48 hours.</p>
            </div>
            {seller?.verification_status && <StatusBadge status={seller.verification_status} />}
          </div>
          {resubmission && (
            <div className="mt-5">
              <ActionPanel
                title={`Application status: ${formatStatus(seller.verification_status)}`}
                body={seller.rejection_reason || "DukaSafe operations needs corrected information before this shop can be approved. Update the form and submit it again for review."}
                action={<LinkButton href="/seller/pending" variant="ghost">View review timeline</LinkButton>}
                tone={seller.verification_status === "rejected" ? "red" : "gold"}
              />
            </div>
          )}
          <div className="mt-5"><Stepper active={2} steps={["Phone", "Personal", "Shop", "Social", "Submit"]} /></div>
        </Card>
        <form action={registerSellerAction} className="grid gap-5 lg:grid-cols-[1fr_0.55fr]">
          <div className="space-y-5">
            <ActionPanel
              title="You are about to create a seller profile"
              body="Your buyer account remains active. Seller verification needs your phone, ID, shop proof, social links, and M-PESA details. You can create protected links only after DukaSafe approves the shop."
              tone="sand"
            />
            <Card>
              <SectionTitle icon={<Phone className="h-5 w-5" />} title="Phone and account" />
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Input label="Full legal name" name="full_name" defaultValue={profile?.full_name || ""} required />
                <Input label="Phone number" name="phone" placeholder="+254..." defaultValue={seller?.whatsapp_number || ""} required />
              </div>
            </Card>
            <Card>
              <SectionTitle icon={<FileCheck2 className="h-5 w-5" />} title="Identity and proof" />
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <FileUpload label="ID or passport upload" name="id_document" accept="image/png,image/jpeg,image/webp,application/pdf" required hint="Private review document. PNG, JPG, WEBP, or PDF up to 8 MB." />
                <FileUpload label="Shop photos" name="shop_photos" multiple accept="image/png,image/jpeg,image/webp" hint="Upload shop, product, or social-commerce proof photos." />
              </div>
            </Card>
            <Card>
              <SectionTitle icon={<Store className="h-5 w-5" />} title="Shop details" />
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Input label="Shop name" name="shop_name" defaultValue={seller?.shop_name || ""} placeholder="Your shop name" required />
                <Select label="Category" name="category" defaultValue={seller?.category || ""} required>
                  <option value="">Choose category</option>
                  <option value="Fashion & Imported Clothing">Fashion & Imported Clothing</option>
                  <option value="Footwear">Footwear</option>
                  <option value="Beauty & Skincare">Beauty & Skincare</option>
                  <option value="Home & Living">Home & Living</option>
                  <option value="Accessories">Accessories</option>
                </Select>
                <Input label="City" name="location_city" defaultValue={seller?.location_city || ""} placeholder="Nairobi, Nakuru, Mombasa..." required />
                <Input label="Area" name="location_area" defaultValue={seller?.location_area || ""} placeholder="CBD, Westlands, Pipeline..." />
                <Textarea label="Description" name="description" required className="md:col-span-2" defaultValue={seller?.description || ""} placeholder="Describe what you sell and how customers usually find you." />
                <Input label="Delivery regions" name="delivery_regions" defaultValue={Array.isArray(seller?.delivery_regions) ? seller.delivery_regions.join(", ") : ""} placeholder="Nairobi, Nakuru, Naivasha, countrywide courier..." required className="md:col-span-2" />
                <Textarea label="Delivery terms" name="delivery_terms" required className="md:col-span-2" defaultValue={seller?.delivery_terms || ""} placeholder="Explain pickup, rider delivery, courier timing, and who pays delivery fees." />
                <Textarea label="Refund policy" name="refund_policy" required className="md:col-span-2" defaultValue={seller?.refund_policy || ""} placeholder="Explain when refunds or exchanges are reviewed and what evidence is needed." />
                <Input label="Refund window hours" name="refund_window_hours" type="number" defaultValue={seller?.refund_window_hours || 24} required />
              </div>
            </Card>
            <Card>
              <SectionTitle icon={<Link2 className="h-5 w-5" />} title="Social and M-PESA" />
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Input label="WhatsApp number" name="whatsapp_number" placeholder="+254..." defaultValue={seller?.whatsapp_number || ""} required />
                <Input label="M-PESA number" name="mpesa_number" placeholder="+254..." defaultValue={seller?.mpesa_number || ""} />
                <Input label="Till number" name="till_number" defaultValue={seller?.till_number || ""} />
                <Input label="Paybill number" name="paybill_number" defaultValue={seller?.paybill_number || ""} />
                <Input label="TikTok URL" name="tiktok_url" placeholder="https://tiktok.com/@yourshop" defaultValue={seller?.tiktok_url || ""} />
                <Input label="Instagram URL" name="instagram_url" placeholder="https://instagram.com/yourshop" defaultValue={seller?.instagram_url || ""} />
              </div>
            </Card>
          </div>
          <aside className="space-y-5">
            <Card className="sticky top-24">
              <ShieldCheck className="h-10 w-10 text-amber" />
              <h2 className="mt-4 text-2xl font-black text-forest">Submission checklist</h2>
              <ul className="mt-4 space-y-3 text-sm text-charcoal/75">
                <li>Identity document uploaded</li>
                <li>Shop proof or product photos attached</li>
                <li>Social commerce links included</li>
                <li>M-PESA details are accurate</li>
                <li>Refund and dispute terms accepted</li>
              </ul>
              <label className="mt-5 flex items-start gap-3 text-sm font-bold text-forest">
                <input name="terms" type="checkbox" required className="mt-1 h-5 w-5" />
                I accept DukaSafe seller terms, buyer protection rules, and dispute policy.
              </label>
              <Button type="submit" className="mt-5 w-full">Submit for verification</Button>
            </Card>
          </aside>
        </form>
      </PageShell>
    </>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return <h2 className="flex items-center gap-2 text-2xl font-black text-forest">{icon}{title}</h2>;
}

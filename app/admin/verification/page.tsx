import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { approveSellerAction, rejectSellerAction } from "@/lib/actions";
import { getAdminVerificationQueue, getCurrentUserAndProfile } from "@/lib/data";
import { AdminShell } from "@/components/shells";
import { Button, Card, DataTable, EmptyState, Input, StatusBadge, Textarea, TrustBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Admin Verification Queue", description: "Review and approve DukaSafe seller applications." };

export default async function AdminVerificationPage() {
  const { profile } = await getCurrentUserAndProfile();
  if (!profile) redirect("/login?next=/admin/verification");
  if (!["admin", "operations"].includes(profile.role)) redirect("/unauthorized");
  const sellers = await getAdminVerificationQueue();
  return (
    <AdminShell>
      <div className="space-y-5">
        <Card>
          <h1 className="text-4xl font-black text-forest">Seller Verification Queue</h1>
          <p className="mt-2 text-charcoal/70">Review identity, shop proof, social ownership, and payment details before issuing a verified badge.</p>
        </Card>
        <DataTable
          headers={["Seller", "Status", "Documents", "Submitted"]}
          rows={sellers.map((seller: { shop_name: string; verification_status: string; seller_documents?: unknown[]; submitted_at?: string }) => [
            seller.shop_name,
            <StatusBadge key={seller.shop_name} status={seller.verification_status} />,
            seller.seller_documents?.length || 0,
            seller.submitted_at ? new Date(seller.submitted_at).toLocaleString() : "Not submitted"
          ])}
          empty={<EmptyState title="No pending applications" body="Seller applications that need review will appear here." />}
        />
        <section className="grid gap-5">
          {sellers.map((seller: { id: string; shop_name: string; category: string; location_city?: string; verification_status: string; trust_score: number; trust_badge: string; seller_documents?: Array<{ id: string; title: string; evidence_type: string; review_status: string; mime_type?: string }> }) => (
            <Card key={seller.id} className="grid gap-5 lg:grid-cols-[1fr_21rem]">
              <div>
                <TrustBadge score={seller.trust_score} badge={seller.trust_badge} />
                <h2 className="mt-3 text-3xl font-black text-forest">{seller.shop_name}</h2>
                <p className="mt-1 text-sm text-sage">{seller.category} - {seller.location_city}</p>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {(seller.seller_documents || []).map((doc) => <div key={doc.id} className="rounded-2xl bg-white/70 p-3"><p className="font-black text-forest">{doc.title}</p><p className="text-xs text-charcoal/60">{doc.evidence_type} - {doc.mime_type || "file"}</p><StatusBadge status={doc.review_status} /></div>)}
                </div>
              </div>
              <div className="rounded-3xl bg-sand p-4">
                <h3 className="font-black text-forest">Verification checklist</h3>
                <ul className="mt-3 space-y-2 text-sm text-charcoal/70">
                  <li>ID/passport readable</li>
                  <li>Shop proof consistent</li>
                  <li>Social accounts match seller</li>
                  <li>M-PESA details are plausible</li>
                  <li>Refund policy is acceptable</li>
                </ul>
                <div className="mt-4 grid gap-3">
                  <form action={approveSellerAction}>
                    <input type="hidden" name="seller_id" value={seller.id} />
                    <Button type="submit" className="w-full">Approve Seller</Button>
                  </form>
                  <form action={rejectSellerAction} className="grid gap-2">
                    <input type="hidden" name="seller_id" value={seller.id} />
                    <Input label="Reason" name="reason" placeholder="Request more info or rejection reason" />
                    <Button type="submit" variant="secondary">Request More Info / Reject</Button>
                  </form>
                </div>
              </div>
            </Card>
          ))}
        </section>
      </div>
    </AdminShell>
  );
}

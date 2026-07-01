import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock3, HelpCircle, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { approveSellerAction, rejectSellerAction, requestMoreInfoAction } from "@/lib/actions";
import { getAdminAuditLogs, getAdminSellers, getAdminVerificationQueue, getCurrentUserAndProfile } from "@/lib/data";
import { AdminShell } from "@/components/shells";
import { ActionPanel, Badge, Card, DataTable, EmptyState, Input, LinkButton, MetricCard, StatusBadge, TrustBadge, formatStatus } from "@/components/ui";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { SecureEvidenceLink } from "@/components/secure-evidence-link";

export const metadata: Metadata = { title: "Admin Verification Queue", description: "Review and approve DukaSafe seller applications." };
export const dynamic = "force-dynamic";

export default async function AdminVerificationPage() {
  const { profile } = await getCurrentUserAndProfile();
  if (!profile) redirect("/login?next=/admin/verification");
  if (!["admin", "operations"].includes(profile.role)) redirect("/unauthorized");
  const [sellers, allSellers, auditLogs] = await Promise.all([getAdminVerificationQueue(), getAdminSellers(), getAdminAuditLogs("sellers")]);
  const pendingCount = sellers.filter((seller: { verification_status?: string }) => ["submitted", "pending_review"].includes(seller.verification_status || "")).length;
  const infoCount = sellers.filter((seller: { verification_status?: string }) => seller.verification_status === "needs_more_info").length;
  const approvedToday = allSellers.filter((seller: { approved_at?: string | null }) => seller.approved_at && new Date(seller.approved_at).toDateString() === new Date().toDateString()).length;
  const rejectedCount = allSellers.filter((seller: { verification_status?: string }) => seller.verification_status === "rejected").length;
  const recentlyReviewed = allSellers
    .filter((seller: { verification_status?: string; approved_at?: string | null; rejected_at?: string | null }) => ["approved", "rejected", "needs_more_info"].includes(seller.verification_status || "") || seller.approved_at || seller.rejected_at)
    .slice(0, 6);
  return (
    <AdminShell>
      <div className="space-y-5">
        <Card>
          <h1 className="text-4xl font-black text-forest">Seller Verification Queue</h1>
          <p className="mt-2 text-charcoal/70">Review identity, shop proof, social ownership, and payment details before issuing a verified badge.</p>
        </Card>
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard label="Awaiting review" value={pendingCount} icon={<Clock3 className="h-5 w-5" />} />
          <MetricCard label="Needs info" value={infoCount} icon={<HelpCircle className="h-5 w-5" />} />
          <MetricCard label="Approved today" value={approvedToday} icon={<CheckCircle2 className="h-5 w-5" />} />
          <MetricCard label="Rejected applications" value={rejectedCount} icon={<XCircle className="h-5 w-5" />} />
          <MetricCard label="Average review time" value="24-48h" hint="Target SLA" icon={<ShieldCheck className="h-5 w-5" />} />
        </section>
        <DataTable
          headers={["Seller", "Status", "Docs", "Social/M-PESA", "Submitted", "Action"]}
          rows={sellers.map((seller: { id: string; shop_name: string; verification_status: string; seller_documents?: unknown[]; submitted_at?: string; tiktok_url?: string | null; instagram_url?: string | null; whatsapp_number?: string | null; mpesa_number?: string | null; till_number?: string | null; paybill_number?: string | null }) => [
            <span key={`${seller.id}-name`} className="font-black text-forest">{seller.shop_name}</span>,
            <StatusBadge key={seller.shop_name} status={seller.verification_status} />,
            seller.seller_documents?.length || 0,
            <span key={`${seller.id}-signals`} className="text-xs text-charcoal/70">
              {seller.tiktok_url || seller.instagram_url ? "Social linked" : "Social missing"} / {seller.mpesa_number || seller.till_number || seller.paybill_number ? "Payment set" : "Payment missing"}
            </span>,
            seller.submitted_at ? new Date(seller.submitted_at).toLocaleString() : "Not submitted",
            <a key={`${seller.id}-jump`} href={`#seller-${seller.id}`} className="font-bold text-forest underline underline-offset-4">Review application</a>
          ])}
          empty={<EmptyState title="No pending seller applications" body="Seller applications that need review will appear here. Recently reviewed sellers remain visible below for audit context." action={<div className="flex flex-wrap justify-center gap-2"><LinkButton href="/admin/verification" variant="secondary"><RefreshCw className="h-4 w-4" /> Refresh queue</LinkButton><LinkButton href="/admin/policy" variant="secondary">Seller verification policy</LinkButton></div>} />}
        />
        <section className="grid gap-5">
          {sellers.map((seller: { id: string; shop_name: string; category: string; location_city?: string; location_area?: string | null; verification_status: string; trust_score: number; trust_badge: string; seller_documents?: Array<{ id: string; title: string; evidence_type: string; review_status: string; mime_type?: string; storage_path?: string | null; file_url?: string | null }>; tiktok_url?: string | null; instagram_url?: string | null; whatsapp_number?: string | null; mpesa_number?: string | null; till_number?: string | null; paybill_number?: string | null; delivery_regions?: string[]; refund_policy?: string | null; delivery_terms?: string | null; submitted_at?: string | null }) => (
            <Card key={seller.id} id={`seller-${seller.id}`} className="grid gap-5 lg:grid-cols-[1fr_22rem]">
              <div>
                <TrustBadge score={seller.trust_score} badge={seller.trust_badge} />
                <h2 className="mt-3 text-3xl font-black text-forest">{seller.shop_name}</h2>
                <p className="mt-1 text-sm text-sage">{seller.category} - {seller.location_city}{seller.location_area ? `, ${seller.location_area}` : ""}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <Signal label="Submitted" value={seller.submitted_at ? new Date(seller.submitted_at).toLocaleString() : "Not recorded"} />
                  <Signal label="Documents" value={`${seller.seller_documents?.length || 0} files`} />
                  <Signal label="Payment details" value={seller.mpesa_number || seller.till_number || seller.paybill_number ? "Provided" : "Missing"} />
                  <Signal label="Social links" value={seller.tiktok_url || seller.instagram_url ? "Provided" : "Missing"} />
                  <Signal label="WhatsApp" value={seller.whatsapp_number ? "Provided" : "Missing"} />
                  <Signal label="Delivery regions" value={seller.delivery_regions?.length ? seller.delivery_regions.join(", ") : "Missing"} />
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {(seller.seller_documents || []).map((doc) => (
                    <div key={doc.id} className="rounded-2xl bg-white/70 p-3 ring-1 ring-forest/10">
                      <p className="font-black text-forest">{doc.title}</p>
                      <p className="text-xs text-charcoal/60">{formatStatus(doc.evidence_type)} - {doc.mime_type || "file"} - {doc.storage_path ? "private storage" : "metadata only"}</p>
                      <StatusBadge status={doc.review_status} />
                      <SecureEvidenceLink bucket="seller-documents" path={doc.storage_path} label="Open protected document" />
                    </div>
                  ))}
                  {!seller.seller_documents?.length && <ActionPanel title="No documents attached" body="Request more information before approving. Private ID/shop proof must be reviewed through protected storage metadata or signed access." tone="gold" />}
                </div>
                <Card className="mt-5 rounded-3xl bg-sand">
                  <h3 className="font-black text-forest">Shop policy snapshot</h3>
                  <p className="mt-2 text-sm text-charcoal/70"><strong>Delivery:</strong> {seller.delivery_terms || "Not provided"}</p>
                  <p className="mt-2 text-sm text-charcoal/70"><strong>Refund:</strong> {seller.refund_policy || "Not provided"}</p>
                </Card>
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
                    <ConfirmSubmitButton className="w-full" confirmMessage={`Approve ${seller.shop_name} as a verified DukaSafe seller?`}>Approve Seller</ConfirmSubmitButton>
                  </form>
                  <form action={requestMoreInfoAction} className="grid gap-2">
                    <input type="hidden" name="seller_id" value={seller.id} />
                    <Input label="More info request" name="reason" placeholder="Example: upload clearer ID and confirm Till number" />
                    <ConfirmSubmitButton variant="secondary" confirmMessage={`Request more information from ${seller.shop_name}?`}>Request More Info</ConfirmSubmitButton>
                  </form>
                  <form action={rejectSellerAction} className="grid gap-2 border-t border-forest/10 pt-3">
                    <input type="hidden" name="seller_id" value={seller.id} />
                    <Input label="Rejection reason" name="reason" placeholder="Use only for ineligible or unsafe shops" />
                    <ConfirmSubmitButton variant="danger" confirmMessage={`Reject ${seller.shop_name}? This should be used only for ineligible or unsafe shops.`}>Reject Application</ConfirmSubmitButton>
                  </form>
                </div>
              </div>
            </Card>
          ))}
        </section>
        <Card>
          <h2 className="text-2xl font-black text-forest">Recently reviewed sellers</h2>
          <p className="mt-2 text-sm text-charcoal/65">Approved, rejected, and needs-more-info applications stay visible here so the queue is not a blind empty state.</p>
          <div className="mt-4">
            <DataTable
              headers={["Seller", "Status", "Reviewer action", "Reviewed at"]}
              rows={recentlyReviewed.map((seller: { id: string; shop_name: string; verification_status?: string; approved_at?: string | null; rejected_at?: string | null; updated_at?: string | null }) => [
                seller.shop_name,
                <StatusBadge key={`${seller.id}-status`} status={seller.verification_status} />,
                auditLogs.find((log: { entity_id?: string; action?: string }) => log.entity_id === seller.id)?.action || "Status updated",
                seller.approved_at || seller.rejected_at || seller.updated_at ? new Date(String(seller.approved_at || seller.rejected_at || seller.updated_at)).toLocaleString() : "Not recorded"
              ])}
              empty={<EmptyState title="No reviewed sellers yet" body="Approved, rejected, and needs-more-info seller actions will appear here after admin review." />}
            />
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}

function Signal({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/75 p-3">
      <p className="text-xs font-bold uppercase text-sage">{label}</p>
      <p className="mt-1 text-sm font-black text-forest">{value}</p>
    </div>
  );
}

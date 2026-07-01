import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookOpen, ExternalLink, ShieldCheck } from "lucide-react";
import { getAdminAuditLogs, getAdminPolicyDocuments, getCurrentUserAndProfile } from "@/lib/data";
import { AdminShell } from "@/components/shells";
import { Badge, Card, DataTable, EmptyState, LinkButton, MetricCard, StatusBadge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Admin Policy Charter",
  description: "Review DukaSafe policy documents and public protection charter status."
};
export const dynamic = "force-dynamic";

export default async function AdminPolicyPage() {
  const { profile } = await getCurrentUserAndProfile();
  if (!profile) redirect("/login?next=/admin/policy");
  if (!["admin", "operations"].includes(profile.role)) redirect("/unauthorized");
  const [documents, auditLogs] = await Promise.all([getAdminPolicyDocuments(), getAdminAuditLogs("policy_documents")]);
  const published = documents.filter((doc: { is_published?: boolean }) => doc.is_published).length;

  return (
    <AdminShell>
      <div className="space-y-5">
        <Card>
          <Badge tone="gold"><ShieldCheck className="h-3.5 w-3.5" /> Policy Charter</Badge>
          <h1 className="mt-3 text-4xl font-black text-forest">Policy documents</h1>
          <p className="mt-2 text-charcoal/70">Review published protection rules and policy versions. Public buyers and sellers still use the Protection Charter page.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <LinkButton href="/protection-charter" variant="secondary"><ExternalLink className="h-4 w-4" /> View public charter</LinkButton>
            <LinkButton href="/dispute-charter" variant="secondary">View dispute charter</LinkButton>
          </div>
        </Card>
        <section className="grid gap-4 sm:grid-cols-3">
          <MetricCard label="Policy documents" value={documents.length} icon={<BookOpen className="h-5 w-5" />} />
          <MetricCard label="Published" value={published} icon={<ShieldCheck className="h-5 w-5" />} />
          <MetricCard label="Audit entries" value={auditLogs.length} />
        </section>
        <Card>
          <DataTable
            headers={["Document", "Slug", "Version", "Status", "Updated"]}
            rows={documents.map((doc: { id: string; title: string; slug: string; version: string; is_published: boolean; updated_at?: string; published_at?: string }) => [
              <span key={`${doc.id}-title`} className="font-black text-forest">{doc.title}</span>,
              doc.slug,
              doc.version,
              <StatusBadge key={`${doc.id}-status`} status={doc.is_published ? "published" : "draft"} />,
              doc.updated_at ? new Date(doc.updated_at).toLocaleString() : doc.published_at ? new Date(doc.published_at).toLocaleString() : "Not recorded"
            ])}
            empty={<EmptyState title="No policy documents found" body="Published static charter content will still render, but admin policy management should be configured before production launch." />}
          />
        </Card>
        <Card>
          <h2 className="text-2xl font-black text-forest">Policy audit trail</h2>
          <div className="mt-4">
            <DataTable
              headers={["Action", "Notes", "Created"]}
              rows={auditLogs.slice(0, 10).map((log: { id: string; action: string; notes?: string | null; created_at?: string }) => [
                log.action,
                log.notes || "No notes",
                log.created_at ? new Date(log.created_at).toLocaleString() : "Not recorded"
              ])}
              empty={<EmptyState title="No policy audit entries" body="Policy edits and publish actions will appear here once operations begins editing policy documents." />}
            />
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}

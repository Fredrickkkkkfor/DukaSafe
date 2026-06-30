import type { Metadata } from "next";
import { AlertTriangle, Search, ShieldCheck } from "lucide-react";
import { searchSellers } from "@/lib/data";
import { ActionPanel, Badge, Card, EmptyState, LinkButton, TrustBadge } from "@/components/ui";
import { BuyerMobileNav, PageShell, PublicHeader } from "@/components/shells";

export const metadata: Metadata = { title: "Check a Seller", description: "Verify a TikTok, WhatsApp, Instagram, or DukaSafe seller before paying." };

export default async function CheckSellerPage({ searchParams }: { searchParams: Promise<{ q?: string; reported?: string }> }) {
  const query = await searchParams;
  const sellers = query.q ? await searchSellers(query.q) : [];
  return (
    <>
      <PublicHeader />
      <PageShell className="space-y-6">
        <section className="grid gap-5 lg:grid-cols-[1fr_0.55fr]">
          <Card>
            <Badge tone="gold"><ShieldCheck className="h-3.5 w-3.5" /> Buyer Protection Always On</Badge>
            <h1 className="mt-5 text-4xl font-black text-forest sm:text-6xl">Check before you pay.</h1>
            <p className="mt-3 max-w-2xl text-charcoal/70">Paste a seller&apos;s TikTok, Instagram, WhatsApp number, or DukaSafe link to see their verification status.</p>
            <form className="mt-6 flex flex-col gap-3 rounded-[26px] bg-white/75 p-3 ring-1 ring-forest/10 sm:flex-row" action="/check">
              <input name="q" defaultValue={query.q || ""} className="focus-ring min-h-14 flex-1 rounded-2xl border-0 bg-transparent px-4 text-base" placeholder="Paste seller link, username, or phone number..." />
              <button className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-forest px-5 font-bold text-white"><Search className="h-4 w-4" /> Check Seller</button>
            </form>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-sage">
              {["tiktok.com/@aisha.styles", "instagram.com/aishastyles.nrb", "+254712345678", "dukasafe.co.ke/s/aisha-styles-nairobi"].map((example) => <span key={example} className="rounded-full bg-sand px-3 py-2">{example}</span>)}
            </div>
          </Card>
          <Card className="flex flex-col justify-center bg-forest text-white">
            <AlertTriangle className="h-10 w-10 text-amber" />
            <h2 className="mt-4 text-2xl font-black">Never send money directly to a number.</h2>
            <p className="mt-3 text-sm leading-6 text-white/75">If the seller cannot provide a verified checkout link, use DukaSafe to record terms, proof, and dispute evidence.</p>
          </Card>
        </section>

        {query.reported && <Card className="border-emerald-200 bg-emerald-50"><p className="font-bold text-forest">Thanks. Your seller concern has been recorded for operations review.</p></Card>}

        <section className="grid gap-4">
          {query.q && !sellers.length && (
            <EmptyState title="Seller not found" body="This does not automatically mean they are unsafe, but they are not verified here. Do not pay directly if they cannot provide a protected checkout link." action={<div className="flex flex-col justify-center gap-2 sm:flex-row"><LinkButton href={`/report-concern?seller=${encodeURIComponent(query.q)}`} variant="secondary">Report concern</LinkButton><LinkButton href="/protection-charter" variant="secondary">Read buyer safety rules</LinkButton></div>} />
          )}
          {sellers.map((seller) => (
            <Card key={seller.id} className="grid gap-5 md:grid-cols-[1fr_14rem]">
              <div>
                <TrustBadge score={seller.trust_score} badge={seller.trust_badge} />
                <h2 className="mt-3 text-3xl font-black text-forest">{seller.shop_name}</h2>
                <p className="mt-1 text-sm font-semibold text-sage">{seller.category} - {seller.location_city}{seller.location_area ? `, ${seller.location_area}` : ""}</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <Metric label="Trust score" value={`${Math.round(Number(seller.trust_score || 0))}/100`} />
                  <Metric label="Completed orders" value={seller.completed_orders_count || 0} />
                  <Metric label="Rating" value={`${seller.rating_average || 0}/5`} />
                </div>
              </div>
              <div className="flex flex-col justify-between rounded-3xl bg-sand p-4">
                <div>
                  <p className="text-sm font-black text-forest">Verification status</p>
                  <p className="mt-2 text-sm text-charcoal/70">{seller.seller_status === "suspended" ? "This seller is currently suspended on DukaSafe." : seller.verified ? "This seller has passed DukaSafe verification checks. Always use their protected checkout link before paying." : "This seller has applied but is not yet fully verified. Do not send money directly."}</p>
                </div>
                {seller.seller_status === "suspended" ? (
                  <LinkButton href={`/report-concern?seller=${encodeURIComponent(seller.shop_name)}`} variant="danger" className="mt-4 w-full">Report Concern</LinkButton>
                ) : (
                  <LinkButton href={`/s/${seller.slug}`} className="mt-4 w-full">View Seller Profile</LinkButton>
                )}
              </div>
            </Card>
          ))}
          {sellers.some((seller) => !seller.verified && seller.seller_status !== "suspended") && (
            <ActionPanel title="Buyer safety first" body="If a seller is under review, ask them to complete verification and use a protected checkout link before sending money." tone="gold" />
          )}
        </section>
      </PageShell>
      <BuyerMobileNav />
    </>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-2xl bg-white/75 p-4"><p className="text-xs font-bold uppercase text-sage">{label}</p><p className="mt-1 text-xl font-black text-forest">{value}</p></div>;
}

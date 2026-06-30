import type { Metadata } from "next";
import { ArrowRight, BadgeCheck, Clock3, CreditCard, MessageCircle, ShieldCheck, ShoppingBag, Star, UsersRound } from "lucide-react";
import { Badge, Card, LinkButton, MetricCard, StickyMobileCTA, TrustBadge } from "@/components/ui";
import { PageShell, PublicHeader } from "@/components/shells";
import { demoSeller } from "@/lib/demo";

export const metadata: Metadata = {
  title: "Buy safely. Sell confidently.",
  description: "DukaSafe is verified checkout and buyer-seller protection for Kenyan TikTok, WhatsApp, and Instagram sellers."
};

export default function LandingPage() {
  return (
    <>
      <PublicHeader />
      <PageShell className="space-y-16">
        <section className="grid items-center gap-8 py-6 lg:grid-cols-[1fr_0.95fr]">
          <div>
            <Badge tone="gold"><ShieldCheck className="h-3.5 w-3.5" /> Verified Commerce. Protected by Design.</Badge>
            <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[1.02] text-forest sm:text-6xl lg:text-7xl">Buy safely. Sell confidently.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-charcoal/75">
              DukaSafe gives Kenyan TikTok, WhatsApp, and Instagram sellers a verified checkout link, while buyers get recorded order terms, M-PESA proof, delivery evidence, and structured dispute support.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/seller/register"><ShieldCheck className="h-4 w-4" /> Verify My Shop</LinkButton>
              <LinkButton href="/check" variant="secondary"><ArrowRight className="h-4 w-4" /> Check a Seller</LinkButton>
            </div>
          </div>
          <Card className="relative overflow-hidden p-4 sm:p-6">
            <div className="absolute right-8 top-8 h-28 w-28 rounded-full bg-amber/20 blur-2xl" />
            <div className="rounded-[26px] bg-forest p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase text-white/60">Protected seller</p>
                  <h2 className="mt-1 text-2xl font-black">Aisha Styles Nairobi</h2>
                </div>
                <TrustBadge score={87} badge="Trusted Seller" />
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {["Identity verified", "M-PESA linked", "Delivery history"].map((item) => <div key={item} className="rounded-2xl bg-white/10 p-3 text-sm font-bold">{item}</div>)}
              </div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-[0.8fr_1fr]">
              <Card className="rounded-3xl bg-white/80">
                <p className="text-sm font-bold text-sage">Trust Score</p>
                <p className="mt-2 text-6xl font-black text-forest">87</p>
                <p className="text-sm font-bold text-sage">High Trust</p>
              </Card>
              <Card className="rounded-3xl bg-white/80">
                <p className="text-sm font-bold text-sage">Protected checkout</p>
                <h3 className="mt-2 text-xl font-black text-forest">White tulle set</h3>
                <p className="mt-1 text-2xl font-black">KSh 1,800</p>
                <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[11px] font-bold text-sage">
                  {["Order", "Proof", "Dispatch", "Delivery"].map((step) => <span key={step} className="rounded-xl bg-sand px-2 py-2">{step}</span>)}
                </div>
              </Card>
            </div>
          </Card>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Verified sellers" value="20+" icon={<UsersRound className="h-5 w-5" />} />
          <MetricCard label="Protected orders" value="200+" icon={<ShoppingBag className="h-5 w-5" />} />
          <MetricCard label="Dispute target" value="<72hr" icon={<Clock3 className="h-5 w-5" />} />
          <MetricCard label="Payment proof" value="M-PESA" icon={<CreditCard className="h-5 w-5" />} />
        </section>

        <section id="how" className="grid gap-5 lg:grid-cols-2">
          <HowCard title="For buyers" steps={["Check seller trust status", "Use protected checkout", "Upload M-PESA proof", "Track delivery or dispute"]} />
          <HowCard title="For sellers" steps={["Verify shop identity", "Create product link", "Dispatch with proof", "Build trust history"]} />
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            ["Seller Verification", "We verify identity, shop proof, and linked social accounts so buyers know who they are paying."],
            ["Order Protection", "Order terms, payment proof, and delivery proof are captured from start to finish."],
            ["Dispute Support", "Evidence-based case review protects buyers and genuine sellers from unfair outcomes."]
          ].map(([title, body]) => (
            <Card key={title}>
              <ShieldCheck className="h-8 w-8 text-amber" />
              <h3 className="mt-4 text-xl font-black text-forest">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-charcoal/70">{body}</p>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {["Before DukaSafe, buyers kept asking if my shop was real. Now my verified page closes sales faster.", "Protected checkout gave my customers confidence, and I spend less time explaining payments.", "The trust badge helped me stand out on TikTok and reduced fake-order stress."].map((quote, i) => (
            <Card key={quote}>
              <div className="flex gap-1 text-amber">{Array.from({ length: 5 }).map((_, j) => <Star key={j} className="h-4 w-4 fill-current" />)}</div>
              <p className="mt-4 text-sm leading-6 text-charcoal/75">&ldquo;{quote}&rdquo;</p>
              <p className="mt-4 font-black text-forest">{i === 0 ? "Aisha N." : i === 1 ? "Brian M." : "Mercy W."}</p>
              <p className="text-xs text-sage">{i === 0 ? demoSeller.category : "Kenyan social seller"}</p>
            </Card>
          ))}
        </section>
      </PageShell>
      <StickyMobileCTA>
        <LinkButton href="/check" className="flex-1">Check Seller</LinkButton>
        <LinkButton href="/seller/register" variant="secondary" className="flex-1">Verify Shop</LinkButton>
      </StickyMobileCTA>
      <Footer />
    </>
  );
}

function HowCard({ title, steps }: { title: string; steps: string[] }) {
  return (
    <Card>
      <h2 className="text-2xl font-black text-forest">{title}</h2>
      <div className="mt-5 grid gap-3">
        {steps.map((step, i) => (
          <div key={step} className="flex items-center gap-3 rounded-2xl bg-white/70 p-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-forest text-sm font-black text-white">{i + 1}</span>
            <p className="font-bold text-charcoal">{step}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Footer() {
  return (
    <footer className="border-t border-forest/10 bg-ivory/80 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <p className="text-2xl font-black text-forest">DukaSafe</p>
          <p className="mt-2 max-w-sm text-sm text-charcoal/65">Building trust in every order. Built for safer social commerce in Kenya.</p>
        </div>
        <FooterLinks title="Product" links={[["How It Works", "/#how"], ["Check a Seller", "/check"], ["Verify My Shop", "/seller/register"]]} />
        <FooterLinks title="Trust" links={[["Dispute Charter", "/protection-charter"], ["Buyer Protection", "/protection-charter"], ["Seller Guidelines", "/protection-charter"]]} />
        <FooterLinks title="Contact" links={[["+254 700 123 456", "#"], ["hello@dukasafe.co.ke", "#"], ["Nairobi, Kenya", "#"]]} />
      </div>
    </footer>
  );
}

function FooterLinks({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <div>
      <p className="font-black text-forest">{title}</p>
      <div className="mt-3 grid gap-2 text-sm text-charcoal/65">{links.map(([label, href]) => <LinkButton key={label} href={href} variant="ghost" className="min-h-0 justify-start px-0 py-1 shadow-none">{label}</LinkButton>)}</div>
    </div>
  );
}

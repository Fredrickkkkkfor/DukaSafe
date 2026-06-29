import Link from "next/link";
import { LayoutDashboard, PackagePlus, Search, ShieldCheck, UserRoundCheck } from "lucide-react";
import { Logo, LinkButton, cn } from "@/components/ui";
import { getCurrentUserAndProfile } from "@/lib/data";

export async function PublicHeader() {
  const { user, profile } = await getCurrentUserAndProfile();
  return (
    <header className="sticky top-0 z-40 border-b border-forest/10 bg-ivory/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm font-bold text-forest md:flex">
          <Link href="/check">Check a Seller</Link>
          <Link href="/#how">How It Works</Link>
          <Link href="/protection-charter">Buyer Protection</Link>
          <Link href="/seller/register">Verify My Shop</Link>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <LinkButton href={profile?.role === "admin" || profile?.role === "operations" ? "/admin/verification" : profile?.role === "seller" ? "/seller/dashboard" : "/check"} className="hidden sm:inline-flex">
              Dashboard
            </LinkButton>
          ) : (
            <>
              <LinkButton href="/login" variant="ghost" className="hidden sm:inline-flex">Login</LinkButton>
              <LinkButton href="/signup">Start</LinkButton>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function PageShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <main className={cn("mx-auto min-h-screen w-full max-w-7xl px-4 py-6 pb-24 sm:px-6 lg:px-8", className)}>{children}</main>;
}

export async function SellerShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <PublicHeader />
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[16rem_1fr] lg:px-8">
        <aside className="hidden rounded-[28px] bg-forest p-4 text-white shadow-glass lg:block">
          <Logo compact />
          <nav className="mt-8 space-y-2 text-sm font-bold">
            <SideLink href="/seller/dashboard" icon={<LayoutDashboard className="h-4 w-4" />}>Dashboard</SideLink>
            <SideLink href="/seller/create-link" icon={<PackagePlus className="h-4 w-4" />}>Create Link</SideLink>
            <SideLink href="/seller/register" icon={<UserRoundCheck className="h-4 w-4" />}>Verification</SideLink>
          </nav>
        </aside>
        <main className="min-w-0 pb-24">{children}</main>
      </div>
      <MobileNav items={[
        { href: "/seller/dashboard", label: "Home", icon: <LayoutDashboard className="h-5 w-5" /> },
        { href: "/seller/create-link", label: "Link", icon: <PackagePlus className="h-5 w-5" /> },
        { href: "/check", label: "Check", icon: <Search className="h-5 w-5" /> }
      ]} />
    </div>
  );
}

export async function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <PublicHeader />
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[17rem_1fr] lg:px-8">
        <aside className="hidden rounded-[28px] bg-forest p-4 text-white shadow-glass lg:block">
          <Logo compact />
          <p className="mt-6 rounded-2xl bg-white/10 p-3 text-xs text-white/75">Operations dashboard for verification, disputes, and transaction oversight.</p>
          <nav className="mt-6 space-y-2 text-sm font-bold">
            <SideLink href="/admin/verification" icon={<UserRoundCheck className="h-4 w-4" />}>Verification Queue</SideLink>
            <SideLink href="/admin/orders" icon={<LayoutDashboard className="h-4 w-4" />}>Orders & Transactions</SideLink>
            <SideLink href="/protection-charter" icon={<ShieldCheck className="h-4 w-4" />}>Policy</SideLink>
          </nav>
        </aside>
        <main className="min-w-0 pb-24">{children}</main>
      </div>
      <MobileNav items={[
        { href: "/admin/verification", label: "Verify", icon: <UserRoundCheck className="h-5 w-5" /> },
        { href: "/admin/orders", label: "Orders", icon: <LayoutDashboard className="h-5 w-5" /> },
        { href: "/check", label: "Check", icon: <Search className="h-5 w-5" /> }
      ]} />
    </div>
  );
}

function SideLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <Link href={href} className="flex items-center gap-3 rounded-2xl px-3 py-3 text-white/85 hover:bg-white/10 hover:text-white">{icon}{children}</Link>;
}

export function MobileNav({ items }: { items: Array<{ href: string; label: string; icon: React.ReactNode }> }) {
  return (
    <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-3 rounded-[26px] border border-white/70 bg-ivory/90 p-2 shadow-glass backdrop-blur-xl lg:hidden">
      {items.map((item) => (
        <Link key={item.href} href={item.href} className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-black text-forest hover:bg-forest/5">
          {item.icon}
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

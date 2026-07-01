import Link from "next/link";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatStatusLabel, trustBadgeLabel } from "@/lib/domain";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-forest text-sm font-black text-amber shadow-soft">DS</span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-lg font-black tracking-wide text-forest">DukaSafe</span>
          <span className="block text-xs font-medium text-sage">Verified Commerce. Protected by Design.</span>
        </span>
      )}
    </Link>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: never;
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

type LinkButtonProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

const buttonBase =
  "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font800 font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60";

const variants = {
  primary: "bg-forest text-white shadow-soft hover:bg-[#12322b]",
  secondary: "border border-forest/15 bg-white/80 text-forest hover:bg-white",
  ghost: "text-forest hover:bg-forest/5",
  danger: "bg-red-600 text-white hover:bg-red-700"
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return <button className={cn(buttonBase, variants[variant], className)} {...props} />;
}

export function LinkButton({ className, variant = "primary", href, ...props }: LinkButtonProps) {
  return <Link href={href} className={cn(buttonBase, variants[variant], className)} {...props} />;
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cn("glass rounded-[28px] p-5 sm:p-6", className)}>{children}</section>;
}

export function Badge({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "gold" | "sand" | "red" | "gray" }) {
  const tones = {
    green: "bg-emerald-50 text-forest ring-emerald-200",
    gold: "bg-amber/15 text-[#8a5a24] ring-amber/30",
    sand: "bg-sand text-forest ring-forest/10",
    red: "bg-red-50 text-red-700 ring-red-200",
    gray: "bg-zinc-100 text-zinc-700 ring-zinc-200"
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ring-1", tones[tone])}>{children}</span>;
}

export function TrustBadge({ score = 0, badge }: { score?: number | string | null; badge?: string | null }) {
  const numeric = Number(score ?? 0);
  const label = trustBadgeLabel(numeric, badge);
  return (
    <Badge tone={numeric >= 90 ? "gold" : numeric >= 70 ? "green" : "sand"}>
      <ShieldCheck className="h-3.5 w-3.5" /> {label}
    </Badge>
  );
}

export function StatusBadge({ status }: { status?: string | null }) {
  const safe = formatStatus(status);
  const tone = status?.includes("reject") || status?.includes("failed") || status?.includes("cancel") ? "red" : status?.includes("pending") || status?.includes("review") ? "gold" : "green";
  return <Badge tone={tone}>{safe}</Badge>;
}

export function formatStatus(status?: string | null) {
  return formatStatusLabel(status);
}

export function ActionPanel({ title, body, action, tone = "sand" }: { title: string; body: string; action?: React.ReactNode; tone?: "sand" | "green" | "red" | "gold" }) {
  const tones = {
    sand: "bg-sand text-forest",
    green: "bg-emerald-50 text-forest",
    red: "bg-red-50 text-red-800",
    gold: "bg-amber/15 text-forest"
  };
  return (
    <div className={cn("rounded-3xl p-4", tones[tone])}>
      <p className="font-black">{title}</p>
      <p className="mt-2 text-sm leading-6 opacity-80">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function StickyMobileCTA({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-forest/10 bg-ivory/92 p-3 shadow-glass backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-md gap-2">{children}</div>
    </div>
  );
}

export function MetricCard({ label, value, hint, icon }: { label: string; value: React.ReactNode; hint?: string; icon?: React.ReactNode }) {
  return (
    <Card className="rounded-3xl p-4">
      <div className="flex items-center gap-3">
        {icon && <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-forest/8 text-forest">{icon}</div>}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sage">{label}</p>
          <p className="mt-1 text-2xl font-black text-forest">{value}</p>
          {hint && <p className="mt-1 text-xs text-charcoal/60">{hint}</p>}
        </div>
      </div>
    </Card>
  );
}

export function Stepper({ steps, active }: { steps: string[]; active: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(7rem,1fr))]">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center gap-3 rounded-2xl bg-white/70 p-3 ring-1 ring-forest/10">
          <span className={cn("grid h-8 w-8 place-items-center rounded-full text-xs font-black", index <= active ? "bg-forest text-white" : "bg-sand text-sage")}>
            {index < active ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
          </span>
          <span className="text-sm font-semibold text-forest">{step}</span>
        </div>
      ))}
    </div>
  );
}

export function Timeline({ events }: { events: Array<{ title?: string | null; notes?: string | null; created_at?: string | null; new_status?: string | null }> }) {
  if (!events.length) return <EmptyState title="No timeline yet" body="Status updates and evidence will appear here as the order moves forward." />;
  return (
    <ol className="space-y-4">
      {events.map((event, index) => (
        <li key={`${event.title}-${index}`} className="relative pl-9">
          <span className="absolute left-0 top-1 grid h-6 w-6 place-items-center rounded-full bg-forest text-white ring-4 ring-sand">
            <span className="h-2 w-2 rounded-full bg-amber" />
          </span>
          <p className="font-bold text-forest">{event.title || formatStatus(event.new_status) || "Status update"}</p>
          {event.notes && <p className="mt-1 text-sm text-charcoal/70">{event.notes}</p>}
          {event.created_at && <p className="mt-1 text-xs text-sage">{new Date(event.created_at).toLocaleString()}</p>}
        </li>
      ))}
    </ol>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-forest/20 bg-white/60 p-6 text-center">
      <p className="text-lg font-black text-forest">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-charcoal/65">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Input({ label, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-forest">{label}</span>
      <input className={cn("focus-ring min-h-12 w-full rounded-2xl border border-forest/10 bg-white/85 px-4 text-sm text-charcoal shadow-sm", className)} {...props} />
    </label>
  );
}

export function Textarea({ label, className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-forest">{label}</span>
      <textarea className={cn("focus-ring min-h-28 w-full rounded-2xl border border-forest/10 bg-white/85 px-4 py-3 text-sm text-charcoal shadow-sm", className)} {...props} />
    </label>
  );
}

export function Select({ label, children, className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-forest">{label}</span>
      <select className={cn("focus-ring min-h-12 w-full rounded-2xl border border-forest/10 bg-white/85 px-4 text-sm text-charcoal shadow-sm", className)} {...props}>
        {children}
      </select>
    </label>
  );
}

export function DataTable({ headers, rows, empty }: { headers: string[]; rows: React.ReactNode[][]; empty: React.ReactNode }) {
  if (!rows.length) return <>{empty}</>;
  return (
    <div className="overflow-hidden rounded-3xl border border-forest/10 bg-white/75">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand/80 text-xs uppercase text-sage">
            <tr>{headers.map((header) => <th key={header} className="px-4 py-3 font-black">{header}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-forest/10">{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} className="px-4 py-4 align-top">{cell}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <div className="divide-y divide-forest/10 md:hidden">
        {rows.map((row, i) => (
          <div key={i} className="space-y-2 p-4">
            {row.map((cell, j) => (
              <div key={j} className="flex items-start justify-between gap-3 text-sm">
                <span className="font-bold text-sage">{headers[j]}</span>
                <span className="text-right text-charcoal">{cell}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

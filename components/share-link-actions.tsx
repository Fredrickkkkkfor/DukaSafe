"use client";

import { useMemo, useState } from "react";
import { Check, Copy, ExternalLink, MessageCircle } from "lucide-react";
import { LinkButton, cn } from "@/components/ui";

export function ShareLinkActions({ path, baseUrl }: { path: string; baseUrl?: string }) {
  const [copied, setCopied] = useState(false);
  const absoluteUrl = useMemo(() => {
    return baseUrl ? new URL(path, baseUrl).toString() : path;
  }, [baseUrl, path]);

  async function copyLink() {
    await navigator.clipboard.writeText(absoluteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-3">
      <button
        type="button"
        onClick={copyLink}
        className={cn(
          "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-forest/15 bg-white/80 px-4 py-3 text-sm font-bold text-forest hover:bg-white"
        )}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied" : "Copy"}
      </button>
      <LinkButton href={path} variant="secondary">
        <ExternalLink className="h-4 w-4" /> Open
      </LinkButton>
      <a
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-forest px-4 py-3 text-sm font-bold text-white"
        href={`https://wa.me/?text=${encodeURIComponent(`Shop safely with DukaSafe: ${absoluteUrl}`)}`}
      >
        <MessageCircle className="h-4 w-4" /> WhatsApp
      </a>
    </div>
  );
}

import { ExternalLink } from "lucide-react";
import { createSignedEvidenceUrl } from "@/lib/storage";

export async function SecureEvidenceLink({
  bucket,
  path,
  label = "Open signed preview"
}: {
  bucket: string;
  path?: string | null;
  label?: string;
}) {
  const signedUrl = await createSignedEvidenceUrl(bucket, path);

  if (!signedUrl) {
    return <span className="text-xs font-bold text-charcoal/50">Signed preview unavailable</span>;
  }

  return (
    <a
      href={signedUrl}
      target="_blank"
      rel="noreferrer"
      className="mt-2 inline-flex items-center gap-1 text-xs font-black text-forest underline underline-offset-4"
    >
      <ExternalLink className="h-3.5 w-3.5" />
      {label}
    </a>
  );
}

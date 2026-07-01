import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SIGNED_EVIDENCE_URL_SECONDS = 5 * 60;

export async function createSignedEvidenceUrl(bucket: string, path?: string | null) {
  if (!isSupabaseConfigured || !path) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_EVIDENCE_URL_SECONDS);

  if (error) return null;
  return data.signedUrl;
}

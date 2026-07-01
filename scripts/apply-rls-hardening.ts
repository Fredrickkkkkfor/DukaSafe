import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadLocalEnv, requireSecret } from "./supabase-admin";

async function main() {
  loadLocalEnv();
  const projectUrl = new URL(requireSecret("NEXT_PUBLIC_SUPABASE_URL"));
  const projectRef = projectUrl.hostname.split(".")[0];
  const accessToken = requireSecret("SUPABASE_ACCESS_TOKEN");
  const query = readFileSync(resolve(process.cwd(), "supabase_rls_hardening.sql"), "utf8");

  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase SQL hardening failed with HTTP ${response.status}: ${body}`);
  }

  console.log(JSON.stringify({
    projectRef,
    applied: true,
    file: "supabase_rls_hardening.sql",
    note: "No secrets were printed."
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : JSON.stringify(error, null, 2));
  process.exitCode = 1;
});

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

export const testEmails = {
  buyer: process.env.TEST_BUYER_EMAIL || "buyer.test@dukasafe.local",
  seller: process.env.TEST_SELLER_EMAIL || "seller.test@dukasafe.local",
  admin: process.env.TEST_ADMIN_EMAIL || "admin.test@dukasafe.local"
};

export function loadLocalEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  const body = readFileSync(envPath, "utf8").replace(/^\uFEFF/, "");
  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index <= 0) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

export function requireSecret(name: string) {
  const value = process.env[name]?.trim();
  if (!value || value.includes("_here") || value.includes("Use-A-Strong-Test-Password-Here")) {
    throw new Error(`Missing required local-only environment variable: ${name}`);
  }
  return value;
}

export function serviceClient() {
  loadLocalEnv();
  const url = requireSecret("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireSecret("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export function anonClient() {
  loadLocalEnv();
  const url = requireSecret("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = requireSecret("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function findAuthUserIdByEmail(email: string) {
  const supabase = serviceClient();
  let page = 1;
  while (page < 20) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const match = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (match) return match.id;
    if (data.users.length < 100) return null;
    page += 1;
  }
  return null;
}

export function assertTestEmail(email: string) {
  if (!email.toLowerCase().includes("test") && !email.toLowerCase().includes("qa")) {
    throw new Error(`Refusing to operate on non-test email: ${email}`);
  }
}

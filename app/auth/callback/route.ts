import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleHome } from "@/lib/data";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const supabase = await createSupabaseServerClient();

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login?error=Could not complete secure sign in", request.url));
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  const target = next || await getRoleHome(profile, user.id);
  return NextResponse.redirect(new URL(target, request.url));
}

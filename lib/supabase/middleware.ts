import { createServerClient, type SupabaseClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/env";
import type { User } from "@supabase/supabase-js";

export type SessionUpdateResult = {
  supabase: SupabaseClient | null;
  supabaseResponse: NextResponse;
  user: User | null;
  configured: boolean;
};

export async function updateSession(
  request: NextRequest
): Promise<SessionUpdateResult> {
  const supabaseResponse = NextResponse.next({ request });

  if (!isSupabaseConfigured()) {
    return {
      supabase: null,
      supabaseResponse,
      user: null,
      configured: false,
    };
  }

  const { url, anonKey } = getSupabaseEnv();
  let response = supabaseResponse;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    supabase,
    supabaseResponse: response,
    user: user ?? null,
    configured: true,
  };
}

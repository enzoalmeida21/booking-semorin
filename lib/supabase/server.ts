import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/env";

export async function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase não configurado. Crie o arquivo .env.local — veja /configuracao."
    );
  }
  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component — ignore
        }
      },
    },
  });
}

export { isSupabaseConfigured };

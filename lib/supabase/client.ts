import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/env";

export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase não configurado. Crie o arquivo .env.local — veja /configuracao."
    );
  }
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient(url, anonKey);
}

export function isClientConfigured() {
  return isSupabaseConfigured();
}

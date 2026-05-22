import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/env";

export function createAdminClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase não configurado.");
  }
  const { url } = getSupabaseEnv();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || key === "your-service-role-key") {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY ausente em .env.local");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

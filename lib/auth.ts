import { createClient } from "@/lib/supabase/server";
import type { Profile, PromotorStatus, UserRole } from "@/lib/types";
import { isContractExpired } from "@/lib/dates";

export async function getSessionProfile(): Promise<{
  user: { id: string; email?: string } | null;
  profile: Profile | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { user, profile: profile as Profile | null };
}

export async function getActiveContract(promotorId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contratos")
    .select("*")
    .eq("promotor_id", promotorId)
    .eq("ativo", true)
    .order("data_vencimento", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function checkPromotorAccess(profile: Profile): Promise<{
  allowed: boolean;
  redirect?: string;
}> {
  if (profile.role !== "promotor") {
    return { allowed: true };
  }

  if (profile.status === "pendente") {
    return { allowed: false, redirect: "/cadastro/aguardando-aprovacao" };
  }

  if (profile.status === "inativo") {
    return { allowed: false, redirect: "/login?error=conta_inativa" };
  }

  if (profile.status === "contrato_vencido") {
    return { allowed: false, redirect: "/contrato-vencido" };
  }

  if (profile.status === "ativo") {
    const contrato = await getActiveContract(profile.id);
    if (!contrato || isContractExpired(contrato.data_vencimento)) {
      const admin = (await import("@/lib/supabase/admin")).createAdminClient();
      await admin
        .from("profiles")
        .update({ status: "contrato_vencido" })
        .eq("id", profile.id);
      return { allowed: false, redirect: "/contrato-vencido" };
    }
  }

  return { allowed: true };
}

export function roleHomePath(role: UserRole, status?: PromotorStatus | null): string {
  if (role === "admin") return "/admin";
  if (role === "industria") return "/industria/galeria";
  if (role === "promotor") {
    if (status === "pendente") return "/cadastro/aguardando-aprovacao";
    if (status === "contrato_vencido") return "/contrato-vencido";
    return "/promotor/enviar";
  }
  return "/login";
}

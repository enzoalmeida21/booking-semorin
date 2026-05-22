export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .single();

  if (adminProfile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: cadastroLojas } = await admin
    .from("promotor_cadastro_lojas")
    .select("loja_id")
    .eq("promotor_id", id);

  if (cadastroLojas?.length) {
    await admin.from("promotor_lojas").upsert(
      cadastroLojas.map((r) => ({ promotor_id: id, loja_id: r.loja_id })),
      { onConflict: "promotor_id,loja_id" }
    );
  }

  await admin
    .from("profiles")
    .update({ status: "ativo", motivo_rejeicao: null })
    .eq("id", id);

  return NextResponse.json({ success: true });
}

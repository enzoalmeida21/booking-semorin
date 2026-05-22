export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayBrazilDateString } from "@/lib/dates";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json();
  const { loja_id, produto_id, industria_id, estoque_disponivel, content_hash } =
    body;

  if (!loja_id || !produto_id || !industria_id || !estoque_disponivel || !content_hash) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "promotor" || profile?.status !== "ativo") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { data: vinculo } = await supabase
    .from("promotor_lojas")
    .select("loja_id")
    .eq("promotor_id", user.id)
    .eq("loja_id", loja_id)
    .maybeSingle();

  if (!vinculo) {
    return NextResponse.json({ error: "Loja não vinculada." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("fotos")
    .select("id")
    .eq("content_hash", content_hash)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Esta foto já foi enviada.", code: "duplicata" },
      { status: 409 }
    );
  }

  const date = todayBrazilDateString();
  const fileId = crypto.randomUUID();
  const storagePath = `${loja_id}/${date}/${fileId}.jpg`;

  const { data: signed, error: signError } = await admin.storage
    .from("fotos")
    .createSignedUploadUrl(storagePath);

  if (signError || !signed) {
    return NextResponse.json(
      { error: "Erro ao gerar URL de upload." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    signedUrl: signed.signedUrl,
    token: signed.token,
    path: storagePath,
    loja_id,
    produto_id,
    industria_id,
    estoque_disponivel,
    content_hash,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validatePhotoForUpload } from "@/lib/exif";
import { todayBrazilDateString } from "@/lib/dates";
import { sha256FromBuffer } from "@/lib/hash";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const loja_id = String(formData.get("loja_id") ?? "");
    const produto_id = String(formData.get("produto_id") ?? "");
    const industria_id = String(formData.get("industria_id") ?? "");
    const estoque_disponivel = String(formData.get("estoque_disponivel") ?? "");
    const observacoes = formData.get("observacoes") as string | null;
    const captured_at_client = String(formData.get("captured_at_client") ?? "");
    const capture_source = String(formData.get("capture_source") ?? "");

    if (!file || !loja_id || !produto_id || !industria_id || !estoque_disponivel) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }

    if (capture_source !== "in_app_camera" || !captured_at_client) {
      return NextResponse.json(
        { error: "Use o botão Tirar foto no celular." },
        { status: 422 }
      );
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

    const buffer = await file.arrayBuffer();
    const content_hash = await sha256FromBuffer(buffer);

    const admin = createAdminClient();

    const { data: existing } = await admin
      .from("fotos")
      .select("id")
      .eq("content_hash", content_hash)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Esta foto já foi enviada." },
        { status: 409 }
      );
    }

    const validation = await validatePhotoForUpload(buffer, {
      captureSource: "in_app_camera",
      capturedAtClient: captured_at_client,
    });

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error ?? "Foto rejeitada." },
        { status: 422 }
      );
    }

    const date = todayBrazilDateString();
    const storagePath = `${loja_id}/${date}/${crypto.randomUUID()}.jpg`;

    const { error: uploadError } = await admin.storage
      .from("fotos")
      .upload(storagePath, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload:", uploadError);
      return NextResponse.json(
        {
          error:
            uploadError.message.includes("Bucket not found")
              ? "Bucket 'fotos' não existe no Supabase Storage. Crie um bucket privado chamado fotos."
              : `Erro ao salvar imagem: ${uploadError.message}`,
        },
        { status: 500 }
      );
    }

    const { error: insertError } = await admin.from("fotos").insert({
      loja_id,
      promotor_id: user.id,
      produto_id,
      industria_id,
      estoque_disponivel,
      storage_path: storagePath,
      content_hash,
      captured_at: validation.capturedAt!.toISOString(),
      exif_raw: validation.raw ?? null,
      validacao_status: "aprovada",
      observacoes: observacoes || null,
    });

    if (insertError) {
      await admin.storage.from("fotos").remove([storagePath]);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("upload/direct:", e);
    const msg = e instanceof Error ? e.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validatePhotoForUpload, type CaptureSource } from "@/lib/exif";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json();
  const {
    storage_path,
    loja_id,
    produto_id,
    industria_id,
    estoque_disponivel,
    content_hash,
    observacoes,
    capture_source,
    captured_at_client,
  } = body;

  const source = (capture_source ?? "file") as CaptureSource;
  if (source !== "in_app_camera") {
    return NextResponse.json(
      {
        error: "Envie a foto usando o botão Tirar foto no app (câmera integrada).",
      },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  const { data: fileData, error: downloadError } = await admin.storage
    .from("fotos")
    .download(storage_path);

  if (downloadError || !fileData) {
    return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
  }

  const buffer = await fileData.arrayBuffer();
  const exifResult = await validatePhotoForUpload(buffer, {
    captureSource: source,
    capturedAtClient: captured_at_client,
  });

  if (!exifResult.valid) {
    await admin.storage.from("fotos").remove([storage_path]);
    const status = exifResult.error?.includes("hoje")
      ? "rejeitada_data"
      : "rejeitada_exif";
    return NextResponse.json(
      { error: exifResult.error, validacao_status: status },
      { status: 422 }
    );
  }

  const { data: dup } = await admin
    .from("fotos")
    .select("id")
    .eq("content_hash", content_hash)
    .maybeSingle();

  if (dup) {
    await admin.storage.from("fotos").remove([storage_path]);
    return NextResponse.json(
      { error: "Esta foto já foi enviada.", validacao_status: "rejeitada_duplicata" },
      { status: 409 }
    );
  }

  const { error: insertError } = await admin.from("fotos").insert({
    loja_id,
    promotor_id: user.id,
    produto_id,
    industria_id,
    estoque_disponivel,
    storage_path,
    content_hash,
    captured_at: exifResult.capturedAt!.toISOString(),
    exif_raw: exifResult.raw ?? null,
    validacao_status: "aprovada",
    observacoes: observacoes ?? null,
  });

  if (insertError) {
    await admin.storage.from("fotos").remove([storage_path]);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

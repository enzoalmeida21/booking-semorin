export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { addDaysBrazil, formatBrazil } from "@/lib/dates";
import {
  BookDocument,
  type BookLojaSection,
} from "@/lib/pdf/book-document";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, industria_id")
    .eq("id", user.id)
    .single();

  if (
    !profile ||
    (profile.role !== "industria" && profile.role !== "admin")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const industriaId =
    profile.role === "admin"
      ? request.nextUrl.searchParams.get("industria_id")
      : profile.industria_id;

  if (!industriaId) {
    return NextResponse.json({ error: "industria_id required" }, { status: 400 });
  }

  const fromParam = request.nextUrl.searchParams.get("from");
  const toParam = request.nextUrl.searchParams.get("to");
  const defaultRange = addDaysBrazil(7);
  const from = fromParam ?? defaultRange.from;
  const to = toParam ?? defaultRange.to;

  const admin = createAdminClient();

  const { data: industria } = await admin
    .from("industrias")
    .select("nome")
    .eq("id", industriaId)
    .single();

  const { data: fotos } = await admin
    .from("fotos")
    .select(
      `
      *,
      lojas (codigo_identificacao, nome, municipio, uf),
      produtos (nome),
      profiles (nome)
    `
    )
    .eq("industria_id", industriaId)
    .eq("validacao_status", "aprovada")
    .gte("captured_at", `${from}T00:00:00`)
    .lte("captured_at", `${to}T23:59:59`)
    .order("captured_at", { ascending: true });

  if (!fotos?.length) {
    return NextResponse.json({ error: "Nenhuma foto no período." }, { status: 404 });
  }

  const byLoja = new Map<string, BookLojaSection>();

  for (const foto of fotos) {
    const loja = foto.lojas as {
      codigo_identificacao: string;
      nome: string;
      municipio: string;
      uf: string;
    };
    const key = foto.loja_id;
    if (!byLoja.has(key)) {
      byLoja.set(key, {
        codigo: loja.codigo_identificacao,
        nome: loja.nome,
        municipio: loja.municipio,
        uf: loja.uf,
        fotos: [],
      });
    }

    const { data: signed } = await admin.storage
      .from("fotos")
      .createSignedUrl(foto.storage_path, 300);

    if (signed?.signedUrl) {
      byLoja.get(key)!.fotos.push({
        url: signed.signedUrl,
        produto: (foto.produtos as { nome: string })?.nome ?? "",
        estoque: foto.estoque_disponivel,
        captured_at: foto.captured_at,
        promotor: (foto.profiles as { nome: string })?.nome,
      });
    }
  }

  const lojas = Array.from(byLoja.values());
  const periodo = `${formatBrazil(from, "dd/MM/yyyy")} — ${formatBrazil(to, "dd/MM/yyyy")}`;

  const buffer = await renderToBuffer(
    BookDocument({
      industriaNome: industria?.nome ?? "Indústria",
      periodo,
      lojas,
      totalFotos: fotos.length,
    })
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="book-trade-${from}-${to}.pdf"`,
    },
  });
}

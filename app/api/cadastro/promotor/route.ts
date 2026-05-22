export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidCpf, normalizeCpf } from "@/lib/cpf";

const MAX_CONTRACT_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const nome = String(formData.get("nome") ?? "").trim();
    const cpf = normalizeCpf(String(formData.get("cpf") ?? ""));
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const telefone = String(formData.get("telefone") ?? "").trim();
    const uf = String(formData.get("uf") ?? "").trim();
    const municipio = String(formData.get("municipio") ?? "").trim();
    const dataVencimento = String(formData.get("data_vencimento") ?? "");
    const lojaIds = formData.getAll("loja_ids") as string[];
    const contratoFile = formData.get("contrato") as File | null;

    if (!nome || nome.length < 3) {
      return NextResponse.json({ error: "Nome inválido." }, { status: 400 });
    }
    if (!isValidCpf(cpf)) {
      return NextResponse.json({ error: "CPF inválido." }, { status: 400 });
    }
    if (!email || !password || password.length < 6) {
      return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 400 });
    }
    if (!uf || !municipio) {
      return NextResponse.json({ error: "UF e município obrigatórios." }, { status: 400 });
    }
    if (!dataVencimento) {
      return NextResponse.json({ error: "Data de vencimento obrigatória." }, { status: 400 });
    }
    if (lojaIds.length === 0) {
      return NextResponse.json({ error: "Selecione ao menos uma loja." }, { status: 400 });
    }
    if (!contratoFile) {
      return NextResponse.json({ error: "Contrato obrigatório." }, { status: 400 });
    }
    if (contratoFile.size > MAX_CONTRACT_SIZE) {
      return NextResponse.json({ error: "Contrato máximo 10MB." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(contratoFile.type)) {
      return NextResponse.json(
        { error: "Contrato deve ser PDF, JPG ou PNG." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: existingCpf } = await admin
      .from("profiles")
      .select("id")
      .eq("cpf", cpf)
      .maybeSingle();

    if (existingCpf) {
      return NextResponse.json({ error: "CPF já cadastrado." }, { status: 409 });
    }

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome },
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message ?? "Erro ao criar usuário." },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    const ext =
      contratoFile.type === "application/pdf"
        ? "pdf"
        : contratoFile.type.includes("png")
          ? "png"
          : "jpg";
    const storagePath = `contratos/${userId}/${crypto.randomUUID()}.${ext}`;

    const buffer = Buffer.from(await contratoFile.arrayBuffer());
    const { error: uploadError } = await admin.storage
      .from("contratos")
      .upload(storagePath, buffer, {
        contentType: contratoFile.type,
        upsert: false,
      });

    if (uploadError) {
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: "Erro ao enviar contrato. Verifique o bucket 'contratos'." },
        { status: 500 }
      );
    }

    await admin.from("profiles").upsert({
      id: userId,
      role: "promotor",
      nome,
      email,
      cpf,
      telefone,
      municipio,
      uf,
      status: "pendente",
      industria_id: null,
    });

    await admin.from("contratos").insert({
      promotor_id: userId,
      storage_path: storagePath,
      data_vencimento: dataVencimento,
      ativo: true,
    });

    const cadastroLojas = lojaIds.map((loja_id) => ({
      promotor_id: userId,
      loja_id,
    }));
    await admin.from("promotor_cadastro_lojas").insert(cadastroLojas);

    await admin.from("notificacoes_admin").insert({
      tipo: "cadastro_promotor",
      mensagem: `Novo cadastro de promotor: ${nome} (${cpf})`,
      referencia_id: userId,
    });

    return NextResponse.json({ success: true, userId });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

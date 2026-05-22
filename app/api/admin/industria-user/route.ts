import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email, password, nome, industria_id } = await request.json();
  const admin = createAdminClient();

  const { data: authData, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !authData.user) {
    return NextResponse.json({ error: error?.message }, { status: 400 });
  }

  await admin.from("profiles").upsert({
    id: authData.user.id,
    role: "industria",
    nome,
    email,
    industria_id,
    status: null,
    cpf: null,
  });

  return NextResponse.json({ success: true });
}

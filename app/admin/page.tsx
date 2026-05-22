import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function AdminHomePage() {
  const supabase = await createClient();

  const [{ count: pendentes }, { count: notificacoes }] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "promotor")
      .eq("status", "pendente"),
    supabase
      .from("notificacoes_admin")
      .select("*", { count: "exact", head: true })
      .eq("lida", false),
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Painel Admin Mustafa</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cadastros pendentes</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <Badge variant="warning">{pendentes ?? 0}</Badge>
            <Link href="/admin/promotores?status=pendente">
              <Button size="sm">Ver promotores</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fotos trade</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/admin/fotos">
              <Button size="sm">Ver galeria de fotos</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notificações</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge>{notificacoes ?? 0} não lidas</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock } from "lucide-react";

export default function AguardandoAprovacaoPage() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <Clock className="h-12 w-12 mx-auto text-primary mb-2" />
          <CardTitle>Cadastro em análise</CardTitle>
          <CardDescription>
            Sua solicitação foi recebida pela Mustafa. Você receberá acesso ao
            envio de fotos após aprovação do seu cadastro e contrato.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleLogout}>
            Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

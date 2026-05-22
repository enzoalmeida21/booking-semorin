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
import { AlertTriangle } from "lucide-react";

export default function ContratoVencidoPage() {
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
          <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-2" />
          <CardTitle>Contrato vencido</CardTitle>
          <CardDescription>
            Seu contrato com a Mustafa expirou. Entre em contato com a equipe
            Mustafa para renovar e voltar a enviar fotos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            E-mail: contato@mustafa.com.br
          </p>
          <Button variant="outline" onClick={handleLogout}>
            Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

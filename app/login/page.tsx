"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Camera } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    errorParam === "conta_inativa"
      ? "Sua conta está inativa. Entre em contato com a Mustafa."
      : ""
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError) {
      setError("E-mail ou senha inválidos.");
      setLoading(false);
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", data.user.id)
      .single();

    if (profile?.role === "admin") router.push("/admin");
    else if (profile?.role === "industria") router.push("/industria/galeria");
    else if (profile?.status === "pendente")
      router.push("/cadastro/aguardando-aprovacao");
    else if (profile?.status === "contrato_vencido")
      router.push("/contrato-vencido");
    else router.push("/promotor/enviar");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground mb-2">
            <Camera className="h-6 w-6" />
          </div>
          <CardTitle>Book de Fotos</CardTitle>
          <CardDescription>Trade Marketing — Mustafa</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-6">
            É promotor?{" "}
            <Link href="/cadastro/promotor" className="text-primary underline">
              Cadastre-se
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient, isClientConfigured } from "@/lib/supabase/client";
import { isValidCpf, formatCpf, normalizeCpf } from "@/lib/cpf";
import { UFS } from "@/lib/types";
import type { Loja } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CadastroPromotorPage() {
  const router = useRouter();
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedLojas, setSelectedLojas] = useState<string[]>([]);
  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    email: "",
    password: "",
    telefone: "",
    uf: "",
    municipio: "",
    data_vencimento: "",
  });
  const [contrato, setContrato] = useState<File | null>(null);

  const [configured, setConfigured] = useState(isClientConfigured());

  useEffect(() => {
    if (!isClientConfigured()) {
      setConfigured(false);
      return;
    }
    setConfigured(true);
    const supabase = createClient();
    supabase
      .from("lojas")
      .select("*")
      .eq("ativo", true)
      .order("nome")
      .then(({ data }) => setLojas((data as Loja[]) ?? []));
  }, []);

  function toggleLoja(id: string) {
    setSelectedLojas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isValidCpf(form.cpf)) {
      setError("CPF inválido.");
      return;
    }
    if (selectedLojas.length === 0) {
      setError("Selecione ao menos uma loja.");
      return;
    }
    if (!contrato) {
      setError("Envie o contrato.");
      return;
    }

    setLoading(true);
    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => body.append(k, v));
    body.set("cpf", normalizeCpf(form.cpf));
    selectedLojas.forEach((id) => body.append("loja_ids", id));
    body.append("contrato", contrato);

    const res = await fetch("/api/cadastro/promotor", {
      method: "POST",
      body,
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error ?? "Erro no cadastro.");
      return;
    }

    const supabase = createClient();
    await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    router.push("/cadastro/aguardando-aprovacao");
  }

  if (!configured) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md text-center p-6">
          <p className="text-muted-foreground mb-4">
            Supabase não configurado. Configure o ambiente antes do cadastro.
          </p>
          <Link href="/configuracao">
            <Button>Ver instruções</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Cadastro de Promotor</CardTitle>
          <CardDescription>Mustafa Trade Marketing</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nome completo</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>CPF</Label>
              <Input
                value={form.cpf}
                onChange={(e) =>
                  setForm({ ...form, cpf: formatCpf(e.target.value) })
                }
                required
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Senha</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  minLength={6}
                  required
                />
              </div>
            </div>
            <div>
              <Label>Telefone</Label>
              <Input
                value={form.telefone}
                onChange={(e) =>
                  setForm({ ...form, telefone: e.target.value })
                }
                required
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>UF</Label>
                <Select
                  value={form.uf}
                  onChange={(e) => setForm({ ...form, uf: e.target.value })}
                  required
                >
                  <option value="">Selecione</option>
                  {UFS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Município</Label>
                <Input
                  value={form.municipio}
                  onChange={(e) =>
                    setForm({ ...form, municipio: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div>
              <Label>Lojas onde trabalha</Label>
              <div className="border rounded-lg max-h-48 overflow-y-auto p-2 space-y-1 mt-1">
                {lojas.map((loja) => (
                  <label
                    key={loja.id}
                    className="flex items-center gap-2 text-sm p-2 hover:bg-muted rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedLojas.includes(loja.id)}
                      onChange={() => toggleLoja(loja.id)}
                    />
                    <span>
                      {loja.codigo_identificacao} — {loja.nome} ({loja.municipio}
                      /{loja.uf})
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label>Contrato (PDF, JPG ou PNG — máx. 10MB)</Label>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setContrato(e.target.files?.[0] ?? null)}
                required
              />
            </div>
            <div>
              <Label>Data de vencimento do contrato</Label>
              <Input
                type="date"
                value={form.data_vencimento}
                onChange={(e) =>
                  setForm({ ...form, data_vencimento: e.target.value })
                }
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Enviando..." : "Enviar cadastro"}
            </Button>
          </form>
          <p className="text-center text-sm mt-4 text-muted-foreground">
            Já tem conta? <Link href="/login" className="underline">Entrar</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

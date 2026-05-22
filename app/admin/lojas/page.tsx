"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Loja } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UFS } from "@/lib/types";
import { Select } from "@/components/ui/select";

export default function AdminLojasPage() {
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [form, setForm] = useState({
    codigo_identificacao: "",
    nome: "",
    cidade: "",
    municipio: "",
    uf: "SP",
  });

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("lojas").select("*").order("nome");
    setLojas((data as Loja[]) ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    await supabase.from("lojas").insert({ ...form, ativo: true });
    setForm({
      codigo_identificacao: "",
      nome: "",
      cidade: "",
      municipio: "",
      uf: "SP",
    });
    load();
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold">Lojas</h2>
      <Card>
        <CardHeader>
          <CardTitle>Nova loja</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Código identificação</Label>
              <Input
                value={form.codigo_identificacao}
                onChange={(e) =>
                  setForm({ ...form, codigo_identificacao: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label>Nome</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Cidade</Label>
              <Input
                value={form.cidade}
                onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                required
              />
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
            <div>
              <Label>UF</Label>
              <Select
                value={form.uf}
                onChange={(e) => setForm({ ...form, uf: e.target.value })}
              >
                {UFS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit" className="sm:col-span-2">
              Cadastrar loja
            </Button>
          </form>
        </CardContent>
      </Card>
      <ul className="space-y-2">
        {lojas.map((l) => (
          <li key={l.id} className="border rounded-lg p-3 text-sm">
            <strong>{l.codigo_identificacao}</strong> — {l.nome} · {l.municipio}/
            {l.uf}
          </li>
        ))}
      </ul>
    </div>
  );
}

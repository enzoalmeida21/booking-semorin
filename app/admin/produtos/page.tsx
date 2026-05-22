"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Produto, Industria } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [industrias, setIndustrias] = useState<Industria[]>([]);
  const [form, setForm] = useState({
    industria_id: "",
    nome: "",
    sku: "",
    categoria: "",
  });

  async function load() {
    const supabase = createClient();
    const [{ data: p }, { data: i }] = await Promise.all([
      supabase.from("produtos").select("*").order("nome"),
      supabase.from("industrias").select("*"),
    ]);
    setProdutos((p as Produto[]) ?? []);
    setIndustrias((i as Industria[]) ?? []);
    if (i?.[0] && !form.industria_id) {
      setForm((f) => ({ ...f, industria_id: i[0].id }));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    await supabase.from("produtos").insert({ ...form, ativo: true });
    setForm({ industria_id: form.industria_id, nome: "", sku: "", categoria: "" });
    load();
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold">Produtos</h2>
      <Card>
        <CardHeader>
          <CardTitle>Novo produto</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Indústria</Label>
              <Select
                value={form.industria_id}
                onChange={(e) =>
                  setForm({ ...form, industria_id: e.target.value })
                }
              >
                {industrias.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nome}
                  </option>
                ))}
              </Select>
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
              <Label>SKU</Label>
              <Input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
            </div>
            <div>
              <Label>Categoria</Label>
              <Input
                value={form.categoria}
                onChange={(e) =>
                  setForm({ ...form, categoria: e.target.value })
                }
              />
            </div>
            <Button type="submit">Cadastrar</Button>
          </form>
        </CardContent>
      </Card>
      <ul className="space-y-2 text-sm">
        {produtos.map((p) => (
          <li key={p.id} className="border rounded-lg p-3">
            {p.nome} {p.sku && `(${p.sku})`}
          </li>
        ))}
      </ul>
    </div>
  );
}

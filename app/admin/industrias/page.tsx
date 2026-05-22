"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Industria, Loja } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminIndustriasPage() {
  const [industrias, setIndustrias] = useState<Industria[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [selectedIndustria, setSelectedIndustria] = useState("");
  const [vinculos, setVinculos] = useState<string[]>([]);
  const [form, setForm] = useState({ nome: "", slug: "" });
  const [userForm, setUserForm] = useState({
    email: "",
    password: "",
    nome: "",
    industria_id: "",
  });

  async function load() {
    const supabase = createClient();
    const [{ data: i }, { data: l }] = await Promise.all([
      supabase.from("industrias").select("*"),
      supabase.from("lojas").select("*").eq("ativo", true),
    ]);
    setIndustrias((i as Industria[]) ?? []);
    setLojas((l as Loja[]) ?? []);
    if (i?.[0]) setSelectedIndustria(i[0].id);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!selectedIndustria) return;
    const supabase = createClient();
    supabase
      .from("industria_lojas")
      .select("loja_id")
      .eq("industria_id", selectedIndustria)
      .then(({ data }) => setVinculos(data?.map((r) => r.loja_id) ?? []));
  }, [selectedIndustria]);

  async function createIndustria(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    await supabase.from("industrias").insert({
      nome: form.nome,
      slug: form.slug.toLowerCase().replace(/\s+/g, "-"),
      ativo: true,
    });
    setForm({ nome: "", slug: "" });
    load();
  }

  async function saveVinculos() {
    const supabase = createClient();
    await supabase
      .from("industria_lojas")
      .delete()
      .eq("industria_id", selectedIndustria);
    if (vinculos.length) {
      await supabase.from("industria_lojas").insert(
        vinculos.map((loja_id) => ({
          industria_id: selectedIndustria,
          loja_id,
        }))
      );
    }
    alert("Vínculos salvos.");
  }

  async function createIndustriaUser(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/industria-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userForm),
    });
    const json = await res.json();
    if (!res.ok) alert(json.error);
    else alert("Usuário indústria criado.");
  }

  function toggleLoja(id: string) {
    setVinculos((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold">Indústrias</h2>
      <Card>
        <CardHeader>
          <CardTitle>Nova indústria</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createIndustria} className="flex gap-4 flex-wrap">
            <Input
              placeholder="Nome"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              required
            />
            <Input
              placeholder="slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              required
            />
            <Button type="submit">Criar</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lojas visíveis por indústria</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            className="border rounded-md h-10 px-3 mb-4"
            value={selectedIndustria}
            onChange={(e) => setSelectedIndustria(e.target.value)}
          >
            {industrias.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nome}
              </option>
            ))}
          </select>
          <div className="max-h-48 overflow-y-auto space-y-1 mb-4">
            {lojas.map((l) => (
              <label key={l.id} className="flex gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={vinculos.includes(l.id)}
                  onChange={() => toggleLoja(l.id)}
                />
                {l.codigo_identificacao} — {l.nome}
              </label>
            ))}
          </div>
          <Button onClick={saveVinculos}>Salvar vínculos</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuário dono de indústria</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createIndustriaUser} className="grid gap-4 max-w-md">
            <div>
              <Label>Nome</Label>
              <Input
                value={userForm.nome}
                onChange={(e) =>
                  setUserForm({ ...userForm, nome: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input
                type="email"
                value={userForm.email}
                onChange={(e) =>
                  setUserForm({ ...userForm, email: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label>Senha</Label>
              <Input
                type="password"
                value={userForm.password}
                onChange={(e) =>
                  setUserForm({ ...userForm, password: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label>Indústria</Label>
              <select
                className="border rounded-md h-10 px-3 w-full"
                value={userForm.industria_id || selectedIndustria}
                onChange={(e) =>
                  setUserForm({ ...userForm, industria_id: e.target.value })
                }
              >
                {industrias.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nome}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit">Criar usuário</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

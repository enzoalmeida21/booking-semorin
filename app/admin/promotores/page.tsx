"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isContractExpiringSoon } from "@/lib/dates";
import type { Profile, Contrato, PromotorStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface PromotorRow extends Profile {
  contratos?: Contrato[];
}

export default function AdminPromotoresPage() {
  const searchParams = useSearchParams();
  const [promotores, setPromotores] = useState<PromotorRow[]>([]);
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") ?? ""
  );
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let q = supabase
      .from("profiles")
      .select("*, contratos(*)")
      .eq("role", "promotor")
      .order("created_at", { ascending: false });

    if (statusFilter) {
      q = q.eq("status", statusFilter as PromotorStatus);
    }

    const { data } = await q;
    setPromotores((data as PromotorRow[]) ?? []);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function aprovar(id: string) {
    await fetch(`/api/admin/promotores/${id}/aprovar`, { method: "POST" });
    load();
  }

  async function rejeitar(id: string) {
    await fetch(`/api/admin/promotores/${id}/rejeitar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motivo }),
    });
    setMotivo("");
    load();
  }

  async function verContrato(path: string) {
    const res = await fetch(`/api/admin/contrato-url?path=${encodeURIComponent(path)}`);
    const json = await res.json();
    if (json.url) window.open(json.url, "_blank");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <h2 className="text-2xl font-semibold">Promotores</h2>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-48"
        >
          <option value="">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
          <option value="contrato_vencido">Contrato vencido</option>
        </Select>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <div className="space-y-4">
          {promotores.map((p) => {
            const contrato = p.contratos?.find((c) => c.ativo) ?? p.contratos?.[0];
            const expiring =
              contrato &&
              isContractExpiringSoon(contrato.data_vencimento);
            return (
              <Card key={p.id}>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap gap-2 items-center justify-between">
                    <CardTitle className="text-lg">{p.nome}</CardTitle>
                    <Badge
                      variant={
                        p.status === "pendente"
                          ? "warning"
                          : p.status === "ativo"
                            ? "default"
                            : "destructive"
                      }
                    >
                      {p.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>CPF: {p.cpf} · {p.municipio}/{p.uf}</p>
                  <p>E-mail: {p.email}</p>
                  {contrato && (
                    <p>
                      Contrato vence: {contrato.data_vencimento}
                      {expiring && (
                        <Badge variant="warning" className="ml-2">
                          Vence em 30 dias
                        </Badge>
                      )}
                    </p>
                  )}
                  {p.motivo_rejeicao && (
                    <p className="text-destructive">Motivo: {p.motivo_rejeicao}</p>
                  )}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {contrato && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => verContrato(contrato.storage_path)}
                      >
                        Ver contrato
                      </Button>
                    )}
                    {p.status === "pendente" && (
                      <>
                        <Button size="sm" onClick={() => aprovar(p.id)}>
                          Aprovar
                        </Button>
                        <div className="flex gap-2 items-center">
                          <Input
                            placeholder="Motivo rejeição (opcional)"
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            className="max-w-xs"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => rejeitar(p.id)}
                          >
                            Rejeitar
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

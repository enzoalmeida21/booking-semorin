"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Foto, Loja, Produto, Industria } from "@/lib/types";
import { addDaysBrazil } from "@/lib/dates";
import { PhotoGrid } from "@/components/PhotoGrid";
import { PhotoLightbox } from "@/components/PhotoLightbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ESTOQUE_OPCOES, UFS } from "@/lib/types";

export default function AdminFotosPage() {
  const defaultRange = addDaysBrazil(7);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [industrias, setIndustrias] = useState<Industria[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Foto | null>(null);
  const [filters, setFilters] = useState({
    codigo_loja: "",
    municipio: "",
    uf: "",
    produto_id: "",
    industria_id: "",
    estoque: "",
    validacao_status: "aprovada",
    from: defaultRange.from,
    to: defaultRange.to,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    let q = supabase
      .from("fotos")
      .select(
        `
        *,
        lojas (id, codigo_identificacao, nome, municipio, uf, cidade),
        produtos (id, nome, industria_id),
        profiles (nome)
      `
      )
      .gte("captured_at", `${filters.from}T00:00:00`)
      .lte("captured_at", `${filters.to}T23:59:59`)
      .order("captured_at", { ascending: false });

    if (filters.validacao_status) {
      q = q.eq("validacao_status", filters.validacao_status);
    }
    if (filters.industria_id) {
      q = q.eq("industria_id", filters.industria_id);
    }

    const { data, error } = await q;

    if (error) {
      console.error(error);
      setFotos([]);
      setLoading(false);
      return;
    }

    let list = (data as Foto[]) ?? [];

    if (filters.codigo_loja) {
      list = list.filter((f) =>
        f.lojas?.codigo_identificacao
          ?.toLowerCase()
          .includes(filters.codigo_loja.toLowerCase())
      );
    }
    if (filters.municipio) {
      list = list.filter((f) =>
        f.lojas?.municipio
          ?.toLowerCase()
          .includes(filters.municipio.toLowerCase())
      );
    }
    if (filters.uf) {
      list = list.filter((f) => f.lojas?.uf === filters.uf);
    }
    if (filters.produto_id) {
      list = list.filter((f) => f.produto_id === filters.produto_id);
    }
    if (filters.estoque) {
      list = list.filter((f) => f.estoque_disponivel === filters.estoque);
    }

    setFotos(list);

    const urls: Record<string, string> = {};
    await Promise.all(
      list.map(async (foto) => {
        const { data: signed } = await supabase.storage
          .from("fotos")
          .createSignedUrl(foto.storage_path, 3600);
        if (signed?.signedUrl) urls[foto.id] = signed.signedUrl;
      })
    );
    setImageUrls(urls);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const [{ data: l }, { data: p }, { data: i }] = await Promise.all([
        supabase.from("lojas").select("*").order("nome"),
        supabase.from("produtos").select("*").eq("ativo", true).order("nome"),
        supabase.from("industrias").select("*").order("nome"),
      ]);
      setLojas((l as Loja[]) ?? []);
      setProdutos((p as Produto[]) ?? []);
      setIndustrias((i as Industria[]) ?? []);
    }
    init();
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Fotos enviadas</h2>
          <p className="text-sm text-muted-foreground">
            Todas as visitas registradas pelos promotores
          </p>
        </div>
        <Badge variant="secondary">{fotos.length} fotos</Badge>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-card rounded-xl border">
        <div>
          <Label>Indústria</Label>
          <Select
            value={filters.industria_id}
            onChange={(e) =>
              setFilters({ ...filters, industria_id: e.target.value })
            }
          >
            <option value="">Todas</option>
            {industrias.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nome}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select
            value={filters.validacao_status}
            onChange={(e) =>
              setFilters({ ...filters, validacao_status: e.target.value })
            }
          >
            <option value="aprovada">Aprovadas</option>
            <option value="">Todas</option>
            <option value="rejeitada_exif">Rejeitadas EXIF</option>
            <option value="rejeitada_data">Rejeitadas data</option>
            <option value="rejeitada_duplicata">Duplicadas</option>
          </Select>
        </div>
        <div>
          <Label>Código loja</Label>
          <Input
            value={filters.codigo_loja}
            onChange={(e) =>
              setFilters({ ...filters, codigo_loja: e.target.value })
            }
            placeholder="LOJA-001"
          />
        </div>
        <div>
          <Label>Município</Label>
          <Input
            value={filters.municipio}
            onChange={(e) =>
              setFilters({ ...filters, municipio: e.target.value })
            }
          />
        </div>
        <div>
          <Label>UF</Label>
          <Select
            value={filters.uf}
            onChange={(e) => setFilters({ ...filters, uf: e.target.value })}
          >
            <option value="">Todas</option>
            {UFS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Produto</Label>
          <Select
            value={filters.produto_id}
            onChange={(e) =>
              setFilters({ ...filters, produto_id: e.target.value })
            }
          >
            <option value="">Todos</option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Estoque</Label>
          <Select
            value={filters.estoque}
            onChange={(e) =>
              setFilters({ ...filters, estoque: e.target.value })
            }
          >
            <option value="">Todos</option>
            {ESTOQUE_OPCOES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>De</Label>
          <Input
            type="date"
            value={filters.from}
            onChange={(e) =>
              setFilters({ ...filters, from: e.target.value })
            }
          />
        </div>
        <div>
          <Label>Até</Label>
          <Input
            type="date"
            value={filters.to}
            onChange={(e) =>
              setFilters({ ...filters, to: e.target.value })
            }
          />
        </div>
        <div className="flex items-end">
          <Button onClick={load} variant="secondary" className="w-full">
            Atualizar
          </Button>
        </div>
      </div>

      <PhotoGrid
        fotos={fotos}
        imageUrls={imageUrls}
        loading={loading}
        onSelect={setSelected}
      />

      <PhotoLightbox
        foto={selected}
        imageUrl={selected ? imageUrls[selected.id] : undefined}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

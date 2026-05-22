"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Foto, Loja, Produto } from "@/lib/types";
import { addDaysBrazil } from "@/lib/dates";
import { PhotoGrid } from "@/components/PhotoGrid";
import { PhotoLightbox } from "@/components/PhotoLightbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ESTOQUE_OPCOES, UFS } from "@/lib/types";
import { Download } from "lucide-react";

export default function IndustriaGaleriaPage() {
  const defaultRange = addDaysBrazil(7);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Foto | null>(null);
  const [filters, setFilters] = useState({
    codigo_loja: "",
    municipio: "",
    uf: "",
    produto_id: "",
    estoque: "",
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
        produtos (id, nome),
        profiles (nome)
      `
      )
      .eq("validacao_status", "aprovada")
      .gte("captured_at", `${filters.from}T00:00:00`)
      .lte("captured_at", `${filters.to}T23:59:59`)
      .order("captured_at", { ascending: false });

    const { data } = await q;
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
      const [{ data: l }, { data: p }] = await Promise.all([
        supabase.from("lojas").select("*").eq("ativo", true),
        supabase.from("produtos").select("*").eq("ativo", true),
      ]);
      setLojas((l as Loja[]) ?? []);
      setProdutos((p as Produto[]) ?? []);
    }
    init();
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function downloadPdf() {
    const params = new URLSearchParams({
      from: filters.from,
      to: filters.to,
    });
    window.open(`/api/book/pdf?${params}`, "_blank");
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold">Book de Fotos Trade Marketing</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Galeria com filtros — últimos 7 dias por padrão
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-card rounded-xl border">
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
        <div className="flex items-end gap-2">
          <Button onClick={load} variant="secondary">
            Filtrar
          </Button>
          <Button onClick={downloadPdf}>
            <Download className="h-4 w-4" />
            Book 7 dias (PDF)
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

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Loja, Produto } from "@/lib/types";
import { ESTOQUE_OPCOES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Camera } from "lucide-react";
import { CameraCapture } from "@/components/CameraCapture";

export default function PromotorEnviarPage() {
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [lojaId, setLojaId] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const [estoque, setEstoque] = useState<string>(ESTOQUE_OPCOES[0]);
  const [observacoes, setObservacoes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [capturedAt, setCapturedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [cameraKey, setCameraKey] = useState(0);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: vinculos } = await supabase
        .from("promotor_lojas")
        .select("loja_id, lojas(*)")
        .eq("promotor_id", user.id);

      const lojaList =
        vinculos?.map((v) => v.lojas as unknown as Loja).filter(Boolean) ?? [];
      setLojas(lojaList);

      const { data: prods } = await supabase
        .from("produtos")
        .select("*")
        .eq("ativo", true)
        .order("nome");
      setProdutos((prods as Produto[]) ?? []);
    }
    load();
  }, []);

  function handleCameraCapture(f: File, at: Date) {
    setFile(f);
    setCapturedAt(at);
    setError("");
    setMessage("");
  }

  function handleCameraClear() {
    setFile(null);
    setCapturedAt(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !capturedAt || !lojaId || !produtoId) {
      setError("Selecione loja, produto e tire a foto pelo botão da câmera.");
      return;
    }

    const produto = produtos.find((p) => p.id === produtoId);
    if (!produto) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("loja_id", lojaId);
      formData.append("produto_id", produtoId);
      formData.append("industria_id", produto.industria_id);
      formData.append("estoque_disponivel", estoque);
      formData.append("capture_source", "in_app_camera");
      // Horário da captura (não do envio) — validado no servidor com Date.now()
      formData.append("captured_at_client", capturedAt.toISOString());
      formData.append("submitted_at_client", new Date().toISOString());
      if (observacoes) formData.append("observacoes", observacoes);

      const res = await fetch("/api/upload/direct", {
        method: "POST",
        body: formData,
      });

      let json: { error?: string; success?: boolean } = {};
      try {
        json = await res.json();
      } catch {
        setError("Resposta inválida do servidor. Verifique se o app está rodando.");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(json.error ?? `Erro ao enviar (código ${res.status}).`);
        setLoading(false);
        return;
      }

      setMessage("Foto enviada com sucesso!");
      setFile(null);
      setCapturedAt(null);
      setCameraKey((k) => k + 1);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro inesperado ao enviar.";
      setError(msg);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-8">
      <h2 className="text-2xl font-semibold text-center">Enviar foto</h2>
      <p className="text-sm text-muted-foreground text-center px-2">
        Toque em <strong>Tirar foto no celular</strong> — abre a câmera do aparelho.
        Não escolha imagens da galeria.
      </p>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Nova visita
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Loja</Label>
              <Select
                value={lojaId}
                onChange={(e) => setLojaId(e.target.value)}
                required
              >
                <option value="">Selecione a loja</option>
                {lojas.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.codigo_identificacao} — {l.nome}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Produto</Label>
              <Select
                value={produtoId}
                onChange={(e) => setProdutoId(e.target.value)}
                required
              >
                <option value="">Selecione o produto</option>
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Estoque na loja</Label>
              <Select
                value={estoque}
                onChange={(e) => setEstoque(e.target.value)}
              >
                {ESTOQUE_OPCOES.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Observações (opcional)</Label>
              <Input
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </div>
            <div>
              <Label>Foto na loja (hoje)</Label>
              <CameraCapture
                key={cameraKey}
                onCapture={handleCameraCapture}
                onClear={handleCameraClear}
                disabled={loading}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {message && (
              <p className="text-sm text-primary font-medium">{message}</p>
            )}
            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={loading || !file}
            >
              {loading ? "Enviando..." : "Enviar foto"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

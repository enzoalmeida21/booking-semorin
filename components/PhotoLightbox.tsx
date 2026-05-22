"use client";

import Image from "next/image";
import type { Foto } from "@/lib/types";
import { formatBrazil } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface PhotoLightboxProps {
  foto: Foto | null;
  imageUrl?: string;
  onClose: () => void;
}

export function PhotoLightbox({ foto, imageUrl, onClose }: PhotoLightboxProps) {
  if (!foto) return null;

  const loja = foto.lojas;
  const produto = foto.produtos;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="font-semibold">Detalhes da foto</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="grid md:grid-cols-2 gap-4 p-4">
          <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
            {imageUrl && (
              <Image
                src={imageUrl}
                alt="Foto"
                fill
                className="object-contain"
              />
            )}
          </div>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Loja</dt>
              <dd className="font-medium">
                {loja?.codigo_identificacao} — {loja?.nome}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Cidade</dt>
              <dd>
                {loja?.municipio}, {loja?.uf}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Produto</dt>
              <dd>{produto?.nome}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Estoque</dt>
              <dd>{foto.estoque_disponivel}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Promotor</dt>
              <dd>{foto.profiles?.nome ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Capturada em</dt>
              <dd>{formatBrazil(foto.captured_at)}</dd>
            </div>
            {foto.observacoes && (
              <div>
                <dt className="text-muted-foreground">Observações</dt>
                <dd>{foto.observacoes}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import type { Foto } from "@/lib/types";
import { formatBrazil } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";

interface PhotoGridProps {
  fotos: Foto[];
  imageUrls: Record<string, string>;
  onSelect?: (foto: Foto) => void;
  loading?: boolean;
}

export function PhotoGrid({ fotos, imageUrls, onSelect, loading }: PhotoGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-xl bg-muted animate-pulse"
          />
        ))}
        <p className="col-span-full text-center text-muted-foreground py-4">
          Carregando fotos...
        </p>
      </div>
    );
  }

  if (fotos.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-16">
        Nenhuma foto encontrada para os filtros selecionados.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {fotos.map((foto) => {
        const url = imageUrls[foto.id];
        const loja = foto.lojas;
        const produto = foto.produtos;
        return (
          <button
            key={foto.id}
            type="button"
            onClick={() => onSelect?.(foto)}
            className="group relative aspect-square rounded-xl overflow-hidden border bg-card shadow-sm hover:shadow-md transition-shadow text-left"
          >
            {url ? (
              <Image
                src={url}
                alt={produto?.nome ?? "Foto"}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            ) : (
              <div className="absolute inset-0 bg-muted" />
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <p className="text-white text-xs font-medium truncate">
                {loja?.codigo_identificacao} — {loja?.nome}
              </p>
              <p className="text-white/80 text-xs truncate">
                {produto?.nome} · {foto.estoque_disponivel}
              </p>
              <Badge variant="secondary" className="mt-1 text-[10px]">
                {formatBrazil(foto.captured_at, "dd/MM/yyyy")}
              </Badge>
            </div>
          </button>
        );
      })}
    </div>
  );
}

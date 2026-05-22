"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RotateCcw, X, Smartphone } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (file: File, capturedAt: Date) => void;
  onClear?: () => void;
  disabled?: boolean;
}

function canUseLiveCamera(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    window.isSecureContext &&
      navigator.mediaDevices?.getUserMedia
  );
}

export function CameraCapture({
  onCapture,
  onClear,
  disabled,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const nativeInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [mode, setMode] = useState<"idle" | "live" | "preview">("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [liveAvailable, setLiveAvailable] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment"
  );

  useEffect(() => {
    setLiveAvailable(canUseLiveCamera());
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      stopStream();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [stopStream, previewUrl]);

  function applyCapture(file: File, capturedAt: Date) {
    const url = URL.createObjectURL(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(url);
    setMode("preview");
    setError("");
    onCapture(file, capturedAt);
  }

  function handleNativeFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;

    if (!f.type.startsWith("image/")) {
      setError("Selecione apenas uma imagem.");
      return;
    }

    const capturedAt = new Date();
    const fileAgeMs = Math.abs(capturedAt.getTime() - f.lastModified);

    if (fileAgeMs > 3 * 60 * 1000) {
      setError(
        "Parece que você escolheu uma foto antiga da galeria. Toque em Tirar foto e use a câmera agora."
      );
      return;
    }

    applyCapture(f, capturedAt);
  }

  function openNativeCamera() {
    setError("");
    nativeInputRef.current?.click();
  }

  async function startLiveCamera() {
    setError("");
    stopStream();

    if (!canUseLiveCamera()) {
      openNativeCamera();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setMode("live");
    } catch {
      setError(
        "Não foi possível abrir a câmera ao vivo. Use o botão «Tirar foto no celular»."
      );
      setMode("idle");
    }
  }

  function takePhoto() {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const capturedAt = new Date();

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Não foi possível gerar a imagem.");
          return;
        }
        stopStream();
        const file = new File([blob], `captura-${capturedAt.getTime()}.jpg`, {
          type: "image/jpeg",
          lastModified: capturedAt.getTime(),
        });
        applyCapture(file, capturedAt);
      },
      "image/jpeg",
      0.88
    );
  }

  function retake() {
    stopStream();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    onClear?.();
    setMode("idle");
    setError("");
  }

  function toggleCamera() {
    setFacingMode((f) => (f === "environment" ? "user" : "environment"));
    if (mode === "live") {
      stopStream();
      setMode("idle");
      setTimeout(() => startLiveCamera(), 100);
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={nativeInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleNativeFile}
        disabled={disabled}
      />

      {mode === "idle" && (
        <>
          <Button
            type="button"
            className="w-full h-14 text-base"
            onClick={openNativeCamera}
            disabled={disabled}
          >
            <Smartphone className="h-6 w-6 mr-2" />
            Tirar foto no celular
          </Button>
          <p className="text-xs text-muted-foreground text-center px-1">
            Abre a <strong>câmera nativa</strong> do aparelho (funciona em Wi‑Fi sem HTTPS).
            Não escolha fotos da galeria.
          </p>
          {liveAvailable && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={startLiveCamera}
              disabled={disabled}
            >
              <Camera className="h-5 w-5 mr-2" />
              Câmera ao vivo no navegador (HTTPS)
            </Button>
          )}
          {!liveAvailable && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2 text-center">
              Câmera ao vivo só com link <strong>https://</strong>. O botão acima já resolve no celular.
            </p>
          )}
        </>
      )}

      {mode === "live" && (
        <div className="relative rounded-xl overflow-hidden bg-black aspect-[3/4] max-h-[70vh]">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 inset-x-0 p-4 flex items-center justify-center gap-4 bg-gradient-to-t from-black/70 to-transparent">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="rounded-full h-12 w-12"
              onClick={toggleCamera}
              aria-label="Trocar câmera"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              className="rounded-full h-16 w-16 shadow-lg"
              onClick={takePhoto}
              aria-label="Capturar foto"
            >
              <Camera className="h-8 w-8" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="rounded-full h-12 w-12 text-white hover:bg-white/20"
              onClick={() => {
                stopStream();
                setMode("idle");
              }}
              aria-label="Cancelar"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {mode === "preview" && previewUrl && (
        <div className="space-y-3">
          <img
            src={previewUrl}
            alt="Foto capturada"
            className="w-full rounded-xl max-h-[50vh] object-contain bg-muted"
          />
          <p className="text-xs text-muted-foreground text-center">
            Foto registrada agora. Toque em Refazer para capturar outra.
          </p>
          <Button type="button" variant="outline" className="w-full" onClick={retake}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Refazer foto
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

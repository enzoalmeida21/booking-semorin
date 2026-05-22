import exifr from "exifr";
import { isSameDayBrazil, nowInBrazil } from "./dates";

export type CaptureSource = "in_app_camera" | "file";

export interface ExifValidationResult {
  valid: boolean;
  capturedAt?: Date;
  raw?: Record<string, unknown>;
  error?: string;
}

const MAX_MINUTES_AFTER_CAPTURE = 30;

export async function validatePhotoExif(
  buffer: ArrayBuffer
): Promise<ExifValidationResult> {
  try {
    const parsed = await exifr.parse(buffer, {
      pick: ["DateTimeOriginal", "CreateDate", "ModifyDate"],
    });

    if (!parsed) {
      return {
        valid: false,
        error: "EXIF não encontrado. Use o botão Tirar foto no app.",
      };
    }

    const dateOriginal =
      parsed.DateTimeOriginal ?? parsed.CreateDate ?? parsed.ModifyDate;

    if (!dateOriginal) {
      return {
        valid: false,
        raw: parsed as Record<string, unknown>,
        error: "Data da foto não encontrada no EXIF.",
      };
    }

    const capturedAt = new Date(dateOriginal);
    if (Number.isNaN(capturedAt.getTime())) {
      return {
        valid: false,
        error: "Data EXIF inválida.",
      };
    }

    if (!isSameDayBrazil(capturedAt)) {
      return {
        valid: false,
        capturedAt,
        raw: parsed as Record<string, unknown>,
        error: "A foto deve ter sido tirada hoje.",
      };
    }

    return {
      valid: true,
      capturedAt,
      raw: parsed as Record<string, unknown>,
    };
  } catch {
    return {
      valid: false,
      error: "Não foi possível ler os metadados da foto.",
    };
  }
}

function validateInAppCapture(capturedAtClient: string): ExifValidationResult {
  const capturedAt = new Date(capturedAtClient);
  if (Number.isNaN(capturedAt.getTime())) {
    return { valid: false, error: "Horário da captura inválido." };
  }

  if (!isSameDayBrazil(capturedAt)) {
    return {
      valid: false,
      capturedAt,
      error: "A foto deve ser tirada hoje. Abra o app e tire a foto agora.",
    };
  }

  const now = nowInBrazil();
  const diffMinutes =
    Math.abs(now.getTime() - capturedAt.getTime()) / (1000 * 60);

  if (diffMinutes > MAX_MINUTES_AFTER_CAPTURE) {
    return {
      valid: false,
      capturedAt,
      error: `Envie a foto em até ${MAX_MINUTES_AFTER_CAPTURE} minutos após tirá-la.`,
    };
  }

  return {
    valid: true,
    capturedAt,
    raw: {
      source: "in_app_camera",
      captured_at_client: capturedAtClient,
      validated_at: now.toISOString(),
    },
  };
}

export async function validatePhotoForUpload(
  buffer: ArrayBuffer,
  options: {
    captureSource: CaptureSource;
    capturedAtClient?: string;
  }
): Promise<ExifValidationResult> {
  if (options.captureSource === "in_app_camera") {
    if (!options.capturedAtClient) {
      return {
        valid: false,
        error: "Use o botão Tirar foto dentro do app.",
      };
    }
    return validateInAppCapture(options.capturedAtClient);
  }

  return validatePhotoExif(buffer);
}

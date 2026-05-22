import { formatInTimeZone, toZonedTime } from "date-fns-tz";

export const TZ_BR = "America/Sao_Paulo";

export function nowInBrazil(): Date {
  return toZonedTime(new Date(), TZ_BR);
}

export function todayBrazilDateString(): string {
  return formatInTimeZone(new Date(), TZ_BR, "yyyy-MM-dd");
}

export function formatBrazil(
  date: Date | string,
  pattern = "dd/MM/yyyy HH:mm"
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatInTimeZone(d, TZ_BR, pattern);
}

export function isSameDayBrazil(capturedAt: Date, reference = new Date()): boolean {
  const cap = formatInTimeZone(capturedAt, TZ_BR, "yyyy-MM-dd");
  const ref = formatInTimeZone(reference, TZ_BR, "yyyy-MM-dd");
  return cap === ref;
}

export function addDaysBrazil(days: number): { from: string; to: string } {
  const to = todayBrazilDateString();
  const d = toZonedTime(new Date(), TZ_BR);
  d.setDate(d.getDate() - (days - 1));
  const from = formatInTimeZone(d, TZ_BR, "yyyy-MM-dd");
  return { from, to };
}

export function isContractExpiringSoon(
  dataVencimento: string,
  withinDays = 30
): boolean {
  const today = todayBrazilDateString();
  const limit = new Date(dataVencimento);
  const now = new Date(today);
  const diff = (limit.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= withinDays;
}

export function isContractExpired(dataVencimento: string): boolean {
  return dataVencimento < todayBrazilDateString();
}

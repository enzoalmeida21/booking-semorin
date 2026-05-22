import { cpf as cpfValidator } from "cpf-cnpj-validator";

export function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

export function isValidCpf(cpf: string): boolean {
  const digits = normalizeCpf(cpf);
  return digits.length === 11 && cpfValidator.isValid(digits);
}

export function formatCpf(cpf: string): string {
  const d = normalizeCpf(cpf);
  if (d.length !== 11) return cpf;
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

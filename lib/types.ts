export type UserRole = "promotor" | "industria" | "admin";

export type PromotorStatus =
  | "pendente"
  | "ativo"
  | "inativo"
  | "contrato_vencido";

export type FotoValidacaoStatus =
  | "aprovada"
  | "rejeitada_exif"
  | "rejeitada_duplicata"
  | "rejeitada_data";

export interface Profile {
  id: string;
  role: UserRole;
  nome: string;
  email?: string;
  industria_id: string | null;
  cpf: string | null;
  telefone: string | null;
  municipio: string | null;
  uf: string | null;
  status: PromotorStatus | null;
  motivo_rejeicao: string | null;
  created_at: string;
}

export interface Industria {
  id: string;
  nome: string;
  slug: string;
  logo_url: string | null;
  ativo: boolean;
}

export interface Loja {
  id: string;
  codigo_identificacao: string;
  nome: string;
  cidade: string;
  municipio: string;
  uf: string;
  ativo: boolean;
}

export interface Produto {
  id: string;
  industria_id: string;
  nome: string;
  sku: string | null;
  categoria: string | null;
  ativo: boolean;
}

export interface Contrato {
  id: string;
  promotor_id: string;
  storage_path: string;
  data_vencimento: string;
  data_upload: string;
  ativo: boolean;
}

export interface Foto {
  id: string;
  loja_id: string;
  promotor_id: string;
  produto_id: string;
  industria_id: string;
  estoque_disponivel: string;
  observacoes: string | null;
  storage_path: string;
  content_hash: string;
  captured_at: string;
  submitted_at: string;
  validacao_status: FotoValidacaoStatus;
  lojas?: Loja;
  produtos?: Produto;
  profiles?: { nome: string };
}

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export const ESTOQUE_OPCOES = [
  "Sem estoque",
  "Estoque baixo",
  "Estoque médio",
  "Estoque alto",
] as const;

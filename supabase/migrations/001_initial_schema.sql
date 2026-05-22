-- Mustafa Book de Fotos — schema inicial

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM ('promotor', 'industria', 'admin');
CREATE TYPE promotor_status AS ENUM ('pendente', 'ativo', 'inativo', 'contrato_vencido');
CREATE TYPE foto_validacao_status AS ENUM (
  'aprovada',
  'rejeitada_exif',
  'rejeitada_duplicata',
  'rejeitada_data'
);

-- Indústrias clientes Mustafa
CREATE TABLE industrias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lojas (cadastro Mustafa)
CREATE TABLE lojas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo_identificacao TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  cidade TEXT NOT NULL,
  municipio TEXT NOT NULL,
  uf CHAR(2) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lojas_uf_municipio ON lojas (uf, municipio);
CREATE INDEX idx_lojas_ativo ON lojas (ativo) WHERE ativo = true;

-- Produtos por indústria
CREATE TABLE produtos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  industria_id UUID NOT NULL REFERENCES industrias(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  sku TEXT,
  categoria TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_produtos_industria ON produtos (industria_id);

-- Escopo: quais lojas cada indústria vê
CREATE TABLE industria_lojas (
  industria_id UUID NOT NULL REFERENCES industrias(id) ON DELETE CASCADE,
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  PRIMARY KEY (industria_id, loja_id)
);

-- Perfis (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  nome TEXT NOT NULL,
  email TEXT,
  industria_id UUID REFERENCES industrias(id),
  cpf TEXT UNIQUE,
  telefone TEXT,
  municipio TEXT,
  uf CHAR(2),
  status promotor_status,
  motivo_rejeicao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cpf_required_for_promotor CHECK (
    role != 'promotor' OR cpf IS NOT NULL OR status IN ('pendente', 'inativo')
  )
);

CREATE INDEX idx_profiles_role ON profiles (role);
CREATE INDEX idx_profiles_status ON profiles (status) WHERE role = 'promotor';
CREATE INDEX idx_profiles_cpf ON profiles (cpf);

-- Lojas do promotor (após aprovação)
CREATE TABLE promotor_lojas (
  promotor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  PRIMARY KEY (promotor_id, loja_id)
);

-- Lojas selecionadas no cadastro (pendente)
CREATE TABLE promotor_cadastro_lojas (
  promotor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  PRIMARY KEY (promotor_id, loja_id)
);

-- Contratos dos promotores
CREATE TABLE contratos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promotor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  data_vencimento DATE NOT NULL,
  data_upload TIMESTAMPTZ NOT NULL DEFAULT now(),
  ativo BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_contratos_promotor_vencimento ON contratos (promotor_id, data_vencimento DESC);

-- Fotos de trade marketing
CREATE TABLE fotos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loja_id UUID NOT NULL REFERENCES lojas(id),
  promotor_id UUID NOT NULL REFERENCES profiles(id),
  produto_id UUID NOT NULL REFERENCES produtos(id),
  industria_id UUID NOT NULL REFERENCES industrias(id),
  estoque_disponivel TEXT NOT NULL,
  observacoes TEXT,
  storage_path TEXT NOT NULL,
  content_hash TEXT NOT NULL UNIQUE,
  captured_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  exif_raw JSONB,
  validacao_status foto_validacao_status NOT NULL DEFAULT 'aprovada'
);

CREATE INDEX idx_fotos_industria_captured ON fotos (industria_id, captured_at DESC);
CREATE INDEX idx_fotos_loja_captured ON fotos (loja_id, captured_at DESC);
CREATE INDEX idx_fotos_promotor ON fotos (promotor_id);

-- Notificações admin (MVP badge)
CREATE TABLE notificacoes_admin (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  referencia_id UUID,
  lida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger: novo usuário → profile placeholder (service role inserts full profile on cadastro)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role user_role;
  v_status promotor_status;
BEGIN
  BEGIN
    v_role := COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'promotor'::user_role
    );
  EXCEPTION WHEN OTHERS THEN
    v_role := 'promotor'::user_role;
  END;

  v_status := CASE
    WHEN v_role = 'promotor'::user_role THEN 'pendente'::promotor_status
    ELSE NULL
  END;

  INSERT INTO public.profiles (id, role, nome, email, status)
  VALUES (
    NEW.id,
    v_role,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    v_status
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função: verificar contratos vencidos
CREATE OR REPLACE FUNCTION public.check_contratos_vencidos()
RETURNS void AS $$
BEGIN
  UPDATE profiles p
  SET status = 'contrato_vencido'
  FROM contratos c
  WHERE p.id = c.promotor_id
    AND p.role = 'promotor'
    AND p.status = 'ativo'
    AND c.ativo = true
    AND c.data_vencimento < (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_promotor_ativo()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = 'promotor'
      AND status = 'ativo'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_my_industria_id()
RETURNS UUID AS $$
  SELECT industria_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- RLS
ALTER TABLE industrias ENABLE ROW LEVEL SECURITY;
ALTER TABLE lojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE industria_lojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotor_lojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotor_cadastro_lojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes_admin ENABLE ROW LEVEL SECURITY;

-- Industrias: leitura autenticada; admin escreve
CREATE POLICY industrias_select ON industrias FOR SELECT TO authenticated
  USING (ativo = true OR public.is_admin());
CREATE POLICY industrias_admin ON industrias FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Lojas: promotor pendente não vê; demais autenticados leem ativas
CREATE POLICY lojas_select ON lojas FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (ativo = true AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('industria', 'admin')
    ))
    OR (ativo = true AND public.is_promotor_ativo())
    OR (ativo = true AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'promotor' AND status = 'pendente'
    ))
  );

CREATE POLICY lojas_public_cadastro ON lojas FOR SELECT TO anon
  USING (ativo = true);

CREATE POLICY lojas_admin ON lojas FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Produtos
CREATE POLICY produtos_select ON produtos FOR SELECT TO authenticated
  USING (ativo = true OR public.is_admin());
CREATE POLICY produtos_admin ON produtos FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- industria_lojas
CREATE POLICY industria_lojas_select ON industria_lojas FOR SELECT TO authenticated
  USING (public.is_admin() OR industria_id = public.get_my_industria_id());
CREATE POLICY industria_lojas_admin ON industria_lojas FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Profiles
CREATE POLICY profiles_select_own ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());
CREATE POLICY profiles_update_own ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY profiles_admin ON profiles FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- promotor_lojas
CREATE POLICY promotor_lojas_select ON promotor_lojas FOR SELECT TO authenticated
  USING (
    promotor_id = auth.uid()
    OR public.is_admin()
    OR public.is_promotor_ativo()
  );
CREATE POLICY promotor_lojas_admin ON promotor_lojas FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- promotor_cadastro_lojas
CREATE POLICY cadastro_lojas_select ON promotor_cadastro_lojas FOR SELECT TO authenticated
  USING (promotor_id = auth.uid() OR public.is_admin());
CREATE POLICY cadastro_lojas_insert ON promotor_cadastro_lojas FOR INSERT TO authenticated
  WITH CHECK (promotor_id = auth.uid());
CREATE POLICY cadastro_lojas_admin ON promotor_cadastro_lojas FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- contratos
CREATE POLICY contratos_select ON contratos FOR SELECT TO authenticated
  USING (promotor_id = auth.uid() OR public.is_admin());
CREATE POLICY contratos_insert ON contratos FOR INSERT TO authenticated
  WITH CHECK (promotor_id = auth.uid());
CREATE POLICY contratos_admin ON contratos FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- fotos
CREATE POLICY fotos_select_industria ON fotos FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (
      validacao_status = 'aprovada'
      AND industria_id = public.get_my_industria_id()
    )
    OR promotor_id = auth.uid()
  );

CREATE POLICY fotos_insert_promotor ON fotos FOR INSERT TO authenticated
  WITH CHECK (
    public.is_promotor_ativo()
    AND promotor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM promotor_lojas pl
      WHERE pl.promotor_id = auth.uid() AND pl.loja_id = fotos.loja_id
    )
  );

CREATE POLICY fotos_admin ON fotos FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- notificacoes admin
CREATE POLICY notificacoes_admin ON notificacoes_admin FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Storage buckets (run in Supabase dashboard or via SQL)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('fotos', 'fotos', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('contratos', 'contratos', false);

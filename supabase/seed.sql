-- Seed Mustafa / Semorim
-- Execute after migrations. Create admin user in Supabase Auth first, then replace ADMIN_USER_ID.

-- Indústria Semorim
INSERT INTO industrias (id, nome, slug, logo_url, ativo)
VALUES (
  'a0000000-0000-4000-8000-000000000001',
  'Semorim',
  'semorim',
  '/logo-semorim-placeholder.svg',
  true
) ON CONFLICT (slug) DO NOTHING;

-- Produtos Semorim (5-10 — preencher SKU reais depois)
INSERT INTO produtos (industria_id, nome, sku, categoria, ativo) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'Produto Semorim 1', 'SEM-001', 'Linha principal', true),
  ('a0000000-0000-4000-8000-000000000001', 'Produto Semorim 2', 'SEM-002', 'Linha principal', true),
  ('a0000000-0000-4000-8000-000000000001', 'Produto Semorim 3', 'SEM-003', 'Linha principal', true),
  ('a0000000-0000-4000-8000-000000000001', 'Produto Semorim 4', 'SEM-004', 'Linha secundária', true),
  ('a0000000-0000-4000-8000-000000000001', 'Produto Semorim 5', 'SEM-005', 'Linha secundária', true),
  ('a0000000-0000-4000-8000-000000000001', 'Produto Semorim 6', 'SEM-006', 'Promocional', true),
  ('a0000000-0000-4000-8000-000000000001', 'Produto Semorim 7', 'SEM-007', 'Promocional', true);

-- INSERIR LOJAS MUSTAFA AQUI — lojas ativas fornecidas pela operação
INSERT INTO lojas (codigo_identificacao, nome, cidade, municipio, uf, ativo) VALUES
  ('LOJA-001', 'Supermercado Exemplo Centro', 'São Paulo', 'São Paulo', 'SP', true),
  ('LOJA-002', 'Mercado Exemplo Norte', 'São Paulo', 'São Paulo', 'SP', true),
  ('LOJA-003', 'Atacado Exemplo Sul', 'Campinas', 'Campinas', 'SP', true);

-- Vincular lojas à Semorim
INSERT INTO industria_lojas (industria_id, loja_id)
SELECT 'a0000000-0000-4000-8000-000000000001', id FROM lojas
ON CONFLICT DO NOTHING;

-- Admin Mustafa: após criar usuário em Auth (admin@mustafa.com.br), executar:
-- UPDATE profiles SET role = 'admin', nome = 'Admin Mustafa', status = NULL, cpf = NULL
-- WHERE email = 'admin@mustafa.com.br';

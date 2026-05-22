# Book de Fotos — Mustafa / Semorim

Sistema de trade marketing para promotores Mustafa enviarem fotos de lojas para indústrias clientes (MVP: Semorim).

## Stack

- Next.js 14 (App Router)
- Supabase (Auth, Postgres, Storage)
- Tailwind CSS + componentes UI leves

## Configuração

**Obrigatório antes de `npm run dev`:** sem `.env.local` o app redireciona para `/configuracao`.

1. Crie um projeto em [Supabase](https://supabase.com).
2. Copie `.env.example` para `.env.local` e preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

3. No SQL Editor do Supabase, execute em ordem:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_storage_policies.sql`
   - `supabase/seed.sql`

4. Crie os buckets **privados** no Storage: `fotos` e `contratos`.

5. Crie o usuário admin no Auth (**Authentication → Users → Add user**):
   - Marque **Auto Confirm User**
   - Em **User Metadata** (JSON):
   ```json
   {"role": "admin", "nome": "Admin Mustafa"}
   ```
   - Se já criou o usuário sem metadata:
   ```sql
   UPDATE profiles SET role = 'admin', nome = 'Admin Mustafa', status = NULL, cpf = NULL
   WHERE email = 'seu-admin@mustafa.com.br';
   ```

6. Erro ao criar usuário no Auth? Execute `supabase/migrations/003_fix_auth_user_trigger.sql` no SQL Editor.

## Desenvolvimento

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

### Testar no celular (câmera)

A câmera no navegador **só funciona em HTTPS** (ou `localhost`). No PC, `localhost` ok; no celular use um destes modos:

**Opção A — mesma Wi‑Fi (pode falhar a câmera sem HTTPS)**

1. PC e celular na **mesma rede Wi‑Fi**
2. `npm run dev` (já escuta em `0.0.0.0`)
3. No Mac, descubra o IP: `ipconfig getifaddr en0`
4. No celular: `http://SEU-IP:3000` (ex.: `http://192.168.15.3:3000`)

**Opção B — túnel HTTPS (recomendado para câmera)**

Terminal 1: `npm run dev`  
Terminal 2: `npm run dev:tunnel` → copie a URL `https://....loca.lt` e abra no celular.

Na primeira vez o LocalTunnel pode pedir o IP público — confirme no celular.

## Papéis

| Rota | Papel |
|------|--------|
| `/cadastro/promotor` | Auto-cadastro promotor (público) |
| `/promotor/enviar` | Envio de fotos (aprovado + contrato vigente) |
| `/industria/galeria` | Galeria + PDF 7 dias |
| `/admin` | Painel Mustafa |

## Deploy (produção)

O sistema usa **dois serviços**:

| Parte | Onde fica | O que é |
|-------|-----------|---------|
| **Backend** | [Supabase](https://supabase.com) | Banco, login, arquivos (fotos/contratos) |
| **Site (Next.js)** | [Vercel](https://vercel.com) | Interface web que o promotor e o admin acessam |

O Supabase **não hospeda** o app Next.js inteiro — só a API/banco/storage. O site você publica na Vercel (grátis) apontando para o mesmo projeto Supabase.

---

### Parte 1 — Supabase (backend) — você já tem

Se o projeto `lykxblszwbaqnifgoeam` já está configurado com migrations, buckets e admin, **o backend já está no ar**.

Checklist no painel Supabase:

1. **SQL** — migrations `001`, `002`, `003` e `seed.sql` executados  
2. **Storage** — buckets privados `fotos` e `contratos`  
3. **Authentication → URL Configuration** (após ter a URL da Vercel):
   - **Site URL:** `https://seu-app.vercel.app`
   - **Redirect URLs:** adicione:
     - `https://seu-app.vercel.app/**`
     - `http://localhost:3000/**` (para dev local)

4. **Settings → API** — anote para a Vercel:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role → `SUPABASE_SERVICE_ROLE_KEY` (só no servidor, nunca no navegador)

---

### Parte 2 — Vercel (site Next.js)

#### Opção A — pelo site (recomendado)

1. Suba o código no **GitHub** (repositório privado ou público).
2. Acesse [vercel.com](https://vercel.com) → **Add New Project** → importe o repositório.
3. **Root Directory:** pasta do projeto (`booking semorin` se for monorepo, senão raiz).
4. **Environment Variables** (igual ao `.env.local`):

   | Nome | Valor |
   |------|--------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://lykxblszwbaqnifgoeam.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | sua anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | sua service_role (Production only) |

5. **Deploy** → aguarde o build (`npm run build`).
6. Copie a URL gerada (ex.: `https://booking-semorin.vercel.app`).
7. Volte ao **Supabase → Authentication → URL Configuration** e cole essa URL como **Site URL** e em **Redirect URLs**.

#### Opção B — pela CLI

```bash
npm i -g vercel
cd "/Users/enzoalmeida/booking semorin"
vercel login
vercel
# Siga o assistente; depois configure as env vars no dashboard da Vercel
vercel --prod
```

---

### Parte 3 — Testar em produção

| Quem | URL |
|------|-----|
| Admin | `https://seu-app.vercel.app/login` → `/admin` |
| Promotor | `/cadastro/promotor` ou `/login` → `/promotor/enviar` |
| Indústria | `/login` → `/industria/galeria` |

No celular, instale como PWA: menu do navegador → **Adicionar à tela inicial**. A câmera funciona melhor com **HTTPS** (Vercel já fornece).

---

### Atualizar o sistema depois

- **Só banco/regras:** rode novos `.sql` no **SQL Editor** do Supabase.  
- **Só site:** `git push` na branch conectada à Vercel → deploy automático.  
- **Env vars novas:** Vercel → Project → Settings → Environment Variables.

---

### Supabase CLI (opcional)

Para versionar migrations pelo terminal:

```bash
brew install supabase/tap/supabase
supabase login
supabase link --project-ref lykxblszwbaqnifgoeam
supabase db push
```

O app Next.js continua na Vercel; a CLI só ajuda a enviar SQL/migrations.

---

### Custos

- **Supabase Free:** suficiente para MVP (limite de storage e usuários).  
- **Vercel Hobby:** gratuito para projetos pessoais/pequenos times.

<div align="center">

# Enlaçados

**Plataforma acadêmica full-stack para gestão educacional**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![CI](https://img.shields.io/github/actions/workflow/status/ViniciusZanonato/enlacados/ci.yml?style=flat-square&label=CI)](https://github.com/ViniciusZanonato/enlacados/actions)

</div>

---

## Sobre

Enlaçados é uma plataforma educacional completa que conecta alunos, professores e instituições de ensino. Centraliza gestão acadêmica, financeira e documental em portais específicos para cada perfil de usuário.

## Funcionalidades

### Portal do Aluno
- Histórico acadêmico e grade curricular
- Situação financeira e boletos
- Solicitação e download de documentos
- Registro de atividades complementares

### Portal Institucional
- Gestão de alunos (cadastro bulk via CSV/Excel)
- CPA — Comissão Própria de Avaliação com relatórios automáticos
- Exportação de relatórios em PDF e Excel
- Dashboard com métricas em tempo real (Recharts)

### Portal do Professor
- Gestão de turmas e alunos
- Blog acadêmico com editor integrado

### Infraestrutura
- Autenticação JWT via Supabase Auth (email, magic link, OAuth)
- Pagamentos com Stripe (webhooks via Vercel Functions)
- Monitoramento de erros com Sentry
- Testes E2E com Playwright
- CI/CD automático via GitHub Actions → Vercel

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18, TypeScript, Vite |
| UI | Tailwind CSS, shadcn/ui, Radix UI |
| Estado/Dados | TanStack Query, React Hook Form, Zod |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Pagamentos | Stripe |
| Monitoramento | Sentry |
| Testes | Vitest, Playwright |
| Deploy | Vercel, GitHub Actions |

## Estrutura do Projeto

```
src/
├── features/        # Módulos por domínio (auth, aluno, instituição, professor)
├── pages/           # Páginas roteadas
├── components/      # Componentes reutilizáveis
├── lib/             # Clientes e utilitários (Supabase, Stripe, etc.)
├── hooks/           # Custom hooks
└── types/           # Tipos TypeScript globais

api/                 # Vercel Serverless Functions (Stripe webhooks, ingestion)
supabase/            # Migrations e configuração local
tests/               # Testes Playwright E2E
```

## Como Rodar Localmente

**Pré-requisitos:** Node.js 20+, conta Supabase, conta Stripe (opcional)

```bash
# 1. Clone o repositório
git clone https://github.com/ViniciusZanonato/enlacados.git
cd enlacados

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp env.example .env
# Edite .env com suas chaves do Supabase

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

## Scripts

```bash
npm run dev         # Servidor de desenvolvimento
npm run build       # Build de produção
npm run lint        # ESLint
npm run test        # Testes unitários (Vitest)
npx playwright test # Testes E2E
```

## Configuração do Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Copie a URL e a `anon key` para o `.env`
3. Execute as migrations: `npx supabase db push`
4. Configure Auth > URL Configuration com seu domínio

Veja `env.example` para lista completa de variáveis necessárias.

## Deploy

Configurado para deploy automático na Vercel via GitHub Actions.

Configure os secrets no repositório:
- `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET`
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

## Licença

MIT — veja [LICENSE](LICENSE) para detalhes.

---

<div align="center">
  Desenvolvido por <a href="https://github.com/ViniciusZanonato">Vinicius Zanonato</a>
</div>

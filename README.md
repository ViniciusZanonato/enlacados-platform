<div align="center">

# Enlacados

**Full-stack academic platform for educational management**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![CI](https://img.shields.io/github/actions/workflow/status/ViniciusZanonato/enlacados-platform/ci.yml?style=flat-square&label=CI)](https://github.com/ViniciusZanonato/enlacados-platform/actions)

</div>

---

## About

Enlacados is a full-stack educational platform connecting students, teachers, and institutions. It centralizes academic, financial, and document management through role-specific portals.

## Features

### Student Portal
- Academic transcript and course grid
- Financial status and billing
- Document requests and downloads
- Extracurricular activity tracking

### Institutional Portal
- Student management (bulk import via CSV/Excel)
- CPA — Internal Evaluation Committee with automated reports
- PDF and Excel report exports
- Real-time metrics dashboard (Recharts)

### Teacher Portal
- Class and student management
- Integrated academic blog editor

### Infrastructure
- JWT authentication via Supabase Auth (email, magic link, OAuth)
- Stripe payments with webhooks via Vercel Functions
- Error monitoring with Sentry
- End-to-end tests with Playwright
- Automated CI/CD via GitHub Actions → Vercel

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| UI | Tailwind CSS, shadcn/ui, Radix UI |
| State / Data | TanStack Query, React Hook Form, Zod |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Payments | Stripe |
| Monitoring | Sentry |
| Testing | Vitest, Playwright |
| Deploy | Vercel, GitHub Actions |

## Project Structure

```
src/
├── features/        # Domain modules (auth, student, institution, teacher)
├── pages/           # Routed pages
├── components/      # Reusable components
├── lib/             # Clients and utilities (Supabase, Stripe, etc.)
├── hooks/           # Custom hooks
└── types/           # Global TypeScript types

api/                 # Vercel Serverless Functions (Stripe webhooks, ingestion)
supabase/            # Migrations and local config
tests/               # Playwright E2E tests
```

## Running Locally

**Requirements:** Node.js 20+, Supabase account, Stripe account (optional)

```bash
# 1. Clone the repository
git clone https://github.com/ViniciusZanonato/enlacados-platform.git
cd enlacados-platform

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp env.example .env
# Edit .env with your Supabase keys

# 4. Start the development server
npm run dev
```

App available at `http://localhost:5173`.

## Scripts

```bash
npm run dev         # Development server
npm run build       # Production build
npm run lint        # ESLint
npm run test        # Unit tests (Vitest)
npx playwright test # E2E tests
```

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Copy the URL and `anon key` into `.env`
3. Run migrations: `npx supabase db push`
4. Set Auth > URL Configuration to your domain

See `env.example` for the full list of required variables.

## Deployment

Configured for automatic deployment to Vercel via GitHub Actions.

Set the following secrets in your repository:
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

## License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">
  Built by <a href="https://github.com/ViniciusZanonato">Vinicius Zanonato</a>
</div>

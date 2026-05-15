# Arquitetura do Ecossistema Enlaçados

Este documento fornece uma visão panorâmica da estrutura do projeto, mapeando as interconexões entre o frontend, backend serverless, banco de dados e ferramentas de suporte.

## Mapa de Arquitetura (Mermaid)

```mermaid
graph TD
    %% Global Entry Point
    Root[Enlacados Ecosystem] --> App[src/App.tsx]
    Root --> Config[Configuration & DevOps]
    Root --> API[api/ Serverless Functions]
    Root --> DB[supabase/ Database]

    subgraph "Frontend - src/"
        App --> Layouts[layouts/]
        App --> Routes[Role-Based Routing]
        
        subgraph "Layouts"
            Layouts --> MainL[MainLayout.tsx]
            Layouts --> InstitutionalL[InstitutionalLayout.tsx]
            Layouts --> ProfessionalL[ProfessionalLayout.tsx]
        end

        subgraph "Pages (Role-Based)"
            Routes --> PublicP[public/]
            Routes --> AdminP[admin/]
            Routes --> StudentP[student/]
            Routes --> InstitutionP[institution/]
            Routes --> FamilyP[family/]
            Routes --> ProfP[professional/]
            Routes --> SocialP[social/]
            Routes --> AuthP[auth/]
        end

        subgraph "Features (Domain Logic)"
            Feat[features/] --> F_Auth[auth]
            Feat --> F_CPA[cpa]
            Feat --> F_Gamify[gamification]
            Feat --> F_Chat[chat]
            Feat --> F_Portal[portal]
            Feat --> F_Reports[reports]
            Feat --> F_Social[social]
        end

        subgraph "Components (Shared & Role-Specific)"
            Comp[components/] --> C_UI[ui/ shadcn-like]
            Comp --> C_CPA[CPA/ Analytics & AI]
            Comp --> C_Dash[dashboard/]
            Comp --> C_Admin[admin/]
            Comp --> C_Academic[academic/]
            Comp --> C_Portal[portal/]
            Comp --> C_Onboard[onboarding/]
            Comp --> C_ChatUI[chat/]
        end

        subgraph "State & Utils"
            Hooks[hooks/] --> H_Chat[useChat]
            Hooks --> H_CPA[useCPAAnalytics]
            Hooks --> H_Stud[useStudent*]
            
            Lib[lib/] --> L_Supabase[supabase-utils]
            Lib --> L_API[api-client]
            Lib --> L_Obs[observability]
            
            Contexts[contexts/] --> Ctx_Student[StudentContext]
        end
    end

    subgraph "Backend - api/"
        API --> A_CPA[cpa/ analytics.ts, results.ts]
        API --> A_Pay[checkout.ts, plans.ts]
        API --> A_Web[webhooks/ stripe.ts]
        API --> A_Mod[moderation.ts]
    end

    subgraph "Database - supabase/"
        DB --> DB_Func[functions/ Edge Functions]
        DB --> DB_Mig[migrations/ SQL Schemas]
    end

    subgraph "Config & Tooling"
        Config --> Vercel[vercel.json]
        Config --> Tail[tailwind.config.ts]
        Config --> Build[vite.config.ts]
        Config --> Test[playwright.config.ts / vitest.config.ts]
    end

    %% Key Relationships (Simplified)
    F_CPA -.-> A_CPA
    F_Auth -.-> DB
    C_CPA -.-> H_CPA
    H_CPA -.-> A_CPA
    Pages -.-> Comp
    Pages -.-> Feat
```

## Resumo dos Módulos

### 1. Frontend (React + Vite + TypeScript)
- **Role-Based Access Control (RBAC):** Roteamento e layouts diferenciados para perfis Admin, Estudante, Instituição, Família e Profissional.
- **Features:** Módulos de negócio como Gamificação, CPA (Avaliação Própria) e Portal Acadêmico.
- **UI Modular:** Componentes reutilizáveis baseados em padrões modernos (Shadcn/Radix).

### 2. API Serverless (Vercel Functions)
- Processamento de dados sensíveis e integrações externas (Stripe para pagamentos, processamento de analytics para CPA).

### 3. Supabase
- Backend-as-a-Service lidando com autenticação, banco de dados PostgreSQL e funções de borda (Edge Functions).

### 4. Qualidade e Monitoramento
- **Testes:** E2E com Playwright e unitários com Vitest.
- **Observabilidade:** Sentry para erros e Grafana para métricas de sistema.

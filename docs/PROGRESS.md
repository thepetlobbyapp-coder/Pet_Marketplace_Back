# PROGRESS — Pet Marketplace UK

> Arquivo de checkpoint contínuo. Atualizado ao final de cada etapa.
> Fonte oficial do projeto: pasta `docs/`. Agentes oficiais: `.codex/`.

---

## Checkpoint 001 — Plano inicial da Fase 1

- **Data/hora:** 2026-05-16 (Europe/London)
- **Tarefa atual:** Análise da estrutura + plano de execução da Fase 1 (sem implementação)
- **Agentes envolvidos:** C10_Maestro (coordenação), A_Architecture, E_Environment, S_Seguranca, I18N_LocalizationUX

### Resumo do estado atual
- Projeto em Fase 0 concluída (documentação). **Nenhum código escrito.**
- Não é repositório git.
- Estrutura física: `Pet_Marketplace_Back/` e `Pet_Marketplace_Front/`, cada um contendo apenas `.codex/` (24 agentes, idênticos/duplicados).
- `docs/` na raiz com 29 documentos oficiais (00→28).
- Não existem `package.json`, `pnpm-workspace.yaml`, `apps/`, `packages/`, código de backend/mobile/admin.
- `docs/02` §2 define a estrutura oficial como monorepo único: `/apps/{api,mobile,admin}`, `/packages/shared`, `/docs`, `/.codex` — divergente da estrutura física atual.

### Documentos lidos
- `docs/00_INDICE_DOCUMENTACAO.md`
- `docs/01_ESCOPO_CLIENTE_LINGUAGEM_NATURAL.md`
- `docs/02_DOCUMENTACAO_TECNICA_PROJETO.md`
- `docs/03_SPEC_PRODUCT.md`
- `docs/04_SPEC_USER_FLOWS.md`
- `docs/17_DOCS_TRACEABILITY_MAP.md`
- `docs/21_SPEC_TIMELINE_DEPENDENCIES.md`

### Arquivos analisados
- Estrutura de `Pet_Marketplace_Back/.codex/` e `Pet_Marketplace_Front/.codex/` (24 agentes cada, idênticos)
- Listagem completa da raiz e de `docs/`

### Próximos passos
1. Obter decisão sobre topologia do repositório (D-001) e itens D-002 a D-004.
2. Após aprovação, executar **Bloco 0 — Fundação do repositório** (somente estrutura, sem produto).

### Pendências (decisões a registrar)
- **D-001:** Monorepo único na raiz vs. manter split Back/Front. *(bloqueante p/ Bloco 0)*
- **D-002:** Gerenciador de pacotes (recomendado: pnpm workspaces).
- **D-003:** `git init` + Conventional Commits.
- **D-004:** Local canônico de `.codex/` (raiz única).
- **D-005:** Não configurar Vercel/deploy agora (já travado por escopo).
- Produto (não bloqueante Bloco 0): chat em `requested` vs `accepted`; prestador inicia `active` vs `pending_review`.

### Riscos
- `.codex/` duplicado em Back e Front (risco de divergência).
- Ausência de git impede convenção de commits até `git init`.
- Dependências externas Fase 1 pendentes: conta Google Play, nome do app, ícone, URL de política de privacidade, chaves Supabase, chave de geocoding, conta Expo/EAS.

### Comandos executados
- `ls` na raiz, `docs/`, `Pet_Marketplace_Back/.codex`, `Pet_Marketplace_Front/.codex` (somente leitura/inspeção). Nenhuma escrita além deste arquivo.

### Testes rodados
- Nenhum (sem stack criada).

### Erros encontrados
- Nenhum.

### Próximo passo recomendado
Aprovar decisões D-001..D-004 e iniciar **Bloco 0 — Fundação do repositório**.

---

## Checkpoint 002 — Bloco 0: Fundação do repositório

- **Data/hora:** 2026-05-16 (Europe/London)
- **Tarefa atual:** Bloco 0 concluído (esqueleto; sem produto)
- **Agentes envolvidos:** C10_Maestro, A_Architecture, E_Environment, S_Seguranca, I18N_LocalizationUX

### Decisões registradas
- **D-001:** 3 aplicações independentes — Back / Mobile / Admin. Cada pasta autocontida com cópia de `docs/` e `.codex/`.
- **D-002:** pnpm (`packageManager: pnpm@9`).
- **D-003:** git init na raiz + Conventional Commits (`COMMITS.md`, `commitlint.config.js`).
- **D-004:** Canônico na raiz (`docs/`, `.codex/`); apps recebem cópia via `scripts/sync-shared.{sh,ps1}` (`pnpm sync`).
- **D-005:** Sem Vercel/deploy nesta fase (mantido).

### O que foi feito
- `Pet_Marketplace_Front/` renomeada → `Pet_Marketplace_Mobile/`.
- `Pet_Marketplace_Admin/` criada.
- `.codex/` canônico criado na raiz (a partir da cópia de Back); cópias antigas duplicadas nos apps substituídas pela sincronização.
- Fundação criada (esqueleto, sem framework — NestJS/Expo/Next ficam para Blocos 1/3/9).

### Arquivos criados (raiz)
`README.md`, `.gitignore`, `.editorconfig`, `.nvmrc`, `COMMITS.md`, `commitlint.config.js`, `.env.example`, `tsconfig.base.json`, `package.json`, `scripts/sync-shared.sh`, `scripts/sync-shared.ps1`, `.codex/` (canônico).

### Arquivos criados (por app: Back, Mobile, Admin)
`README.md`, `package.json`, `tsconfig.json`, `.env.example`, `src/.gitkeep`, + `docs/` e `.codex/` sincronizados.

### Arquivos alterados
- `docs/PROGRESS.md` (este checkpoint). Nenhum documento spec de `docs/` foi alterado.

### Comandos executados
- `mv Pet_Marketplace_Front Pet_Marketplace_Mobile`
- `mkdir -p Pet_Marketplace_Admin`
- `cp -r Pet_Marketplace_Back/.codex ./.codex`
- `bash scripts/sync-shared.sh`
- `git init` + commit inicial (Conventional Commits)

### Testes rodados
- Nenhum teste automatizado (Bloco 0 não cria stack executável). `typecheck`/`lint` por app são placeholders até Blocos 1/3/9.

### Erros encontrados
- Nenhum.

### Pendências
- Itens externos Fase 1: conta Google Play, nome do app, ícone/logo, URL política de privacidade, chaves Supabase, chave geocoding, conta Expo/EAS.
- Decisões de produto p/ Bloco 6/7: chat em `requested` vs `accepted`; prestador inicia `active` vs `pending_review`.
- Editar `docs/`/`.codex/` **somente na raiz** e rodar `pnpm sync` (risco de divergência se editar nas cópias).

### Próximo passo recomendado
Iniciar **Bloco 1 — Backend base** (NestJS, health check, Supabase, auth, RBAC, erros, logging, módulos) em `Pet_Marketplace_Back/`. Agentes: B_BackendDomain, A_Architecture, S_Seguranca, O_Observability.

---

## Checkpoint 003 — Plano do Bloco 1 (Backend base)

- **Data/hora:** 2026-05-16 (Europe/London)
- **Tarefa atual:** Plano do Bloco 1 produzido e revisado. **Sem implementação.**
- **Agentes envolvidos:** C10_Maestro (orquestra), B_BackendDomain (autor), C_Cetico + V_Agent_ImpactValidator (revisão), S_Seguranca + O_Observability (consultores), PR_PromptOps (prompt cirúrgico)

### Documentos lidos (adicionais)
- `docs/05_SPEC_API.md`, `docs/11_SPEC_PRIVACY_DATA_SAFETY.md`, `.codex/C10_Maestro/C10_Agent_ProjectRules.md`, `.codex/PR_PromptOps/PR_Agent_PromptRefiner_v2.md`

### Resumo
Plano do Bloco 1 cobre: estrutura de módulos (config, common/erros, logging, guards, auth, users, health, audit — esqueleto), dependências, padrão de erro/logging com redaction de PII, Auth Supabase + RBAC pelo backend, validação de env por Zod, rate limit (mecanismo), health check, Swagger. Recorte explícito Bloco 1 vs. blocos 2–10. Demais módulos do `docs/05` ficam `PLANNED` (não roteados, p/ não criar telas/rotas falsas — regra Play Store).

### Decisões registradas
- **D-006:** Supabase Auth emite token; backend valida e é autoridade de RBAC (guards próprios).
- **D-007:** Contrato congelado: base `/api/v1`; envelope de erro `{error:{code,message,details}}`; tabela HTTP `docs/05` §2.
- **D-008:** Logging pino estruturado + redaction de PII desde o Bloco 1.
- **D-009:** Sem chaves Supabase → Auth/DB `BLOCKED`; Bloco 1 prossegue com health/erro/logging/throttler/estrutura.

### Revisão (C_Cetico / V_Agent_ImpactValidator)
- Aprovado **sem bloqueios**, com mitigações: guard degradado (503) sem desabilitar auth; só health/auth/users mínimos expostos; filtro/logging/guards únicos e reutilizáveis; contrato `/api/v1` congelado para não quebrar Mobile/Admin.

### Arquivos criados / alterados
- Criados: nenhum de código (fase de plano). Alterado: `docs/PROGRESS.md` (este checkpoint).

### Comandos executados
- Nenhum comando de build/git nesta etapa (apenas leitura de docs/agentes). `pnpm sync` rodado para propagar este checkpoint.

### Testes rodados
- Nenhum (etapa de planejamento).

### Erros encontrados
- Nenhum.

### Pendências
- `[NECESSÁRIO]` chaves Supabase (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`) para Auth/DB end-to-end.
- Aprovação do usuário para iniciar a **implementação** do Bloco 1.

### Próximo passo recomendado
Com aprovação, executar a implementação do Bloco 1 conforme este plano (escopo: `Pet_Marketplace_Back/`), seguida de `pnpm typecheck/lint/build/test` + smoke `GET /api/v1/health`, e Checkpoint 004.

---

## Checkpoint 004 - Bloco 2: Supabase/PostGIS preparado sem aplicar migrations

- **Data/hora:** 2026-05-18 (America/Sao_Paulo)
- **Tarefa atual:** Preparacao segura do Bloco 2 de banco, sem aplicar alteracoes no Supabase.
- **Agentes envolvidos:** C10_Maestro, B_BackendDomain, S_Seguranca, O_Observability

### Resumo
- Backend publicado no GitHub confirmado em `main`.
- `.env`, `node_modules`, `dist`, `.publish`, `.claude` e `BUG_Debugger` confirmados como ignorados.
- Supabase Auth validado com anon key: endpoints de health/settings responderam `200`.
- `SUPABASE_URL` aponta para `https://oumrtrcqsyugdvildfmr.supabase.co`.
- `SUPABASE_SERVICE_ROLE_KEY` e `DATABASE_URL` seguem ausentes; por isso Postgres/PostGIS real ainda nao foi validado.
- Migrations SQL do Bloco 2 foram preparadas, mas **nao aplicadas**.

### Documentos lidos
- `docs/06_SPEC_DATABASE.md`
- `docs/15_SPEC_MIGRATIONS_ROLLBACK.md`
- `docs/18_SPEC_DATABASE_SQL_DRAFT.md`

### Recorte do Bloco 2 preparado
- Extensoes `postgis` e `pgcrypto`.
- Enums/base types.
- `users`, `user_roles`, `tutor_profiles`, `provider_profiles`, `provider_services`, `pets`, `addresses`, `audit_logs`.
- Localizacao armazenada com PostGIS, protegida por RLS; nenhuma policy publica expoe endereco completo ou coordenadas exatas.
- RLS inicial defensiva para owner/admin.
- Indices basicos, incluindo indice GiST de localizacao.
- Smoke SQL somente leitura para validar extensoes, tabelas, tipos, RLS e policies depois da aplicacao.

### Fora do escopo nesta etapa
- Pagamentos, Stripe, Pix, Wise, escrow, payouts.
- Chat, bookings, availability, reviews, reports/admin completo.
- Seeds com dados de teste.
- Aplicacao de migrations no banco remoto.

### Arquivos criados / alterados
- `Pet_Marketplace_Back/supabase/README.md`
- `Pet_Marketplace_Back/supabase/migrations/20260518_001_enable_extensions.sql`
- `Pet_Marketplace_Back/supabase/migrations/20260518_002_core_profiles_location_audit.sql`
- `Pet_Marketplace_Back/supabase/smoke/20260518_001_block2_readiness.sql`
- `docs/PROGRESS.md`

### Comandos executados
- `git status --short --ignored`
- `git check-ignore -v ...`
- `git ls-remote --heads https://github.com/thepetlobbyapp-coder/Pet_Marketplace_Back.git main`
- Validacao Supabase Auth via `fetch` sem imprimir segredos.
- `rg` para checar ausencia de segredos reais fora de `.env`.

### Testes rodados
- `pnpm typecheck` - passou.
- `pnpm lint` - passou.
- `pnpm build` - passou.
- `pnpm test:e2e` - passou (2 testes).

### Pendencias
- `[NECESSARIO]` preencher `SUPABASE_SERVICE_ROLE_KEY` no `.env` local do backend.
- `[NECESSARIO]` preencher `DATABASE_URL` no `.env` local do backend.
- `[NECESSARIO]` instalar/disponibilizar `psql` ou usar Supabase SQL editor/CLI para aplicar e rodar smoke SQL.
- Revisar e aprovar as migrations antes de aplicar no banco.

### Riscos
- As migrations ainda nao foram executadas contra um Postgres real; podem exigir pequenos ajustes de sintaxe/ambiente ao aplicar.
- RLS inicial e defensiva e pode exigir refinamento quando os fluxos Mobile/Admin forem implementados.
- Sem `DATABASE_URL`, nao ha validacao de PostGIS real nem de schema aplicado.

### Proximo passo recomendado
Fornecer `SUPABASE_SERVICE_ROLE_KEY` e `DATABASE_URL`, revisar as migrations preparadas e, apos confirmacao explicita, aplicar em Supabase e rodar `supabase/smoke/20260518_001_block2_readiness.sql`.

---

## Checkpoint 005 - Bloco 2: migrations aplicadas e validadas

- **Data/hora:** 2026-05-18 (America/Sao_Paulo)
- **Tarefa atual:** Aplicacao controlada das migrations 001/002 no Supabase `thepetlobbyapp-dev/main`.
- **Agentes envolvidos:** C10_Maestro, B_BackendDomain, S_Seguranca, O_Observability

### Resumo
- `SUPABASE_SERVICE_ROLE_KEY` e `DATABASE_URL` foram adicionados ao `.env` local do backend.
- `.env` permanece ignorado pelo Git.
- Migration 001 aplicada via SQL Editor: `postgis` e `pgcrypto`.
- Migration 002 aplicada pelo arquivo local com trava `ALLOW_DB_WRITE=APLICAR_MIGRATION_CONFIRMADO`.
- Smoke read-only confirmou conexao, extensoes, tabelas, RLS e ausencia de grants de escrita para `authenticated`.

### Banco validado
- Extensoes:
  - `pgcrypto` 1.3
  - `postgis` 3.3.7
- Tabelas encontradas:
  - `addresses`
  - `audit_logs`
  - `pets`
  - `provider_profiles`
  - `provider_services`
  - `tutor_profiles`
  - `user_roles`
  - `users`
- RLS habilitado em todas as tabelas acima.
- `authenticatedWriteGrants`: vazio.

### Arquivos criados / alterados nesta etapa
- `Pet_Marketplace_Back/scripts/db/env.mjs`
- `Pet_Marketplace_Back/scripts/db/smoke-readonly.mjs`
- `Pet_Marketplace_Back/scripts/db/run-sql-file.mjs`
- `Pet_Marketplace_Back/package.json`
- `Pet_Marketplace_Back/pnpm-lock.yaml`
- `docs/PROGRESS.md`

### Comandos executados
- `pnpm add -D pg`
- `pnpm db:smoke`
- `$env:ALLOW_DB_WRITE='APLICAR_MIGRATION_CONFIRMADO'; pnpm db:run-sql supabase/migrations/20260518_002_core_profiles_location_audit.sql`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- `pnpm test:e2e`

### Testes rodados
- `pnpm db:smoke` - passou.
- `pnpm typecheck` - passou.
- `pnpm lint` - passou.
- `pnpm build` - passou.
- `pnpm test:e2e` - passou (2 testes).

### Pendencias
- Implementar camada backend que usa o schema real com service role controlada.
- Criar seeds fake/local apenas quando houver decisao sobre dados de teste.
- Definir fluxo de criacao/sincronizacao de `public.users` a partir de `auth.users`.
- Refinar RLS conforme os fluxos Mobile/Admin forem implementados.

### Riscos
- O banco remoto aparece no Supabase como `main`/`PRODUCTION`, mesmo sendo projeto `thepetlobbyapp-dev`; continuar exigindo confirmacao explicita antes de qualquer SQL.
- As policies atuais sao defensivas e privilegiam backend como autoridade; pode ser necessario abrir casos especificos de leitura/escrita com cuidado em blocos futuros.

### Proximo passo recomendado
Iniciar a integracao backend-schema: criar servicos/repositorios para perfis base, sincronizacao de usuario autenticado e smoke e2e com Supabase real, sem expor service role ao cliente.

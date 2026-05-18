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

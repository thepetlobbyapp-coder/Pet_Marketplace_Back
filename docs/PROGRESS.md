# PROGRESS â€” Pet Marketplace UK

> Arquivo de checkpoint contÃ­nuo. Atualizado ao final de cada etapa.
> Fonte oficial do projeto: pasta `docs/`. Agentes oficiais: `.codex/`.

---

## Checkpoint 001 â€” Plano inicial da Fase 1

- **Data/hora:** 2026-05-16 (Europe/London)
- **Tarefa atual:** AnÃ¡lise da estrutura + plano de execuÃ§Ã£o da Fase 1 (sem implementaÃ§Ã£o)
- **Agentes envolvidos:** C10_Maestro (coordenaÃ§Ã£o), A_Architecture, E_Environment, S_Seguranca, I18N_LocalizationUX

### Resumo do estado atual
- Projeto em Fase 0 concluÃ­da (documentaÃ§Ã£o). **Nenhum cÃ³digo escrito.**
- NÃ£o Ã© repositÃ³rio git.
- Estrutura fÃ­sica: `Pet_Marketplace_Back/` e `Pet_Marketplace_Front/`, cada um contendo apenas `.codex/` (24 agentes, idÃªnticos/duplicados).
- `docs/` na raiz com 29 documentos oficiais (00â†’28).
- NÃ£o existem `package.json`, `pnpm-workspace.yaml`, `apps/`, `packages/`, cÃ³digo de backend/mobile/admin.
- `docs/02` Â§2 define a estrutura oficial como monorepo Ãºnico: `/apps/{api,mobile,admin}`, `/packages/shared`, `/docs`, `/.codex` â€” divergente da estrutura fÃ­sica atual.

### Documentos lidos
- `docs/00_INDICE_DOCUMENTACAO.md`
- `docs/01_ESCOPO_CLIENTE_LINGUAGEM_NATURAL.md`
- `docs/02_DOCUMENTACAO_TECNICA_PROJETO.md`
- `docs/03_SPEC_PRODUCT.md`
- `docs/04_SPEC_USER_FLOWS.md`
- `docs/17_DOCS_TRACEABILITY_MAP.md`
- `docs/21_SPEC_TIMELINE_DEPENDENCIES.md`

### Arquivos analisados
- Estrutura de `Pet_Marketplace_Back/.codex/` e `Pet_Marketplace_Front/.codex/` (24 agentes cada, idÃªnticos)
- Listagem completa da raiz e de `docs/`

### PrÃ³ximos passos
1. Obter decisÃ£o sobre topologia do repositÃ³rio (D-001) e itens D-002 a D-004.
2. ApÃ³s aprovaÃ§Ã£o, executar **Bloco 0 â€” FundaÃ§Ã£o do repositÃ³rio** (somente estrutura, sem produto).

### PendÃªncias (decisÃµes a registrar)
- **D-001:** Monorepo Ãºnico na raiz vs. manter split Back/Front. *(bloqueante p/ Bloco 0)*
- **D-002:** Gerenciador de pacotes (recomendado: pnpm workspaces).
- **D-003:** `git init` + Conventional Commits.
- **D-004:** Local canÃ´nico de `.codex/` (raiz Ãºnica).
- **D-005:** NÃ£o configurar Vercel/deploy agora (jÃ¡ travado por escopo).
- Produto (nÃ£o bloqueante Bloco 0): chat em `requested` vs `accepted`; prestador inicia `active` vs `pending_review`.

### Riscos
- `.codex/` duplicado em Back e Front (risco de divergÃªncia).
- AusÃªncia de git impede convenÃ§Ã£o de commits atÃ© `git init`.
- DependÃªncias externas Fase 1 pendentes: conta Google Play, nome do app, Ã­cone, URL de polÃ­tica de privacidade, chaves Supabase, chave de geocoding, conta Expo/EAS.

### Comandos executados
- `ls` na raiz, `docs/`, `Pet_Marketplace_Back/.codex`, `Pet_Marketplace_Front/.codex` (somente leitura/inspeÃ§Ã£o). Nenhuma escrita alÃ©m deste arquivo.

### Testes rodados
- Nenhum (sem stack criada).

### Erros encontrados
- Nenhum.

### PrÃ³ximo passo recomendado
Aprovar decisÃµes D-001..D-004 e iniciar **Bloco 0 â€” FundaÃ§Ã£o do repositÃ³rio**.

---

## Checkpoint 002 â€” Bloco 0: FundaÃ§Ã£o do repositÃ³rio

- **Data/hora:** 2026-05-16 (Europe/London)
- **Tarefa atual:** Bloco 0 concluÃ­do (esqueleto; sem produto)
- **Agentes envolvidos:** C10_Maestro, A_Architecture, E_Environment, S_Seguranca, I18N_LocalizationUX

### DecisÃµes registradas
- **D-001:** 3 aplicaÃ§Ãµes independentes â€” Back / Mobile / Admin. Cada pasta autocontida com cÃ³pia de `docs/` e `.codex/`.
- **D-002:** pnpm (`packageManager: pnpm@9`).
- **D-003:** git init na raiz + Conventional Commits (`COMMITS.md`, `commitlint.config.js`).
- **D-004:** CanÃ´nico na raiz (`docs/`, `.codex/`); apps recebem cÃ³pia via `scripts/sync-shared.{sh,ps1}` (`pnpm sync`).
- **D-005:** Sem Vercel/deploy nesta fase (mantido).

### O que foi feito
- `Pet_Marketplace_Front/` renomeada â†’ `Pet_Marketplace_Mobile/`.
- `Pet_Marketplace_Admin/` criada.
- `.codex/` canÃ´nico criado na raiz (a partir da cÃ³pia de Back); cÃ³pias antigas duplicadas nos apps substituÃ­das pela sincronizaÃ§Ã£o.
- FundaÃ§Ã£o criada (esqueleto, sem framework â€” NestJS/Expo/Next ficam para Blocos 1/3/9).

### Arquivos criados (raiz)
`README.md`, `.gitignore`, `.editorconfig`, `.nvmrc`, `COMMITS.md`, `commitlint.config.js`, `.env.example`, `tsconfig.base.json`, `package.json`, `scripts/sync-shared.sh`, `scripts/sync-shared.ps1`, `.codex/` (canÃ´nico).

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
- Nenhum teste automatizado (Bloco 0 nÃ£o cria stack executÃ¡vel). `typecheck`/`lint` por app sÃ£o placeholders atÃ© Blocos 1/3/9.

### Erros encontrados
- Nenhum.

### PendÃªncias
- Itens externos Fase 1: conta Google Play, nome do app, Ã­cone/logo, URL polÃ­tica de privacidade, chaves Supabase, chave geocoding, conta Expo/EAS.
- DecisÃµes de produto p/ Bloco 6/7: chat em `requested` vs `accepted`; prestador inicia `active` vs `pending_review`.
- Editar `docs/`/`.codex/` **somente na raiz** e rodar `pnpm sync` (risco de divergÃªncia se editar nas cÃ³pias).

### PrÃ³ximo passo recomendado
Iniciar **Bloco 1 â€” Backend base** (NestJS, health check, Supabase, auth, RBAC, erros, logging, mÃ³dulos) em `Pet_Marketplace_Back/`. Agentes: B_BackendDomain, A_Architecture, S_Seguranca, O_Observability.

---

## Checkpoint 003 â€” Plano do Bloco 1 (Backend base)

- **Data/hora:** 2026-05-16 (Europe/London)
- **Tarefa atual:** Plano do Bloco 1 produzido e revisado. **Sem implementaÃ§Ã£o.**
- **Agentes envolvidos:** C10_Maestro (orquestra), B_BackendDomain (autor), C_Cetico + V_Agent_ImpactValidator (revisÃ£o), S_Seguranca + O_Observability (consultores), PR_PromptOps (prompt cirÃºrgico)

### Documentos lidos (adicionais)
- `docs/05_SPEC_API.md`, `docs/11_SPEC_PRIVACY_DATA_SAFETY.md`, `.codex/C10_Maestro/C10_Agent_ProjectRules.md`, `.codex/PR_PromptOps/PR_Agent_PromptRefiner_v2.md`

### Resumo
Plano do Bloco 1 cobre: estrutura de mÃ³dulos (config, common/erros, logging, guards, auth, users, health, audit â€” esqueleto), dependÃªncias, padrÃ£o de erro/logging com redaction de PII, Auth Supabase + RBAC pelo backend, validaÃ§Ã£o de env por Zod, rate limit (mecanismo), health check, Swagger. Recorte explÃ­cito Bloco 1 vs. blocos 2â€“10. Demais mÃ³dulos do `docs/05` ficam `PLANNED` (nÃ£o roteados, p/ nÃ£o criar telas/rotas falsas â€” regra Play Store).

### DecisÃµes registradas
- **D-006:** Supabase Auth emite token; backend valida e Ã© autoridade de RBAC (guards prÃ³prios).
- **D-007:** Contrato congelado: base `/api/v1`; envelope de erro `{error:{code,message,details}}`; tabela HTTP `docs/05` Â§2.
- **D-008:** Logging pino estruturado + redaction de PII desde o Bloco 1.
- **D-009:** Sem chaves Supabase â†’ Auth/DB `BLOCKED`; Bloco 1 prossegue com health/erro/logging/throttler/estrutura.

### RevisÃ£o (C_Cetico / V_Agent_ImpactValidator)
- Aprovado **sem bloqueios**, com mitigaÃ§Ãµes: guard degradado (503) sem desabilitar auth; sÃ³ health/auth/users mÃ­nimos expostos; filtro/logging/guards Ãºnicos e reutilizÃ¡veis; contrato `/api/v1` congelado para nÃ£o quebrar Mobile/Admin.

### Arquivos criados / alterados
- Criados: nenhum de cÃ³digo (fase de plano). Alterado: `docs/PROGRESS.md` (este checkpoint).

### Comandos executados
- Nenhum comando de build/git nesta etapa (apenas leitura de docs/agentes). `pnpm sync` rodado para propagar este checkpoint.

### Testes rodados
- Nenhum (etapa de planejamento).

### Erros encontrados
- Nenhum.

### PendÃªncias
- `[NECESSÃRIO]` chaves Supabase (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`) para Auth/DB end-to-end.
- AprovaÃ§Ã£o do usuÃ¡rio para iniciar a **implementaÃ§Ã£o** do Bloco 1.

### PrÃ³ximo passo recomendado
Com aprovaÃ§Ã£o, executar a implementaÃ§Ã£o do Bloco 1 conforme este plano (escopo: `Pet_Marketplace_Back/`), seguida de `pnpm typecheck/lint/build/test` + smoke `GET /api/v1/health`, e Checkpoint 004.

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

---

## Checkpoint 006 - Bloco 2B: backend integrado ao schema Supabase

- **Data/hora:** 2026-05-18 (America/Sao_Paulo)
- **Tarefa atual:** Integracao real do backend com `public.users`, `public.user_roles` e perfis base seguros.
- **Agentes envolvidos:** C10_Maestro, B_BackendDomain, S_Seguranca, O_Observability

### O que foi implementado
- Criado cliente Supabase service-role server-side, separado do cliente anon usado para validar token.
- `AuthGuard` agora considera auth configurado somente quando anon auth e service-role DB estao disponiveis.
- Ao resolver bearer token valido, o backend sincroniza `auth.users -> public.users` usando `auth.users.id` como `public.users.id`.
- O upsert de `public.users` atualiza identidade basica (`email`, `locale`) sem sobrescrever `status`, evitando reativar conta bloqueada/deletada.
- Roles agora sao lidas de `public.user_roles`, que passa a ser a fonte final de RBAC.
- Quando um usuario sincronizado nao possui roles, o backend cria fallback conservador `tutor` em `public.user_roles`.
- `GET /api/v1/me` passa a retornar status real, locale, roles reais do banco e resumos seguros de `tutor_profiles`/`provider_profiles`.
- `GET /api/v1/me` tambem retorna `createdAt`/`updatedAt` de `public.users` e trata `deleted_at` como status efetivo `deleted`.
- Usuarios com `public.users.status` diferente de `active` sao bloqueados nas rotas privadas.
- Criado smoke opt-in/read-only do Bloco 2B para validar leitura service-role e token opcional sem criar dados; sem `.env`, ele retorna `skipped`.
- `.publish/` foi adicionado ao `.gitignore` local do backend.

### Arquivos criados / alterados
- `src/common/supabase/database.types.ts`
- `src/common/supabase/supabase-admin.service.ts`
- `src/common/auth/auth-user.ts`
- `src/common/auth/supabase.service.ts`
- `src/common/auth/roles.guard.ts`
- `src/common/common.module.ts`
- `scripts/db/smoke-block2b-readonly.mjs`
- `package.json`
- `.gitignore`
- `docs/PROGRESS.md`

### Comandos rodados
- `git status --short`
- `git check-ignore -v .env`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- `pnpm test:e2e`
- `pnpm db:smoke`
- `pnpm db:smoke:block2b`

### Resultado das validacoes
- `pnpm typecheck` - passou.
- `pnpm lint` - passou.
- `pnpm build` - passou.
- `pnpm test:e2e` - passou (2 testes, modo degradado sem Supabase real).
- `pnpm db:smoke` - passou, com PostGIS/pgcrypto, tabelas esperadas, RLS ativo e sem grants de escrita para `authenticated`.
- `pnpm db:smoke:block2b` - passou, read-only; `BLOCK2B_AUTH_ACCESS_TOKEN` nao foi fornecido, entao nao houve validacao de token real nem criacao de dados.

### Pendencias reais
- Validar `GET /api/v1/me` com um access token real de usuario de teste aprovado.
- Se nao existir usuario de teste apropriado, pedir confirmacao antes de criar usuario/role no Supabase.
- Expandir DTOs/contratos formais do Swagger para `/me` quando o contrato publico for congelado para Mobile/Admin.
- Refinar perfis completos e escrita controlada nos blocos futuros.

### Riscos
- Primeiro acesso de usuario real agora cria/atualiza `public.users` e pode criar fallback `tutor`; isso e intencional, mas deve ser observado em teste controlado.
- `public.user_roles` e a fonte final de RBAC; roles em metadata do token deixam de conceder permissao por si so.
- O smoke real de `/me` ainda depende de um token aprovado para evitar criacao nao autorizada de dados reais.

---

## Checkpoint 007 - Bloco 2B: smoke autenticado de `/me`

- **Data/hora:** 2026-05-18 (America/Sao_Paulo)
- **Tarefa atual:** Validacao controlada de `GET /api/v1/me` com usuario real de teste aprovado.
- **Agentes envolvidos:** C10_Maestro, B_BackendDomain, S_Seguranca, O_Observability

### O que foi validado
- `BLOCK2B_AUTH_ACCESS_TOKEN` foi gerado localmente para o usuario de teste `admin@teste.com` sem imprimir o token.
- Antes da chamada autenticada, smoke read-only confirmou token valido, mas sem linha em `public.users` e sem roles em `public.user_roles`.
- Apos confirmacao explicita do usuario, `GET /api/v1/me` foi executado contra backend local.
- `/me` respondeu `200`.
- A chamada criou/sincronizou `public.users` para o usuario Auth de teste.
- A chamada criou a role fallback `tutor` em `public.user_roles`.
- Smoke read-only posterior confirmou `optionalAuthToken: resolved_with_public_user`.

### Arquivos criados / alterados
- `scripts/auth/get-block2b-token.mjs`
- `scripts/db/smoke-me-authenticated.mjs`
- `package.json`
- `docs/PROGRESS.md`
- `.codex/C10_Maestro/C10_LOG.md`

### Comandos rodados
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- `pnpm test:e2e`
- `pnpm db:smoke`
- `pnpm db:smoke:block2b`
- `pnpm db:smoke:me`
- Varredura final de segredos fora de `.env`
- `git status --short`

### Resultado das validacoes
- `pnpm typecheck` - passou.
- `pnpm lint` - passou.
- `pnpm build` - passou.
- `pnpm test:e2e` - passou (2 testes, modo degradado sem Supabase real).
- `pnpm db:smoke` - passou.
- `pnpm db:smoke:block2b` - passou antes e depois da chamada autenticada.
- `pnpm db:smoke:me` - passou; retornou usuario ativo, locale `en-GB`, roles `["tutor"]`, sem perfis base.
- Primeira tentativa de `pnpm db:smoke:me` falhou antes de chamar `/me` porque o build gera `dist/src/main.js`; script foi ajustado para detectar `dist/main.js` ou `dist/src/main.js`.

### Pendencias reais
- Decidir se `admin@teste.com` deve continuar como tutor de teste ou se deve receber role `admin`/outra role por fluxo controlado.
- Criar fluxo formal de seed/test user apenas se aprovado, evitando dados manuais soltos.
- Expandir DTO/Swagger formal de `/me` antes de Mobile/Admin dependerem do contrato.

### Riscos
- O usuario de teste agora existe em `public.users` e tem role `tutor` real no ambiente Supabase dev.
- Access token em `.env` e temporario; pode expirar e precisar ser gerado novamente.
- Qualquer nova chamada com usuario sem role continuara criando fallback `tutor`, por desenho atual do Bloco 2B.

---

## Checkpoint 008 - Contrato seguro de `/me` e e2e mockado

- **Data/hora:** 2026-05-18 (America/Sao_Paulo)
- **Tarefa atual:** Formalizacao do contrato seguro de `GET /api/v1/me` e cobertura e2e sem Supabase real.
- **Agentes envolvidos:** C10_Maestro, B_BackendDomain, S_Seguranca, O_Observability

### O que foi implementado
- Criados DTOs explicitos para o contrato de resposta de `GET /api/v1/me`.
- `UsersController` agora retorna `MeResponseDto` por mapper explicito, evitando vazamento acidental de campos internos.
- Swagger `@ApiOkResponse` de `/me` agora aponta para DTO real.
- Adicionado e2e mockado que substitui apenas `SupabaseService`, mantendo `AuthGuard` e `RolesGuard` reais.
- Testes cobrem retorno seguro de `/me`, bloqueio de usuarios `blocked`/`deleted` e ausencia de campos proibidos como token, phone, address, location e coordinates.
- Smoke autenticado foi ajustado para erro claro de token ausente/invalido/expirado e para informar se criou novos dados no run atual.

### Contrato atual de `GET /api/v1/me`
- `id`
- `email`
- `roles`
- `status`
- `locale`
- `createdAt`
- `updatedAt`
- `profiles.tutor.id`
- `profiles.tutor.displayName`
- `profiles.provider.id`
- `profiles.provider.displayName`
- `profiles.provider.status`
- `profiles.provider.serviceRadiusKm`
- `profiles.provider.ratingAverage`
- `profiles.provider.ratingCount`

### Campos explicitamente fora do contrato
- Tokens, refresh tokens ou secrets.
- Telefone.
- Endereco completo, `line1`, `formattedAddress`.
- Coordenadas, `location`, `lat`, `lng`, `latitude`, `longitude`.
- Campos internos do Supabase.

### Arquivos criados / alterados
- `src/users/dto/me-response.dto.ts`
- `src/users/users.controller.ts`
- `test/me.e2e-spec.ts`
- `scripts/db/smoke-me-authenticated.mjs`
- `docs/PROGRESS.md`

### Comandos rodados
- `git status --short`
- `git check-ignore -v ...`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- `pnpm test:e2e`
- `pnpm db:smoke`
- `pnpm db:smoke:block2b`
- `pnpm db:smoke:me`
- Varredura final de segredos fora de `.env`

### Resultado das validacoes
- `pnpm typecheck` - passou.
- `pnpm lint` - passou.
- `pnpm build` - passou.
- `pnpm test:e2e` - passou (5 testes, sem Supabase real).
- `pnpm db:smoke` - passou.
- `pnpm db:smoke:block2b` - passou, com token opcional resolvido para public user.
- `pnpm db:smoke:me` - passou; `createdNewDataThisRun: false`, sem criar novos dados para o usuario de teste ja sincronizado.

### Pendencias reais
- Decidir se `email` deve permanecer no contrato publico de `/me` para Mobile/Admin ou se deve ser reduzido/mascarado em etapa futura.
- Formalizar DTOs dos proximos endpoints antes de Mobile/Admin dependerem deles.
- Definir fluxo controlado para alterar role de `admin@teste.com`, se ele precisar virar `admin` de fato.

### Riscos
- `email` continua no retorno autenticado de `/me`; e aceitavel para o proprio usuario, mas deve ser preservado como dado pessoal em logs e consumidores.
- O smoke autenticado depende de access token temporario em `.env`; expiracao exigira gerar novo token.
- O workspace segue com muitas mudancas anteriores nao relacionadas e sem stage/commit neste passo.

---

## Checkpoint 009 - Scripts locais de gestao segura de roles

- **Data/hora:** 2026-05-18 (America/Sao_Paulo)
- **Tarefa atual:** Preparacao de ferramenta local dev-only para consultar/aplicar roles sem endpoint publico e sem migration.
- **Agentes envolvidos:** C10_Maestro, B_BackendDomain, S_Seguranca, O_Observability

### O que foi implementado
- Criado script read-only para verificar roles por email de usuario Auth existente.
- Criado script local dev-only para aplicar role em `public.user_roles` com `SUPABASE_SERVICE_ROLE_KEY`.
- Script de escrita exige `ALLOW_ROLE_WRITE=CONFIRMO_ROLE_DEV`.
- Script de escrita aceita somente roles `tutor`, `provider` e `admin`.
- Script de escrita localiza usuario no Supabase Auth por email, garante `public.users` se ausente e recusa adicionar roles para usuario publico bloqueado/deletado.
- Scripts mascaram email/id e nao imprimem tokens/chaves/senhas.
- `package.json` recebeu aliases `auth:roles:check` e `auth:roles:set`.
- E2E de `/me` passou a cobrir multiplas roles no contrato sem Supabase real.

### Validacao com `admin@teste.com`
- Verificacao read-only executada com sucesso.
- Estado observado: `public.users` existe, status `active`, roles `["tutor"]`.
- Role `admin` **nao foi aplicada** porque o usuario ainda precisa confirmar explicitamente a escrita.
- `pnpm db:smoke:me` confirmou `/me` com roles `["tutor"]` e `createdNewDataThisRun: false`.

### Arquivos criados / alterados
- `scripts/auth/check-user-roles.mjs`
- `scripts/auth/set-user-role.mjs`
- `package.json`
- `test/me.e2e-spec.ts`
- `docs/PROGRESS.md`

### Comandos rodados
- `git status --short`
- `git check-ignore -v ...`
- `$env:TARGET_USER_EMAIL='admin@teste.com'; pnpm auth:roles:check`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- `pnpm test:e2e`
- `pnpm db:smoke`
- `pnpm db:smoke:block2b`
- `pnpm db:smoke:me`
- Varredura final de segredos fora de `.env`

### Resultado das validacoes
- `pnpm typecheck` - passou.
- `pnpm lint` - passou.
- `pnpm build` - passou.
- `pnpm test:e2e` - passou (6 testes, sem Supabase real).
- `pnpm db:smoke` - passou.
- `pnpm db:smoke:block2b` - passou.
- `pnpm db:smoke:me` - passou; token valido; sem criacao de novos dados.

### Pendencias reais
- Role `admin` aplicada em `admin@teste.com` apos confirmacao explicita do usuario.
- Verificacao read-only confirmou roles `["tutor", "admin"]`.
- `pnpm db:smoke:me` confirmou que `/me` retorna roles reais `["tutor", "admin"]` e `createdNewDataThisRun: false`.
- Proximo passo: criar endpoints/admin guards reais somente quando o bloco de Admin for iniciado.

### Riscos
- Script `set-user-role` usa service role e deve permanecer restrito ao backend/local, nunca Mobile/Admin.
- `auth.admin.listUsers` varre usuarios Auth paginados para localizar email; adequado para dev, mas nao deve virar fluxo de runtime.
- AdminModule/endpoints admin continuam fora de escopo apesar de o usuario de teste ja possuir role `admin`.

---

## Checkpoint 010 - Validacao atual do Backend e reconciliacao de status

- **Data/hora:** 2026-05-19 (America/Sao_Paulo)
- **Tarefa atual:** Validacao do estado real do Backend e alinhamento com status geral.
- **Agentes envolvidos:** C10_Maestro, V_Validation

### Estado atual assertivo
- Backend segue com Bloco 2B implementado: integracao Supabase service-role server-side, RBAC por `public.user_roles`, contrato seguro de `GET /api/v1/me`, scripts dev-only de roles e smokes read-only.
- Codigo do Backend compila e passa nos testes locais.
- Banco/Supabase read-only respondeu corretamente no smoke de schema.
- Smoke autenticado real nao esta OK no ciclo atual porque `BLOCK2B_AUTH_ACCESS_TOKEN` nao foi resolvido; isso invalida qualquer relatorio que marque `/me` autenticado real como validado hoje.
- DigitalOcean App Platform env vars estao em andamento por outro agente e nao foram validadas por este ciclo.
- Regra local de status em cascata foi adicionada em `.codex/C10_Maestro/C10_Agent_ProjectRules.md` e `.codex/V_Validation/V_Agent_QualitySeal.md`.
- `.codex/C10_Maestro/C10_STATUS.md` foi atualizado de template para status vivo do Backend.

### Comandos executados
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- `pnpm test:e2e`
- `pnpm db:smoke`
- `pnpm db:smoke:block2b`

### Resultado das validacoes
- `pnpm typecheck` - passou.
- `pnpm lint` - passou.
- `pnpm build` - passou.
- `pnpm test:e2e` - passou (2 suites, 6 testes). Observacao: Jest reportou worker forcado a encerrar, indicando possivel teardown pendente, mas os testes passaram.
- `pnpm db:smoke` - passou; confirmou conexao, `pgcrypto`, `postgis`, tabelas esperadas, RLS ativo e nenhum grant de escrita para `authenticated`.
- `pnpm db:smoke:block2b` - falhou: `BLOCK2B_AUTH_ACCESS_TOKEN could not be resolved`.
- `pnpm db:smoke:me` - nao executado nesta cadeia porque o passo anterior falhou.

### Pendencias reais
- Regenerar ou fornecer `BLOCK2B_AUTH_ACCESS_TOKEN` valido para usuario de teste aprovado.
- Reexecutar `pnpm db:smoke:block2b` e `pnpm db:smoke:me` depois do token valido.
- Investigar teardown do Jest se o aviso persistir com `--detectOpenHandles`.
- Revalidar DigitalOcean App Platform env vars quando o outro agente concluir.

### Riscos
- Token autenticado temporario pode expirar entre relatorios; sempre registrar o resultado atual, nao reaproveitar status antigo.
- Scripts com service role continuam restritos ao Backend/local.
- Nao declarar Backend 100% validado para fluxo autenticado real ate o smoke autenticado passar novamente.

### Proximo passo recomendado
Aguardar fechamento das variables no DigitalOcean, renovar token de teste e repetir os smokes autenticados sem imprimir segredo.

---

## Checkpoint 011 - Agente DigitalOceanEnvironment e auditoria inicial DigitalOcean

- **Data/hora:** 2026-05-19 (America/Sao_Paulo)
- **Tarefa atual:** Preparar fluxo seguro para DigitalOcean App Platform env vars do Backend.
- **Agentes envolvidos:** E_Environment, F_AgentForge, C10_Maestro

### Estado atual assertivo
- Criado `E_Environment/E_Agent_DigitalOceanEnvironment.md` para cobrir DigitalOcean App Platform env vars, `PORT`, `APP_URL`, CORS, Supabase e redeploy.
- Catalogo `.codex/AGENTS.md` atualizado com mencao `@ER`.
- Criado `scripts/digitalocean/app-platform-env.ps1` para aplicar variaveis no servico confirmado, lendo `.env` sem imprimir valores.
- CLI DigitalOcean esta instalada e autenticada, mas este diretorio nao esta linkado a projeto DigitalOcean.
- Projetos DigitalOcean visiveis no CLI nao foram confirmados como Pet Marketplace; nao aplicar variaveis sem confirmar app/componente alvo.
- Aplicacao remota de secrets foi bloqueada ate o usuario confirmar projeto, ambiente e servico alvo.

### Variaveis confirmadas para DigitalOcean Backend
- Runtime confirmadas por `src/config/env.schema.ts` e `src/main.ts`: `NODE_ENV`, `API_PORT`, `API_BASE_URL`, `APP_DEFAULT_LOCALE`, `CORS_ALLOWED_ORIGINS`, `SWAGGER_ENABLED`.
- Supabase/DB confirmadas por codigo e scripts: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`.
- Opcional/futura: `GEOCODING_API_KEY`.
- Dev/smoke-only por padrao: `BLOCK2B_AUTH_ACCESS_TOKEN`, `ALLOW_DB_WRITE`, `ALLOW_ROLE_WRITE`, `TARGET_USER_EMAIL`, `TARGET_ROLE`, `BLOCK2B_TEST_EMAIL`, `BLOCK2B_TEST_PASSWORD`.

### Comandos executados
- `digitalocean --version`
- `digitalocean whoami`
- `doctl apps list / doctl apps get`
- `digitalocean list --json`
- `digitalocean service list --project ... --environment production --json`
- `doctl apps spec get / doctl apps get --project ... --service ... --environment production`
- `scripts/digitalocean/app-platform-env.ps1 ... -DryRun`
- Leituras de `.env`, `.env.example`, schema Zod, runtime NestJS e docs oficiais DigitalOcean.

### Resultado das validacoes
- DigitalOcean CLI/API autenticada com sucesso.
- Nenhum projeto DigitalOcean foi linkado ao diretorio local.
- Um servico candidato foi descartado para Pet Marketplace por sinais de outro produto.
- Nao houve escrita de variaveis no DigitalOcean nesta etapa.

### Pendencias reais
- Usuario confirmar o projeto/servico DigitalOcean correto do Pet Marketplace ou criar/linkar o servico backend.
- Definir `CORS_ALLOWED_ORIGINS` com dominios reais de Admin/Frontend web.
- Aplicar variaveis no servico correto usando Raw Editor ou CLI com `--skip-deploys`.
- Fazer redeploy e validar `GET /api/v1/health`.

### Riscos
- Escrever variaveis no servico errado contaminaria outro produto.
- `CORS_ALLOWED_ORIGINS` vazio em production tende a bloquear chamadas web externas.
- O backend atual usa `API_PORT`; em DigitalOcean ele deve acompanhar `PORT`, por exemplo `API_PORT=${{ PORT }}`.

---

## Checkpoint 012 - Registro legado de env vars sanitizado

- **Data/hora:** 2026-05-19 (America/Sao_Paulo)
- **Tarefa atual:** Retificar registro legado e preparar aplicacao real de env vars em DigitalOcean.
- **Agentes envolvidos:** E_Environment, E_DigitalOceanEnvironment

### Estado atual assertivo
- Este checkpoint continha dados de provedor anterior e foi sanitizado apos a decisao de usar DigitalOcean.
- Nao ha app id, component id, conta, deployment id ou dominio real de DigitalOcean confirmado neste registro.
- O alvo atual e DigitalOcean App Platform, mas app, componente, ambiente e dominio publico precisam ser confirmados antes de qualquer escrita remota.
- O dominio temporario documental e `https://pet-marketplace-back.example.ondigitalocean.app`.

### Variaveis esperadas no Backend DigitalOcean
- `NODE_ENV`
- `PORT` / `API_PORT`
- `API_BASE_URL`
- `APP_DEFAULT_LOCALE`
- `CORS_ALLOWED_ORIGINS`
- `SWAGGER_ENABLED`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`

### Variaveis nao aplicadas
- `CORS_ALLOWED_ORIGINS`: precisa incluir origins de desenvolvimento (`http://localhost:8082`, `http://localhost:8081`) e dominios reais quando existirem.
- `GEOCODING_API_KEY`: nao aplicada porque esta vazia no `.env`.
- `BLOCK2B_AUTH_ACCESS_TOKEN` e variaveis de smoke/escrita: mantidas fora de production por serem dev-only.

### Comandos executados
- `doctl auth init`
- `doctl auth init` em terminal interativo
- `doctl apps list / doctl apps get`
- `scripts/digitalocean/app-platform-env.ps1 ...`
- `doctl apps spec get / doctl apps get --json` filtrado para imprimir apenas nomes

### Resultado das validacoes
- DigitalOcean atual ainda precisa de confirmacao de app/componente antes de aplicar variaveis.
- Nenhum valor secreto foi impresso no relatorio.

### Pendencias reais
- Confirmar app/componente/ambiente reais no DigitalOcean App Platform.
- Aplicar variaveis no destino correto sem expor segredos.
- Fazer redeploy e validar `GET /api/v1/health` no dominio real.

---

## Checkpoint 013 - Pausa segura antes de redeploy DigitalOcean

- **Data/hora:** 2026-05-19 (America/Sao_Paulo)
- **Tarefa atual:** Congelar a tarefa de DigitalOcean App Platform env vars sem redeploy.
- **Agentes envolvidos:** E_DigitalOceanEnvironment, C10_Maestro

### Decisao operacional
- A tarefa foi pausada por seguranca a pedido do usuario.
- Nenhum redeploy foi executado neste ciclo.
- Nenhum health check publico foi executado apos variables porque o deploy online ainda nao recebeu redeploy.

### Estado congelado
- CLI DigitalOcean linkada ao projeto/servico corretos.
- Variables principais aplicadas com `--skip-deploys`.
- `CORS_ALLOWED_ORIGINS` segue pendente ate existirem dominios reais de cliente web.
- Proximo ciclo deve comecar por revisar staged changes no painel DigitalOcean antes de qualquer redeploy.

---

## Checkpoint 014 - Registro legado de deploy sanitizado

- **Data/hora:** 2026-05-19 (America/Sao_Paulo)
- **Tarefa atual:** Remover afirmacoes herdadas de deploy anterior e registrar pendencias reais de DigitalOcean.
- **Agentes envolvidos:** C10_Maestro, E_DigitalOceanEnvironment, V_Validation

### Estado atual assertivo
- Registro retificado: as evidencias de projeto/deployment anteriores pertenciam a provedor legado e nao confirmam DigitalOcean atual.
- Alvo DigitalOcean real ainda precisa ser confirmado por app id, componente, ambiente e dominio publico.
- Valor documental temporario: `API_BASE_URL=https://pet-marketplace-back.example.ondigitalocean.app`.
- Codigo corrigido para runtime DigitalOcean Node 20: Supabase client usa transporte WebSocket explicito via `ws`.
- Codigo corrigido para container: Nest escuta em `0.0.0.0`.
- Deploy/health publico em DigitalOcean devem ser revalidados no app real antes de serem declarados prontos.

### Arquivos criados / alterados
- `src/common/supabase/supabase-client-options.ts`
- `src/common/supabase/supabase-admin.service.ts`
- `src/common/auth/supabase.service.ts`
- `src/main.ts`
- `package.json`
- `pnpm-lock.yaml`
- `docs/PROGRESS.md`

### Comandos executados
- `doctl apps list / doctl apps get`
- `doctl apps spec get / doctl apps get --json` filtrado para nomes
- `doctl apps create-deployment --service Pet_Marketplace_Back --environment production --yes --json`
- `doctl apps logs ... --json`
- `doctl apps get / painel Domains --service Pet_Marketplace_Back --environment production --port 8080 --json`
- deploy/redeploy no provedor anterior: registro legado, sem valor de prova para DigitalOcean atual
- Health publico: `GET https://pet-marketplace-back.example.ondigitalocean.app/api/v1/health`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- `pnpm test:e2e`
- `pnpm db:smoke`
- `pnpm db:smoke:block2b`

### Resultado das validacoes
- DigitalOcean atual: pendente de revalidacao no app/componente real.
- Health publico no dominio real: pendente.
- `pnpm typecheck` - passou.
- `pnpm lint` - passou.
- `pnpm build` - passou.
- `pnpm test:e2e` - passou (2 suites, 6 testes).
- `pnpm db:smoke` - passou.
- `pnpm db:smoke:block2b` - falhou: `BLOCK2B_AUTH_ACCESS_TOKEN could not be resolved`.
- `pnpm db:smoke:me` - nao executado porque o token autenticado nao foi resolvido.

### Pendencias reais
- Regenerar ou fornecer `BLOCK2B_AUTH_ACCESS_TOKEN` valido. `BLOCK2B_TEST_EMAIL` e `BLOCK2B_TEST_PASSWORD` nao estao no `.env` local atual.
- Persistir/confirmar este hotfix no repositorio GitHub correto do Backend antes do deploy real em DigitalOcean.
- Definir `CORS_ALLOWED_ORIGINS` quando houver dominio real de Admin/Frontend web.

### Riscos
- Futuro deploy por source GitHub incorreto pode perder o hotfix se ele nao estiver persistido no repositorio correto.
- Smoke autenticado real continua pendente.

### Proximo passo recomendado
Persistir hotfix no repo correto do Backend, renovar token de teste e repetir `pnpm db:smoke:block2b` + `pnpm db:smoke:me`.

---

## Checkpoint 015 - Registro legado de persistencia sanitizado

- **Data/hora:** 2026-05-19 (America/Sao_Paulo)
- **Tarefa atual:** Corrigir linguagem de deploy legado e manter pendencias atuais para DigitalOcean.
- **Agentes envolvidos:** C10_Maestro, E_DigitalOceanEnvironment, V_Validation

### Estado atual assertivo
- Root/local `git remote -v` ainda aponta para `Pet_Marketplace_Mobile.git`, entao nenhum push foi feito por esse remote.
- O repo correto `thepetlobbyapp-coder/Pet_Marketplace_Back.git` foi clonado em copia temporaria limpa.
- Hotfix versionado em `main` com commit `c3fa1d2` (`fix: stabilize digitalocean runtime`).
- Build automatica, deployment id e health publico em DigitalOcean atual seguem pendentes de confirmacao no App Platform.
- O dominio `https://pet-marketplace-back.example.ondigitalocean.app` permanece placeholder documental ate confirmacao do dominio real.

### Arquivos do hotfix versionados
- `package.json`
- `pnpm-lock.yaml`
- `src/main.ts`
- `src/common/auth/supabase.service.ts`
- `src/common/supabase/supabase-admin.service.ts`
- `src/common/supabase/supabase-client-options.ts`

### Comandos executados
- `git status --short`
- `git remote -v`
- `git ls-remote --heads https://github.com/thepetlobbyapp-coder/Pet_Marketplace_Back.git main`
- `git clone https://github.com/thepetlobbyapp-coder/Pet_Marketplace_Back.git ...`
- `git diff --cached --check`
- `git commit -m "fix: stabilize digitalocean runtime"`
- `git push origin main`
- `doctl apps list / doctl apps get`
- Health publico: `GET https://pet-marketplace-back.example.ondigitalocean.app/api/v1/health`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- `pnpm test:e2e`
- `pnpm db:smoke`
- `pnpm db:smoke:block2b`
- `node scripts/auth/get-block2b-token.mjs`

### Resultado das validacoes
- Repo Backend: `main` aponta para `c3fa1d2`.
- DigitalOcean atual: build/deploy/health pendentes de revalidacao no app real.
- `pnpm typecheck` - passou.
- `pnpm lint` - passou.
- `pnpm build` - passou.
- `pnpm test:e2e` - passou (2 suites, 6 testes).
- `pnpm db:smoke` - passou.
- `pnpm db:smoke:block2b` - falhou porque o token atual nao resolve.
- `node scripts/auth/get-block2b-token.mjs` - falhou porque `BLOCK2B_TEST_EMAIL` nao esta preenchido.
- `pnpm db:smoke:me` - nao executado sem token valido.

### Pendencias reais
- Preencher credenciais de teste seguras para regenerar `BLOCK2B_AUTH_ACCESS_TOKEN`.
- Reexecutar `pnpm db:smoke:block2b` e `pnpm db:smoke:me`.
- Definir `CORS_ALLOWED_ORIGINS` quando houver dominio real.
- Opcional: corrigir remote local, que ainda aponta para Mobile.

### Proximo passo recomendado
Fechar token autenticado de teste ou aceitar a pendencia controlada; depois iniciar Bloco 3 Mobile Base.

---

## Checkpoint 016 - Smoke autenticado fechado com novo usuario

- **Data/hora:** 2026-05-19 (America/Sao_Paulo)
- **Tarefa atual:** Validar `GET /api/v1/me` com token local renovado para usuario de teste novo.
- **Agentes envolvidos:** C10_Maestro, V_Validation

### Estado atual assertivo
- O `.env` local recebeu credenciais de teste para `usuario@teste.com`.
- `node scripts/auth/get-block2b-token.mjs` gerou novo `BLOCK2B_AUTH_ACCESS_TOKEN` sem expor o valor.
- `pnpm db:smoke:block2b` passou antes do `/me`, com token valido e ainda sem public user.
- `pnpm db:smoke:me` passou com HTTP `200`.
- A chamada criou/sincronizou `public.users` para o usuario novo e criou fallback role `tutor`.
- Rechecagem final de `pnpm db:smoke:block2b` passou com `optionalAuthToken: resolved_with_public_user`.

### Comandos executados
- `pnpm db:smoke:block2b`
- `pnpm db:smoke:me`
- `pnpm db:smoke:block2b`

### Resultado das validacoes
- Token autenticado: resolvido.
- `/api/v1/me`: HTTP `200`.
- Usuario: `active`, locale `en-GB`, roles `["tutor"]`.
- `syncCreatedPublicUser: true`.
- `fallbackRoleCreated: true`.
- `createdNewDataThisRun: true`.

### Pendencias reais
- `CORS_ALLOWED_ORIGINS` aguarda dominio real.
- Remote Git local ainda aponta para Mobile; nao usar esse remote para push backend.

### Proximo passo recomendado
Iniciar Bloco 3 Mobile Base.

---

## Checkpoint 017 - CORS de desenvolvimento preparado e validado localmente

- **Data/hora:** 2026-05-21 (America/Sao_Paulo)
- **Tarefa atual:** Fechar a pendencia de CORS do Bloco 3 Mobile Auth para `/api/v1/me`.
- **Agentes envolvidos:** C10_Maestro, E_DigitalOceanEnvironment, S_Seguranca, V_Validation

### Resumo
- `main.ts` ja lia `CORS_ALLOWED_ORIGINS`; o problema remoto e que a variavel esta ausente/vazia na DigitalOcean.
- Ajuste pequeno aplicado em `main.ts`: a lista de origins agora remove entradas vazias ao fazer split por virgula.
- `.env.example` do Backend recebeu exemplo explicito de origins para desenvolvimento Mobile Web.
- `.env` local do Backend foi atualizado sem imprimir valores secretos para permitir:
  - `https://pet-marketplace-back.example.ondigitalocean.app`
  - `http://localhost:8082`
  - `http://localhost:8081`
- CORS local foi validado contra o backend em `http://localhost:3000`.
- DigitalOcean ainda nao foi atualizado porque falta confirmar acesso/API token, app alvo, componente e dominio publico real do App Platform antes de qualquer escrita remota.

### Arquivos alterados
- `src/main.ts`
- `.env.example`
- `.env` local ignorado pelo Git
- `docs/PROGRESS.md`

### Resultado das validacoes
- `pnpm typecheck` - passou.
- `pnpm lint` - passou.
- `pnpm build` - passou.
- `pnpm test:e2e` - passou (2 suites, 6 testes).
- Backend local `GET http://localhost:3000/api/v1/health` - HTTP 200.
- Backend local `OPTIONS http://localhost:3000/api/v1/me` com `Origin: http://localhost:8082` - HTTP 204 com `Access-Control-Allow-Origin: http://localhost:8082`.
- Backend local `GET /api/v1/health` com `Origin: http://localhost:8082` - HTTP 200 com `Access-Control-Allow-Origin: http://localhost:8082`.
- DigitalOcean `OPTIONS /api/v1/me` ainda retorna HTTP 204 sem `Access-Control-Allow-Origin`.

### Pendencias reais
- Confirmar acesso DigitalOcean (`doctl auth init` ou `DIGITALOCEAN_TOKEN`) sem imprimir token.
- Aplicar no servico `Pet_Marketplace_Back` em `production`:
  - `CORS_ALLOWED_ORIGINS=https://pet-marketplace-back.example.ondigitalocean.app,http://localhost:8082,http://localhost:8081`
- Redeployar o Backend se a DigitalOcean nao fizer redeploy automatico ao aplicar a variavel.
- Revalidar DigitalOcean `OPTIONS /api/v1/me` com `Origin: http://localhost:8082`.
- Retestar Mobile Web `/profile` contra DigitalOcean depois do CORS remoto.

### Proximo passo recomendado
Confirmar acesso e app/componente na DigitalOcean, aplicar apenas `CORS_ALLOWED_ORIGINS`, redeployar se necessario e repetir a validacao do Profile no Mobile Web.

---

## Checkpoint 018 - Documentacao Backend alinhada para DigitalOcean

- **Data/hora:** 2026-05-21 (America/Sao_Paulo)
- **Tarefa atual:** Alinhar docs do Backend ao alvo atual DigitalOcean App Platform.
- **Agentes envolvidos:** E_DigitalOceanEnvironment, C10_Maestro, V_Validation

### Resumo
- DigitalOcean App Platform e o alvo atual de deploy do Backend.
- Referencias a provedor anterior, dominio antigo e IDs antigos foram removidas ou sanitizadas.
- Registros historicos com dados nao verificaveis foram marcados como legado e nao devem ser usados como prova de app/componente/deploy DigitalOcean.
- `Pet_Marketplace_Back/scripts/digitalocean/README.md` substitui o helper legado e define guardrails para futuros scripts de App Platform.
- O placeholder documental ate confirmacao do dominio real e `https://pet-marketplace-back.example.ondigitalocean.app`.

### Pendencias reais
- Confirmar app id, componente, ambiente e dominio publico reais no DigitalOcean App Platform.
- Aplicar somente env vars necessarias no componente correto, sem imprimir valores secretos.
- Configurar `CORS_ALLOWED_ORIGINS` para `http://localhost:8082`, `http://localhost:8081` e dominios reais.
- Redeployar Backend e validar health publico no dominio real.

### Guardrails
- `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, tokens de smoke, senhas e JWT secrets continuam restritos ao Backend/ambiente seguro.
- O Mobile deve receber apenas variaveis `EXPO_PUBLIC_*`.
- Nenhuma alteracao de banco, migration, RLS ou Bloco 4 foi feita nesta limpeza documental.

---

## Checkpoint 019 - CORS remoto aplicado no Backend DigitalOcean

- **Data/hora:** 2026-05-21 (America/Sao_Paulo)
- **Tarefa atual:** Fechar a pendencia operacional de CORS remoto do Bloco 3 Mobile Auth.
- **Agentes envolvidos:** E_DigitalOceanEnvironment, C10_Maestro, V_Validation

### Resumo
- `doctl` encontrado e autenticacao validada sem imprimir token.
- Contexto DigitalOcean correto: `petmarketplace`.
- App real: `stingray-app` (`b29299e7-2d4b-43f8-b77e-edb52ec405ed`).
- Service Backend real: `pet-marketplace-back`.
- Dominio publico real: `https://stingray-app-vyfrt.ondigitalocean.app`.
- O app `iadesdr-back` de outro contexto foi descartado para este projeto porque `/api/v1/health` retornou 404.
- `CORS_ALLOWED_ORIGINS` estava presente no service, mas sem valor util para `http://localhost:8082`.
- Foi aplicada somente a variavel necessaria: `CORS_ALLOWED_ORIGINS=https://stingray-app-vyfrt.ondigitalocean.app,http://localhost:8082,http://localhost:8081`.
- DigitalOcean gerou novo deploy ativo apos update do App Platform spec.

### Auditoria segura de envs
- `API_BASE_URL`: presente.
- `API_PORT`: presente.
- `PORT`: ausente.
- `CORS_ALLOWED_ORIGINS`: presente e com valor.
- `SUPABASE_URL`: presente.
- `SUPABASE_ANON_KEY`: presente como `SECRET`.
- `SUPABASE_SERVICE_ROLE_KEY`: presente como `SECRET`.
- `DATABASE_URL`: presente como `SECRET`.
- Nenhum valor de secret foi impresso em logs ou docs.

### Resultado das validacoes
- DigitalOcean `GET https://stingray-app-vyfrt.ondigitalocean.app/api/v1/health` - HTTP 200.
- DigitalOcean `OPTIONS https://stingray-app-vyfrt.ondigitalocean.app/api/v1/me` com `Origin: http://localhost:8082` - HTTP 204 e `Access-Control-Allow-Origin: http://localhost:8082`.
- `pnpm typecheck` - passou.
- `pnpm lint` - passou.
- `pnpm build` - passou.
- `pnpm test:e2e` - passou (2 suites, 6 testes).

### Guardrails mantidos
- Banco, migrations, RLS/auth rules e regras de perfil nao foram alterados.
- `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, tokens e senhas continuam fora do Mobile.
- Bloco 4 nao foi iniciado.

### Proximo passo recomendado
Manter monitoramento basico do App Platform apos deploy e iniciar Bloco 4 somente com aprovacao explicita.

---

## Checkpoint 020 - Bloco 4A PATCH /me minimo

- **Data/hora:** 2026-05-22 (America/Sao_Paulo)
- **Tarefa atual:** Implementar contrato minimo de Profile bootstrap pos-auth no Backend.
- **Agentes envolvidos:** B_BackendDomain, S_Seguranca, V_Validation

### Resumo
- Implementado `PATCH /api/v1/me`.
- Payload aceito neste bloco: somente `locale`.
- Validacao manual rejeita corpos nao objeto, `locale` ausente/invalido e qualquer campo fora da allowlist.
- Tentativas de alterar `roles`, `status`, soft-delete, ids, auditoria, perfis tutor/provider ou campos sensiveis retornam `VALIDATION_ERROR`.
- `SupabaseAdminService.updateOwnUser` atualiza somente `public.users.locale` e `updated_at` do proprio usuario autenticado.
- `syncAndLoadAuthUser` deixou de sobrescrever `locale` de usuarios ja existentes em cada login; cria locale padrao somente no primeiro insert.
- `GET /api/v1/me` permanece fonte de verdade para o contrato seguro.

### Arquivos alterados
- `src/users/users.controller.ts`
- `src/users/dto/update-me-request.dto.ts`
- `src/common/supabase/supabase-admin.service.ts`
- `test/me.e2e-spec.ts`
- `docs/PROGRESS.md`

### Resultado das validacoes
- `pnpm typecheck` - passou.
- `pnpm lint` - passou.
- `pnpm build` - passou.
- `pnpm test:e2e` - passou (2 suites, 8 testes).
- Backend local `GET /api/v1/health` - HTTP 200.
- Navegador/Mobile local confirmou `PATCH /api/v1/me` via Profile, persistencia apos reload e restauracao para `locale=en-GB`.

### Guardrails mantidos
- Nenhuma migration, RLS, auth rule ou schema change foi feita.
- Service role segue somente no Backend.
- Nenhum segredo foi impresso ou copiado para Mobile.
- Provider onboarding, tutor profile completo, pets, endereco, booking, chat e pagamentos seguem fora do escopo.

### Pendencias controladas
- O Backend DigitalOcean ainda nao recebeu deploy deste codigo.
- Apos deploy remoto, revalidar `GET /api/v1/health`, `OPTIONS /api/v1/me`, `PATCH /api/v1/me` autenticado e Mobile Web contra o dominio real.

### Proximo passo recomendado
Decidir se este Bloco 4A deve ser deployado agora na DigitalOcean antes de planejar qualquer Bloco 4B.

---

## Checkpoint 021 - Bloco 4A deployado no Backend DigitalOcean

- **Data/hora:** 2026-05-21 23:04 -03:00 (America/Sao_Paulo)
- **Tarefa atual:** Publicar o contrato minimo `PATCH /api/v1/me` no Backend remoto.
- **Agentes envolvidos:** E_DigitalOceanEnvironment, B_BackendDomain, V_Validation

### Resumo
- Contexto `doctl` correto confirmado: `petmarketplace`.
- App real: `stingray-app` (`b29299e7-2d4b-43f8-b77e-edb52ec405ed`).
- Service Backend real: `pet-marketplace-back`.
- Dominio publico real: `https://stingray-app-vyfrt.ondigitalocean.app`.
- Repo fonte do App Platform: `thepetlobbyapp-coder/Pet_Marketplace_Back`, branch `main`, `deploy_on_push=true`.
- Commit publicado: `d794ad5` (`feat: add safe profile locale update`).
- Deployment ativo: `b750d8e8-f253-41c1-a39a-609e1da931ca`, commit `d794ad5221b6abb82b4808695856ee72f62d795c`.

### Resultado das validacoes
- Arvore limpa de publicacao `.publish/Pet_Marketplace_Back_DO_fix`: `pnpm typecheck` - passou.
- Arvore limpa de publicacao `.publish/Pet_Marketplace_Back_DO_fix`: `pnpm lint` - passou.
- Arvore limpa de publicacao `.publish/Pet_Marketplace_Back_DO_fix`: `pnpm build` - passou.
- Arvore limpa de publicacao `.publish/Pet_Marketplace_Back_DO_fix`: `pnpm test:e2e` - passou (2 suites, 8 testes).
- DigitalOcean `GET /api/v1/health` - HTTP 200.
- DigitalOcean `OPTIONS /api/v1/me` com `Origin: http://localhost:8082` e metodo `PATCH` - HTTP 204 e `Access-Control-Allow-Origin: http://localhost:8082`.
- DigitalOcean `GET /api/v1/me` autenticado - HTTP 200, `status=active`, `roles=tutor`, `locale=en-GB`.
- DigitalOcean `PATCH /api/v1/me` autenticado para `locale=en-US` - HTTP 200.
- GET remoto apos PATCH confirmou persistencia temporaria de `locale=en-US`.
- Restauracao remota para `locale=en-GB` - HTTP 200 e GET final confirmou `locale=en-GB`.
- Teste negativo remoto com `roles/status` - HTTP 400 com `VALIDATION_ERROR`.
- Logs do deploy confirmaram `Mapped {/api/v1/me, PATCH} route`.

### Guardrails mantidos
- Nenhuma env var, plano, migration, RLS, auth rule ou schema change foi alterado.
- Nenhum segredo foi impresso.
- Service role segue somente server-side.
- Provider onboarding, tutor profile completo, pets, endereco, booking, chat, upload e pagamentos seguem fora do escopo.

### Pendencias controladas
- Validacao Mobile Web completa no navegador contra o backend remoto nao foi repetida neste ciclo; a validacao remota foi API-level.
- Validar Expo Go/emulador Android e persistencia nativa via `expo-secure-store` quando houver ambiente nativo/adb.

### Proximo passo recomendado
Considerar Bloco 4A fechado em local + DigitalOcean e abrir planejamento do Bloco 4B com recorte pequeno.

---

## Checkpoint 022 - Bloco 4B Pets API do tutor autenticado (Backend)

- **Data/hora:** 2026-05-21 (America/Sao_Paulo)
- **Tarefa atual:** Implementar o CRUD minimo de pets do tutor autenticado no Backend.
- **Agentes envolvidos:** B_BackendDomain, V_Validation

### Resumo
- Novo modulo `PetsModule` com `PetsController` em `/api/v1/pets`.
- Endpoints criados (todos autenticados, sem alterar Mobile/Admin):
  - `GET /api/v1/pets` - lista os pets do tutor autenticado.
  - `POST /api/v1/pets` - cria um pet no `tutor_profile` do usuario.
  - `PATCH /api/v1/pets/:id` - atualiza um pet do proprio tutor.
  - `DELETE /api/v1/pets/:id` - soft delete via `deleted_at`.
- Usa o schema existente `public.pets` (migration `20260518_002`); nenhuma
  migration nova foi criada ou aplicada.
- Toda query e escopada por `tutor_profile_id` e ignora `deleted_at`, de modo
  que um tutor so le/altera os proprios pets.
- DTOs com allowlist estrita: `name`, `species`, `breed`, `size`, `ageRange`,
  `notes`. Qualquer campo fora disso (ex.: `tutorProfileId`, `deletedAt`) e
  rejeitado com `VALIDATION_ERROR` 400.
- Resposta `PetResponseDto` nao expoe `tutor_profile_id`, `deleted_at`, service
  role, tokens, metadata, endereco, localizacao ou telefone.
- Acesso ao banco via service role segue somente server-side, encapsulado em
  `SupabaseAdminService` (`listPets`/`createPet`/`updatePet`/`softDeletePet`).

### Arquivos principais
- `src/pets/pets.module.ts`
- `src/pets/pets.controller.ts`
- `src/pets/dto/pet-fields.ts`
- `src/pets/dto/create-pet-request.dto.ts`
- `src/pets/dto/update-pet-request.dto.ts`
- `src/pets/dto/pet-response.dto.ts`
- `src/common/supabase/supabase-admin.service.ts`
- `src/common/supabase/database.types.ts`
- `src/app.module.ts`
- `test/pets.e2e-spec.ts`
- `docs/PROGRESS.md`

### Resultado das validacoes
- `pnpm typecheck` - passou.
- `pnpm lint` - passou.
- `pnpm build` - passou.
- `pnpm test:e2e` - passou (3 suites, 21 testes).
- Cobertura e2e de pets: owner access (`listPets`/`updatePet`/`softDeletePet`
  escopados ao `tutor_profile_id`), payload invalido (campos obrigatorios
  ausentes, enum invalida, body PATCH vazio, id nao-UUID) e bloqueio de campos
  fora da allowlist em POST e PATCH.

### Guardrails mantidos
- Nenhuma migration criada ou aplicada; nenhum deploy remoto.
- Mobile e Admin nao foram alterados.
- Service role apenas server-side; nenhum segredo impresso.

### Lacuna registrada
- O Backend ainda nao possui endpoint para criar `tutor_profiles`. Um usuario
  recem-criado tem `roles=['tutor']` mas pode nao ter `tutor_profile`. Nesse
  caso `GET /api/v1/pets` responde lista vazia e `POST/PATCH/DELETE` respondem
  `404 NOT_FOUND` ("Authenticated user has no tutor profile."). Criar/gerir
  `tutor_profiles` esta fora do escopo do Bloco 4B; nenhum schema foi inventado.

### Proximo passo recomendado
Decidir se o Bloco 4B deve ser deployado na DigitalOcean e validado contra o
banco real, e se um bloco seguinte deve cobrir a criacao de `tutor_profiles`.

---

## Checkpoint 023 - Bloco 4B deployado no Backend DigitalOcean

- **Data/hora:** 2026-05-22 (America/Sao_Paulo)
- **Tarefa atual:** Publicar e validar a Pets API (Bloco 4B) no Backend remoto.
- **Agentes envolvidos:** E_DigitalOceanEnvironment, B_BackendDomain, V_Validation

### Resumo
- Delta do Bloco 4B aplicado na arvore de publicacao
  `.publish/Pet_Marketplace_Back_DO_fix` (clone de
  `thepetlobbyapp-coder/Pet_Marketplace_Back`, branch `main`).
- Apenas os arquivos do Bloco 4B foram sincronizados (3 modificados + modulo
  `src/pets/` + `test/pets.e2e-spec.ts`); nenhum runtime fix de DO foi tocado.
- Commit publicado: `e9f93f2` (`feat: add tutor pets API (bloco 4B)`).
- Deployment ativo: `23eb0637-0bea-4807-ba87-bc73d66c461c`, App Platform
  `stingray-app`, dominio `https://stingray-app-vyfrt.ondigitalocean.app`.

### Resultado das validacoes
- Arvore de publicacao: `pnpm typecheck` / `pnpm lint` / `pnpm build` - passou.
- Arvore de publicacao: `pnpm test:e2e` - passou (3 suites, 21 testes).
- DigitalOcean `GET /api/v1/health` - HTTP 200.
- Logs do deploy confirmaram `Mapped` das rotas `GET/POST/PATCH/DELETE`
  `/api/v1/pets` e `/api/v1/pets/:id`.
- Remoto `GET /api/v1/pets` autenticado - HTTP 200, corpo `[]`.
- Remoto `GET /api/v1/pets` sem token - HTTP 401 `UNAUTHENTICATED`.
- Remoto `POST/PATCH/DELETE /api/v1/pets` - HTTP 404 `NOT_FOUND` (usuario de
  teste sem `tutor_profile`; comportamento esperado da lacuna do Checkpoint 022).

### Validacao parcial assumida (decisao do usuario)
- O usuario de teste autentica com sucesso mas nao possui `tutor_profile`, logo
  o happy-path remoto de criar/editar/apagar pet e o teste negativo de allowlist
  nao sao alcancaveis (o guard `requireTutorProfile` responde 404 antes).
- Por decisao explicita, nenhum `tutor_profile` foi criado para o teste.
- O happy-path completo `POST/PATCH/DELETE` sera validado contra producao
  depois do Bloco 4C, que deve entregar o bootstrap de `tutor_profile`.

### Guardrails mantidos
- Nenhuma migration aplicada; nenhuma env var, plano, RLS ou auth rule alterada.
- Mobile e Admin nao foram tocados.
- Service role apenas server-side; nenhum segredo impresso.
- A cobertura e2e local (3 suites, 21 testes) ja exercita owner access, payload
  invalido e bloqueio de allowlist com `tutor_profile` mockado.

### Proximo passo recomendado
Executar o Bloco 4C (bootstrap de `tutor_profile` do usuario autenticado) e,
em seguida, completar a validacao remota do happy-path da Pets API.

---

## Checkpoint 024 - Plano Backend 4C Tutor profile minimo

- **Data/hora:** 2026-05-22 11:14 -03:00 (America/Sao_Paulo)
- **Tarefa atual:** Diagnosticar contrato existente para Tutor profile antes de Mobile avancar.
- **Escopo:** leitura de controllers/DTOs/services/tipos, diagnostico remoto sem token e documentacao. Nenhum codigo Backend, migration, RLS, deploy, secret ou dado real foi alterado.

### Diagnostico
- `GET /api/v1/me` ja retorna `profiles.tutor` quando existe `tutor_profiles` para o usuario.
- `PATCH /api/v1/me` continua limitado a `locale`.
- `SupabaseAdminService.loadTutorProfile(userId)` le `id,display_name` de `tutor_profiles`.
- Nao existe controller, DTO ou metodo publico para criar/editar `tutor_profiles`.
- A tabela `tutor_profiles` existe e `user_id` ja e `unique`, portanto o contrato pode ser implementado sem migration nova se o recorte ficar em `display_name`.

### Diagnostico HTTP remoto sem token
- `GET /api/v1/me` -> HTTP 401 `UNAUTHENTICATED`.
- `GET /api/v1/pets` -> HTTP 401 `UNAUTHENTICATED`.
- `GET /api/v1/tutor-profile` -> HTTP 404 `NOT_FOUND`.
- `GET /api/v1/tutor-profiles` -> HTTP 404 `NOT_FOUND`.
- `GET /api/v1/profiles/tutor` -> HTTP 404 `NOT_FOUND`.
- `GET /api/v1/me/tutor-profile` -> HTTP 404 `NOT_FOUND`.

### Contrato proposto
- Criar controller autenticado sob `me/tutor-profile`:
  - `POST /api/v1/me/tutor-profile`: cria tutor profile do usuario autenticado.
  - `PATCH /api/v1/me/tutor-profile`: atualiza tutor profile do usuario autenticado.
- Manter leitura primaria pelo contrato atual:
  - `GET /api/v1/me` deve refletir o tutor profile criado/editado.

### Payload permitido
- `displayName: string`.

### Campos proibidos
- `id`
- `userId` / `user_id`
- `defaultAddressId` / `default_address_id`
- `address`, `location`, `coordinates`
- `phone`, `email`
- `roles`, `status`
- `provider`, `pets`
- `createdAt`, `updatedAt`, `deletedAt`
- `metadata`
- qualquer campo fora da allowlist.

### Validacoes
- Auth obrigatoria via guard atual.
- Usuario precisa estar ativo e nao deletado, conforme fluxo atual de auth.
- Body deve ser objeto JSON.
- Allowlist estrita.
- `POST`: `displayName` obrigatorio; retorna `409` seguro se ja existir tutor profile.
- `PATCH`: pelo menos um campo permitido; retorna `404` seguro se nao existir tutor profile.
- `displayName`: trim, string nao vazia, limite sugerido 80 caracteres.
- Escrita sempre escopada por `CurrentUser.id`; cliente nunca informa `user_id`.
- Resposta segura: `{ id, displayName, createdAt?, updatedAt? }` ou `MeResponseDto`, sem `user_id`, endereco, telefone, roles/status editaveis, tokens ou service role.

### Riscos
- Este bloco desbloqueia o happy-path remoto da Pets API; validar em seguida com usuario de teste aprovado.
- Conflito por `tutor_profiles.user_id unique` deve virar erro de dominio seguro, nao 500.
- Nao misturar default address/geolocalizacao neste bloco.
- Nao misturar provider onboarding neste bloco.

### Testes necessarios
- E2E de create com usuario autenticado sem tutor profile.
- E2E de update com tutor profile existente.
- E2E de `/me` refletindo `profiles.tutor` apos create/update.
- E2E de duplicate create retornando conflito seguro.
- E2E de patch sem perfil retornando 404 seguro.
- E2E de body invalido: vazio, nao objeto, `displayName` vazio/tipo invalido/longo.
- E2E de allowlist rejeitando campos proibidos.
- Assercao de resposta sem `user_id`, endereco, telefone, tokens, service role, roles/status editaveis.

### Checkpoint
- Proximo passo correto e implementar Backend 4C apenas apos aprovacao explicita.
- Mobile nao deve implementar Tutor profile antes deste contrato existir.
- Nenhuma validacao `pnpm` foi rodada porque este checkpoint alterou apenas documentacao.

---

## Checkpoint 025 - Backend 4C Tutor profile minimo implementado

- **Data/hora:** 2026-05-22 11:22 -03:00 (America/Sao_Paulo)
- **Tarefa atual:** Implementar o contrato minimo de `me/tutor-profile`.
- **Escopo:** Backend local e docs. Nenhum deploy, segredo, env privada, migration, RLS, schema, Mobile ou Admin foi alterado.

### Contrato implementado
- `POST /api/v1/me/tutor-profile`
  - Cria `tutor_profiles` para o usuario autenticado quando ainda nao existe.
  - Retorna `409 CONFLICT` seguro se o usuario ja possui tutor profile.
- `PATCH /api/v1/me/tutor-profile`
  - Atualiza `displayName` do tutor profile do usuario autenticado.
  - Retorna `404 NOT_FOUND` seguro se o usuario ainda nao possui tutor profile.
- `GET /api/v1/me`
  - Mantido como fonte de leitura; os testes cobrem que `profiles.tutor` reflete create/update.

### Payload e resposta
- Payload permitido:
  - `displayName`
- Validacoes:
  - body objeto JSON;
  - allowlist estrita;
  - `displayName` string, trim, nao vazio, ate 80 caracteres;
  - body vazio rejeitado no `PATCH`.
- Resposta segura:
  - `id`
  - `displayName`
  - `createdAt`
  - `updatedAt`
- Campos proibidos seguem fora da resposta: `user_id`, endereco/localizacao, telefone, tokens, service role, metadata, roles/status editaveis.

### Implementacao
- Novo DTO/helper manual:
  - `src/users/dto/tutor-profile.dto.ts`
- Rotas adicionadas ao controller existente:
  - `src/users/users.controller.ts`
- Escritas server-side com Supabase service role encapsulada:
  - `SupabaseAdminService.createOwnTutorProfile`
  - `SupabaseAdminService.updateOwnTutorProfile`
- Nao houve migration/schema change porque a tabela `tutor_profiles` e `user_id unique` ja existem.

### Testes adicionados
- Create de tutor profile para usuario sem perfil.
- Update de `displayName` para usuario com perfil.
- `/me` refletindo `profiles.tutor` apos create/update.
- Create duplicado com `409`.
- Patch sem perfil com `404`.
- Bodies invalidos: nao objeto, vazio, `displayName` vazio/tipo invalido/longo.
- Campos fora da allowlist rejeitados.
- Resposta sem campos internos/sensiveis.

### Validacoes
- `pnpm typecheck` - passou.
- `pnpm lint` - passou.
- `pnpm build` - passou.
- `pnpm test:e2e` - passou (3 suites, 32 testes).
- Observacao: os comandos emitiram apenas o aviso de engine local `node v24.12.0` versus `node 22.x` declarado no Backend.

### Guardrails mantidos
- Nenhum token, service role, `DATABASE_URL`, senha ou JWT foi impresso.
- Nenhum deploy foi feito.
- Nenhum dado real foi criado.
- Nenhum escopo de provider, endereco, pets Mobile, booking, chat, upload ou pagamentos foi aberto.

### Proximo passo recomendado
Revisar e aprovar deploy do Backend 4C na DigitalOcean. Depois do deploy, validar remotamente create/update de tutor profile, confirmar `/me` com `profiles.tutor` e completar o happy-path remoto da Pets API.

---

## Checkpoint 026 - Backend 4C publicado na DigitalOcean

- **Data/hora:** 2026-05-22 11:38 -03:00 (America/Sao_Paulo)
- **Tarefa atual:** Publicar o contrato `POST/PATCH /api/v1/me/tutor-profile` no Backend remoto e validar com usuario de teste aprovado.
- **Escopo:** `.publish/Pet_Marketplace_Back_DO_fix`, repo fonte do Backend, DigitalOcean App Platform e smokes HTTP remotos. Nenhum Mobile/Admin/secret/env privada/migration/RLS/schema foi alterado.

### Publicacao
- Repo fonte: `thepetlobbyapp-coder/Pet_Marketplace_Back`, branch `main`.
- Commit publicado: `76d6f75` (`feat: add tutor profile bootstrap API`).
- App Platform: `stingray-app`.
- Service: `pet-marketplace-back`.
- Dominio: `https://stingray-app-vyfrt.ondigitalocean.app`.
- Deploy ativo: `1e0c8309-7f5c-4925-9308-48f97ce9c5a9`.

### Validacoes pre-push
- Arvore de publicacao `pnpm typecheck` - passou.
- Arvore de publicacao `pnpm lint` - passou.
- Arvore de publicacao `pnpm build` - passou.
- Arvore de publicacao `pnpm test:e2e` - passou (3 suites, 32 testes).
- Observacao: aviso nao bloqueante de engine local `node v24.12.0` versus `node 22.x`.

### Validacoes remotas
- `GET /api/v1/health` - HTTP 200, `status=ok`.
- `OPTIONS /api/v1/me/tutor-profile` metodo `POST`, `Origin: http://localhost:8082` - HTTP 204 com CORS ok.
- `OPTIONS /api/v1/me/tutor-profile` metodo `PATCH`, `Origin: http://localhost:8082` - HTTP 204 com CORS ok.
- Token salvo estava expirado; renovacao feita somente em memoria com usuario de teste aprovado, sem imprimir token.
- `GET /api/v1/me` autenticado antes do create - HTTP 200, sem `profiles.tutor`.
- `POST /api/v1/me/tutor-profile` - HTTP 201.
- `GET /api/v1/me` apos create - HTTP 200, com `profiles.tutor`.
- `PATCH /api/v1/me/tutor-profile` temporario - HTTP 200.
- `GET /api/v1/me` apos PATCH - HTTP 200, alteracao refletida.
- Restauracao do displayName de teste criado - HTTP 200.
- `PATCH /api/v1/me/tutor-profile` com campos proibidos (`userId`, `defaultAddressId`, `metadata`) - HTTP 400 `VALIDATION_ERROR`.

### Guardrails
- Nenhum token, senha, service role, `DATABASE_URL` ou JWT foi impresso.
- Nenhuma env privada foi alterada.
- Nenhuma migration/RLS/schema foi criada ou aplicada.
- Nenhum Mobile/Admin foi tocado.
- O unico dado real criado foi o `tutor_profile` do usuario de teste aprovado, necessario para validar o contrato 4C publicado.

### Proximo passo recomendado
Validar o happy-path remoto da Pets API com o usuario de teste agora com `tutor_profile`, sem tocar Mobile. Depois disso, planejar separadamente o menor recorte Mobile que consome o Tutor profile real.

---

## Checkpoint 027 - Pets API happy-path remoto validado

- **Data/hora:** 2026-05-22 11:43 -03:00 (America/Sao_Paulo)
- **Tarefa atual:** Completar a validacao remota da Pets API agora que o usuario de teste possui `tutor_profile`.
- **Escopo:** chamadas HTTP ao Backend DigitalOcean e docs. Nenhum codigo, deploy, env privada, migration, RLS, schema, Mobile ou Admin foi alterado.

### Baseline
- `GET /api/v1/health` - HTTP 200, `status=ok`.
- Token de teste renovado somente em memoria; nenhum token/JWT foi impresso ou salvo.
- `GET /api/v1/me` autenticado - HTTP 200.
- `/me` confirmou usuario `active`, role `tutor` e `profiles.tutor` presente.

### Happy-path validado
- `GET /api/v1/pets` inicial - HTTP 200, `0` pets.
- `POST /api/v1/pets` - HTTP 201, criou pet temporario controlado.
- `GET /api/v1/pets` apos create - HTTP 200, pet criado presente.
- `PATCH /api/v1/pets/:id` - HTTP 200, alteracao de `name` refletida.
- `GET /api/v1/pets` apos patch - HTTP 200, confirmou nome atualizado.
- `DELETE /api/v1/pets/:id` - HTTP 204.
- `GET /api/v1/pets` final - HTTP 200, `0` pets; pet temporario nao aparece.

### Negativos validados
- `PATCH /api/v1/pets/:id` com `deletedAt` - HTTP 400 `VALIDATION_ERROR`.
- `POST /api/v1/pets` com `tutorProfileId` - HTTP 400 `VALIDATION_ERROR`.
- `GET /api/v1/pets` sem token - HTTP 401 `UNAUTHENTICATED`.

### Guardrails
- Nenhum segredo foi impresso.
- IDs foram mascarados no smoke.
- Nenhum dado temporario de pet ficou ativo.
- Nenhum Mobile/Admin foi tocado.
- Nenhuma alteracao de schema/RLS/migration/deploy foi feita.

### Proximo passo recomendado
Com Backend 4B/4C remotos validados, planejar o menor recorte Mobile real: editar Tutor profile `displayName` ou listar/criar pets usando contratos existentes, com decisao explicita antes de implementar.

---

## Checkpoint 028 - Backend 4E endereco/localizacao minima

- **Data/hora:** 2026-05-22 13:31 -03:00 (America/Sao_Paulo)
- **Tarefa atual:** Implementar contrato Backend minimo de enderecos proprios.
- **Escopo:** Backend local e docs de progresso. Mobile/Admin/deploy/secrets/env privada/migrations/RLS/schema/geocoding/Search/Booking/provider onboarding nao foram tocados.

### Contrato implementado
- `GET /api/v1/addresses`
  - Lista enderecos do usuario autenticado.
  - Retorna somente campos seguros.
- `POST /api/v1/addresses`
  - Cria endereco/regiao do proprio usuario.
  - Escrita sempre escopada por `CurrentUser.id`.
  - Suporta `setAsDefaultTutorAddress=true` apenas quando o usuario tem tutor profile.
- `PATCH /api/v1/addresses/:id`
  - Atualiza endereco do proprio usuario.
  - Retorna `404 NOT_FOUND` se o endereco nao existir ou nao pertencer ao usuario.

### Payload permitido
- `label`
- `countryCode`
- `city`
- `postcode`
- `publicAreaLabel`
- `latitude`
- `longitude`
- `locationPrecision`
- `setAsDefaultTutorAddress`

### Guardrails de validacao
- Body precisa ser objeto JSON.
- Allowlist estrita rejeita campos fora do contrato.
- `latitude` e `longitude` sao obrigatorios no `POST` e devem ser atualizados juntos no `PATCH`.
- Coordenadas precisam ser numericas, finitas e dentro do range UK aproximado: latitude `49..61`, longitude `-9..2`.
- `countryCode` aceita apenas `GB`.
- `locationPrecision` aceita apenas `postcode` ou `approximate`; `exact` e rejeitado neste bloco.
- Strings passam por `trim`; limites aplicados: label 60, city 120, postcode 16, publicAreaLabel 160.
- `POST` exige pelo menos um campo legivel entre `postcode`, `city` e `publicAreaLabel`.
- `provider_profiles.base_address_id` nao e tocado.
- `/addresses/geocode` nao foi criado.

### Resposta segura
- Retorna: `id`, `label`, `countryCode`, `city`, `postcode`, `publicAreaLabel`, `locationPrecision`, `isDefaultTutorAddress`, `createdAt`, `updatedAt`.
- Nao retorna: `user_id`, `line1`, `formatted_address`, `location`, coordenadas, `default_address_id`, `base_address_id`, dados de provider, telefone/e-mail, tokens/secrets ou metadata.

### Implementacao
- Criado `AddressesModule`.
- Criado `AddressesController`.
- Criados DTOs/helpers de create, update, response e campos.
- `database.types.ts` recebeu a tabela `addresses` e enum `location_precision`.
- `SupabaseAdminService` recebeu list/create/update de enderecos proprios.
- Persistencia de `location` usa EWKT `SRID=4326;POINT(lng lat)` para preencher a coluna PostGIS existente sem migration nova.

### Arquivos alterados
- `Pet_Marketplace_Back/src/app.module.ts`
- `Pet_Marketplace_Back/src/addresses/addresses.module.ts`
- `Pet_Marketplace_Back/src/addresses/addresses.controller.ts`
- `Pet_Marketplace_Back/src/addresses/dto/address-fields.ts`
- `Pet_Marketplace_Back/src/addresses/dto/address-response.dto.ts`
- `Pet_Marketplace_Back/src/addresses/dto/create-address-request.dto.ts`
- `Pet_Marketplace_Back/src/addresses/dto/update-address-request.dto.ts`
- `Pet_Marketplace_Back/src/common/supabase/database.types.ts`
- `Pet_Marketplace_Back/src/common/supabase/supabase-admin.service.ts`
- `Pet_Marketplace_Back/test/addresses.e2e-spec.ts`
- `Pet_Marketplace_Back/docs/PROGRESS.md`
- `docs/PROGRESS.md`

### Validacoes
- Backend `pnpm typecheck` - passou.
- Backend `pnpm lint` - passou.
- Backend `pnpm build` - passou.
- Backend `pnpm test:e2e` - passou (4 suites, 48 testes).
- Observacao: os comandos emitiram apenas o aviso de engine local `node v24.12.0` versus `node 22.x` declarado no Backend.

### Diagnostico remoto seguro
- Sem deploy neste ciclo.
- `GET /api/v1/addresses` sem token no Backend remoto atual ainda retorna HTTP 404, como esperado antes da publicacao.
- Nenhum token, senha, JWT, email completo, Authorization header, service role, `DATABASE_URL` ou secret foi impresso.

### Proximo passo recomendado
Revisar diff e, se aprovado, publicar o Backend 4E na DigitalOcean. Apos deploy, validar remotamente que `/api/v1/addresses` passa de 404 para 401 sem token e executar smoke autenticado controlado de create/list/patch, removendo qualquer dado temporario manualmente se necessario.

---

## Checkpoint 029 - Validacao pre-deploy Backend 4E

- **Data/hora:** 2026-05-22 13:42 -03:00 (America/Sao_Paulo)
- **Tarefa atual:** Validar impacto, seguranca, performance e plano de publicacao do Backend 4E antes de deploy.
- **Escopo:** leitura de diff/codigo/testes/docs, validacoes locais, probe remoto sem token e query read-only de PostGIS. Nenhum deploy, Mobile, Admin, secret/env privada, migration/RLS/schema, geocoding, Search, Booking ou provider onboarding foi alterado.

### Veredito
- Resultado: **APROVADO PARA DEPLOY**, com smoke remoto autenticado obrigatorio apos publicacao.
- Nenhum bloqueio pre-deploy foi encontrado.

### Validacao por camadas
- Contrato/API: `GET/POST/PATCH /api/v1/addresses` e aditivo; nao quebra `/me`, `/pets` ou `/me/tutor-profile`.
- Interface interna: segue padrao local de controllers, DTOs manuais, `DomainException`, `ErrorCode`, `SupabaseAdminService` e e2e.
- Banco/schema: usa tabela `addresses` existente; sem migration. `location` e preenchida por EWKT e uma query read-only confirmou cast PostGIS OK.
- Mobile/consumidores: nenhum consumidor Mobile existe ainda; Mobile/Admin seguem intocados.
- Seguranca: auth global obrigatoria; usuario `blocked/deleted` segue bloqueado; escrita/leitura escopada por `CurrentUser.id`; resposta nao expoe coordenadas, PostGIS raw, endereco completo, `user_id`, telefone/e-mail, provider data ou secrets.
- Performance: queries por `addresses.user_id` usam indice existente; `addresses_location_gix` segue reservado para Search futura; sem N+1 relevante. Sem paginacao aprovado neste recorte por baixo volume esperado de enderecos proprios.
- Observabilidade: logs registram apenas codigo de erro Supabase e mensagem generica, sem payload/PII.

### Validacoes executadas
- Backend `pnpm typecheck` - passou.
- Backend `pnpm lint` - passou.
- Backend `pnpm build` - passou.
- Backend `pnpm test:e2e` - passou (4 suites, 48 testes).
- Read-only PostGIS: cast `SRID=4326;POINT(lng lat)` para `geography` retornou OK.
- Probe remoto sem token: `GET /api/v1/addresses` ainda retorna HTTP 404 antes do deploy, esperado.
- Observacao: comandos locais emitiram apenas o aviso conhecido de engine `node v24.12.0` versus `node 22.x`.

### Plano de deploy recomendado
1. Revisar diff final do Backend 4E.
2. Preparar arvore de publicacao usada nos ciclos anteriores.
3. Rodar na arvore de publicacao: `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm test:e2e`.
4. Publicar somente apos aprovacao explicita do usuario.
5. Validar remoto sem token:
   - `GET /api/v1/addresses` deve passar de HTTP 404 para HTTP 401.
6. Validar CORS/preflight se o proximo ciclo for Mobile.
7. Smoke autenticado controlado:
   - `GET /addresses`
   - `POST /addresses` com endereco temporario aproximado
   - `PATCH /addresses/:id`
   - `GET /addresses` final confirmando resposta segura
   - limpar/remover dado temporario manualmente se necessario, ja que nao ha DELETE publico neste contrato.

### Rollback
- Reverter deploy do Backend para o commit anterior publicado.
- Nao ha rollback de banco porque nao houve migration/schema/RLS.
- Caso algum endereco temporario seja criado no smoke, remover manualmente via caminho administrativo seguro, sem imprimir dados sensiveis.

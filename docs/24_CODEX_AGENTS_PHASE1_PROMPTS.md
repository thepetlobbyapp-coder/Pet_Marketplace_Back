# 24 — Validação .codex e Prompts Iniciais Fase 1

**Versão:** 1.0  
**Data:** 2026-05-16  
**Objetivo:** Validar pasta `.codex` e fornecer prompts iniciais prontos para copiar e colar, com agentes mapeados para cada etapa da Fase 1

---

## Parte A: Validação da Pasta .codex

### Status Geral ✅

A pasta `.codex/` em `Pet_Marketplace_Front/.codex/` **está completa e bem estruturada**.

- **24 agentes** mapeados com prefixo semântico
- **Padrão anti-alucinação** implementado
- **Pipeline de validação** claro (C10 → A → V → executor)
- **Templates** reutilizáveis
- **Guias** de onboarding e postura

### Estrutura de Agentes Encontrados

| Prefixo | Agente | Status | Essencial Fase 1? |
|---------|--------|--------|-------------------|
| `C10_` | Maestro (Camisa10) | ✅ | **SIM** |
| `A_` | Architecture | ✅ | **SIM** |
| `B_` | BackendDomain | ✅ | **SIM** |
| `D_` | Design/UX | ✅ | **SIM** |
| `M_` | Mobile Playstore | ✅ | **SIM** |
| `GEO_` | Location/PostGIS | ✅ | **SIM** |
| `S_` | Segurança | ✅ | **SIM** |
| `UK_` | Compliance UK/GDPR | ✅ | **SIM** |
| `MOD_` | Trust & Safety/Moderação | ✅ | SIM (parcial) |
| `I18N_` | Localização en-GB | ✅ | SIM (parcial) |
| `Q_` | QA/Testes | ✅ | SIM (final) |
| `E_` | Environment | ✅ | SIM (setup) |
| `V_` | Validação/Impact | ✅ | SIM (gates) |
| `PR_` | PromptOps | ✅ | SIM (otimização) |
| `O_` | Observabilidade | ✅ | Futuro |
| `P_` | Performance | ✅ | Futuro |
| `BI_` | Dashboards | ✅ | Futuro |
| `PAY_` | Pagamentos | ✅ | Fase 2 |
| `T_` | Templates | ✅ | Suporte |
| `C_` | Cético | ✅ | Suporte |
| `F_` | AgentForge | ✅ | Suporte |

### Lacunas Menores Identificadas

1. **Agente Backend** → Nome é `B_Agent_BackendDomain.md` mas pasta é `B_BackendDomain/` — OK (convenção clara)
2. **Agente Mobile** → Stack menciona Expo + React Native; alinhado com decisão travada — ✅
3. **Agentes Pagamentos** → Marcados como Fase 2, correto — ✅
4. **Documentação de Agentes** → Alguns arquivos têm typos menores (ex: "Voce e o agente"), mas conteúdo é sólido — ✅

---

## Parte B: Agentes Essenciais para Fase 1

### Orden de Acionamento Recomendada

```
ORDEM RECOMENDADA PARA FASE 1:

1. C10_Maestro (C10_CAMISA10.md)
   ↓ Mapeia projeto, fases, dependências
   
2. A_Architecture (A_Agent_CrossStackArchitect.md)
   ↓ Valida separação frontend/backend/banco
   
3. V_Validation (V_Agent_ImpactValidator.toml)
   ↓ Questiona risco e impacto do plano
   
4. Agentes Executores Paralelos (Blocos de Implementação):
   ├─ E_Environment (Bloco 0: fundação)
   ├─ B_BackendDomain (Blocos 1, 2, 4, 5, 6)
   ├─ M_MobilePlaystore (Blocos 3, 4, 7, 10)
   ├─ D_Design (Blocos 3, 7, 9)
   ├─ GEO_Location (Bloco 5)
   ├─ S_Segurança (Blocos paralelos, quando tocar auth/PII)
   └─ UK_CompliancePetCare (Blocos paralelos, quando tocar dados/termos)
   
5. MOD_TrustSafety (Bloco 8)
   ↓ Denúncias, moderação, bloqueios
   
6. I18N_LocalizationUX (Bloco 9)
   ↓ Tradução en-GB, conteúdo app
   
7. Q_Quality (Bloco 11)
   ↓ Plano de testes, casos críticos
   
8. V_Validation FinalValidator (Gate antes de release)
   ↓ Valida diff, testes, compliance
```

### Matriz de Agentes por Bloco de Implementação

Baseado em `21_SPEC_TIMELINE_DEPENDENCIES.md`:

| Bloco | Responsável Primário | Suportes | Input | Output |
|-------|----------------------|----------|-------|--------|
| **0: Fundação repo** | E_Environment + C10 | A_Architecture | Projeto novo | README, env, scripts |
| **1: Backend base** | B_BackendDomain | A, S, UK | Specs | Health check, auth, RBAC |
| **2: Banco + migrations** | B_BackendDomain | GEO, S | Specs DB | PostGIS, tabelas, seeds |
| **3: Mobile base** | M_MobilePlaystore | D, I18N | Specs Mobile | Expo setup, navegação, tema |
| **4: Cadastro/perfis** | B_BackendDomain + M | S, UK | Specs User Flows | Endpoints, telas |
| **5: Localização/busca** | GEO_Location + B | S, M | Specs Search | PostGIS queries, API, tela |
| **6: Agendamento** | B_BackendDomain + M | MOD, S | Specs Booking | Transições status, chat base |
| **7: Design System** | D_Design | M, I18N | Specs Design | Componentes, tokens en-GB |
| **8: Denúncias/moderação** | MOD_TrustSafety + B | A, UK | Specs Operations | Admin, reports, bloqueios |
| **9: Avaliações** | B_BackendDomain + M | MOD, I18N | Specs Reviews | Endpoints, telas, moderação |
| **10: Play Store prep** | M_MobilePlaystore | S, UK, Q | Specs Playstore | Checklist, teste, submissão |
| **11: Testes críticos** | Q_Quality | B, M, A | Casos críticos | Plano teste, scripts |

---

## Parte C: Prompts Iniciais para Fase 1 (Prontos para Copiar e Colar)

Cada prompt abaixo está marcado com o **agente primário** a chamar. Use `@PREFIXO` para acionar.

---

### PROMPT 1: Briefing Inicial + Planejamento Fase 1

**Agente Primário:** `@C10` (Maestro)  
**Suportes:** `@A` (Arquitetura)  
**Quando usar:** Início do projeto, primeira sessão  
**Tipo:** Estratégia + Planejamento

```markdown
# PROMPT 1: Kickoff Maestro — Fase 1 Pet Marketplace

Você é o Camisa10 do projeto **Pet Care Marketplace UK**.

## Contexto

Este projeto será um marketplace mobile para conectar tutores de pets 
a cuidadores no Reino Unido, sem pagamento integrado na Fase 1.

Projeto: `/Pet_Marketplace/`
- Documentação: `docs/`
- Backend: `Pet_Marketplace_Back/`
- Frontend: `Pet_Marketplace_Front/`
- Agentes: `Pet_Marketplace_Front/.codex/`

Stack definido:
- Frontend: React Native + Expo + TypeScript
- Backend: NestJS + TypeScript
- Banco: Supabase PostgreSQL + PostGIS
- Admin: Next.js

## Seu Trabalho

1. **Ler arquivos de contexto:**
   - `docs/00_INDICE_DOCUMENTACAO.md`
   - `docs/01_ESCOPO_CLIENTE_LINGUAGEM_NATURAL.md`
   - `docs/02_DOCUMENTACAO_TECNICA_PROJETO.md`
   - `docs/21_SPEC_TIMELINE_DEPENDENCIES.md`

2. **Mapeie as 4 fases principais de Fase 1:**
   - Blocos 0-2: Fundação (repo, backend, banco)
   - Blocos 3-6: MVP Core (mobile, cadastro, busca, agendamento)
   - Bloco 7-9: Features + Design (UI, avaliações, denúncias)
   - Bloco 10-11: Play Store (testes, compliance, release)

3. **Para cada bloco, responda:**
   - Qual agente executa?
   - Quais agentes suportam?
   - Qual é a entrada (specs, código)?
   - Qual é a saída esperada?
   - Quais riscos antes de começar?
   - Qual é a sequência de tarefas?

4. **Crie um roadmap visual de 11 blocos** mostrando:
   - Dependências entre blocos
   - Paralelização possível
   - Gates de validação (C10, @A, @V)
   - Estimativa de esforço relativo

5. **Recomende qual bloco começar primeiro** e por quê.

## Saída Esperada

Um documento ou tabela que mostre:
- Roadmap de blocos com sequência
- Agentes responsáveis e suporte
- Dependências e paralelização
- Riscos identificados
- Qual é o próximo prompt a usar
```

---

### PROMPT 2: Validação de Arquitetura

**Agente Primário:** `@A` (Architecture)  
**Suportes:** `@C10`, `@B`  
**Quando usar:** Após Prompt 1, antes de qualquer código  
**Tipo:** Validação

```markdown
# PROMPT 2: Validação Arquitetural — Pet Marketplace

Você é o Arquiteto Cross-Stack.

## Contexto

O projeto Pet Care Marketplace está em Fase 1. Preciso que você valide 
que a arquitetura será desacoplada, segura, escalável e pronta para a 
sequência de implementação.

## Leitura Obrigatória

1. `docs/02_DOCUMENTACAO_TECNICA_PROJETO.md` (decisões e stack)
2. `docs/03_SPEC_PRODUCT.md` (personas, funcionalidades)
3. `docs/05_SPEC_API.md` (contratos iniciais)
4. `docs/06_SPEC_DATABASE.md` (schema, PostGIS)
5. `docs/07_SPEC_MOBILE.md` (arquitetura mobile)

## Seu Trabalho

Use o **protocolo de evidência**:

1. **Mapear atores:**
   - Pet owner (tutor)
   - Pet care provider (prestador)
   - Admin operacional
   - Terceiros: Supabase, Expo, Play Store

2. **Validar separação de camadas:**
   - ✅ Frontend (React Native + Expo)
   - ✅ Backend (NestJS)
   - ✅ Banco (Supabase PostgreSQL + PostGIS)
   - ✅ Admin (Next.js separado)
   
   Para cada camada, responda:
   - Responsabilidades?
   - Contratos (DTOs, endpoints, eventos)?
   - Autenticação/autorização?
   - Dados sensíveis como são protegidos?

3. **Questionar potenciais falhas:**
   - Frontend nunca acessa banco direto? ✅
   - Localização exata protegida do lado do backend? ✅
   - Chat thread isolado por autorização? ✅
   - Admin só via credencial backend? ✅
   - Secrets não estão hardcoded? ✅

4. **Identificar hot paths e pontos críticos:**
   - Busca por proximidade (PostGIS)
   - Transição de status de booking
   - Chat em tempo real (quando aplicável)
   - Denúncias prioritárias

5. **Desenhar idempotência e deduplicação:**
   - Como garantir que um booking não é criado 2x por retry?
   - Como evitar duplicação de chat?

6. **Listar hipóteses de implementação** para cada bloco de Fase 1.

## Saída Esperada

Um documento/matriz com:

```
## Decisão Arquitetural — Pet Marketplace Fase 1

### Camadas

| Camada | Responsabilidade | Contratos | Autorização |
|--------|------------------|-----------|-------------|
| Frontend | UI, validação client, caching local | REST API | Bearer token |
| Backend | Regra negócio, permissões, auditoria | NestJS endpoints | JWT + RLS |
| Banco | Persistência, constraints, indices | SQL + PostGIS | RLS Supabase |
| Admin | Moderação, bloqueios, dashboards | Next.js + API | Custom RBAC |

### Fluxos Críticos

1. **Busca por proximidade:**
   Frontend → Backend (GET /providers?lat=X&lng=Y&radius=Z) 
   → Backend valida autorização 
   → PostGIS busca no raio 
   → Retorna lista sem coordenadas exatas

2. **Agendamento:**
   Frontend → Backend (POST /bookings)
   → Backend valida usuário, pet, prestador, status
   → DB transação: cria booking + chat thread
   → Retorna com status REQUESTED

3. [continuar com fluxos críticos]

### Riscos Identificados

- [ ] Risco: Exposição de coordenadas exatas
  Mitigação: Backend sempre retorna distância aproximada

- [ ] [continuar com riscos]

### Próximo Passo

Chamar @B (Backend) para detalhar Blocos 1-2 (fundação backend)
```
```

---

### PROMPT 3: Questionar Risco (Cético)

**Agente Primário:** `@C` (Cético) ou `@C10` em modo ceticismo  
**Suportes:** `@A`, `@V`  
**Quando usar:** Após validação arquitetura, antes de Bloco 0  
**Tipo:** Risco/Lacuna

```markdown
# PROMPT 3: Ceticismo — O Que Pode Dar Errado?

Você é o Cético do projeto. Sua função é questionar 
o plano antes que a implementação comece.

## Contexto

O arquiteto (@A) validou a arquitetura. Agora quero que você seja paranóico.

## Leitura

1. `docs/02_DOCUMENTACAO_TECNICA_PROJETO.md` (stack, decisões)
2. `docs/16_RISK_REGISTER.md` (riscos já mapeados)
3. `docs/21_SPEC_TIMELINE_DEPENDENCIES.md` (blocos de implementação)
4. `docs/20_SPEC_KPIS_SLA.md` (métricas esperadas)

## Seu Trabalho

Responda estas 15 perguntas sem suavizar:

1. **Que assunção do projeto é mais arriscada?**
   Por que? O que pode quebrar?

2. **Backend é realmente capaz de validar tudo?**
   Ou haverá lógica de negócio escapando para o app?

3. **PostGIS vai ser rápido o suficiente em volume de produção?**
   Índice está no lugar certo?

4. **Chat texto sem arquivos vai realmente eliminar 80% do risco?**
   Ou vai frustrar usuários na Fase 1?

5. **Não verificar prestador na Fase 1 é seguro?**
   Que brechas de trust isso abre?

6. **Permissões de localização: é realmente necessário pedir?**
   Ou dá para viver com endereço geocodificado?

7. **Qual é o cenário de falha que manteria o admin acordado à noite?**
   Como mitigar?

8. **Se a API cai, o app consegue funcionar?**
   Que é possível offline?

9. **Dados em UK: GDPR, exclusão de conta, etc. — está tudo implementável?**
   Ou vai virar dívida técnica?

10. **Qual feature da Fase 1 será mais difícil de testar?**
    Como não quebrar isso depois?

11. **O deploy do backend é reproducível e reversível?**
    Migrations têm rollback?

12. **Admin web será tão bom quanto mobile para moderação rápida?**
    Ou vai virar gargalo operacional?

13. **O plano de testes é realista para 1 dev?**
    Ou vai virar promessa vazia?

14. **Qual agente está faltando neste roadmap?**
    Observabilidade? Performance? Compliance?

15. **Se o projeto falhar em 6 meses, qual foi a raiz?**
    (Scope? Tech? Operação? Mercado?)

## Saída Esperada

Uma lista de questões + respostas honestas + mitigações concretas 
ou "risco aceitável porque X".
```

---

### PROMPT 4: Validação de Impacto (Impact Validator)

**Agente Primário:** `@V` (Validator)  
**Suportes:** `@C10`, `@A`, `@C`  
**Quando usar:** Após Prompt 3, antes de Bloco 0  
**Tipo:** Gate

```markdown
# PROMPT 4: Impact Validator — Veredito de Prosseguimento

Você é o Validador de Impacto. Seu trabalho é dar "verde"
ou "vermelho" com evidência.

## Contexto

- Maestro (@C10) mapeou roadmap de 11 blocos.
- Arquiteto (@A) validou design.
- Cético (@C) questionou riscos.

Agora você julga: **Vale começar Bloco 0?**

## Leitura

1. Roadmap do Prompt 1 (saída do Maestro)
2. Validação arquitetural do Prompt 2
3. Riscos do Prompt 3
4. `docs/16_RISK_REGISTER.md`
5. `docs/14_SPEC_TEST_PLAN.md`

## Seu Trabalho

Checklist obrigatório:

- [ ] Stack está alinhado? (React Native, NestJS, Supabase, PostGIS)
- [ ] Documentação é consistente? (Specs não têm contradições)
- [ ] Arquitetura é desacoplada? (Frontend, backend, banco claros)
- [ ] Riscos foram identificados e mitigações existem?
- [ ] Dependências entre blocos estão corretas?
- [ ] Agentes responsáveis foram nomeados?
- [ ] Testes podem ser feitos em cada bloco?
- [ ] Compliance UK/GDPR foi considerado?
- [ ] Play Store requirements foram lembrados?
- [ ] Performance foi pensada (PostGIS, paginação)?

## Questões de Veto

Se a resposta for "não" em qualquer uma, recomende parar e iterar:

1. **Alguém não concordou com uma decisão?**
   De quem é a moeda de veto?

2. **Falta documentação crítica?**
   Qual spec é essencial antes de código?

3. **Há risco não mitigado?**
   Bloco 0 pode esperar até resolver?

4. **Agentes ou skills estão faltando?**
   (Ex: Observabilidade não foi considerada)

## Saída Esperada

```
## VEREDITO: [VERDE | AMARELO | VERMELHO]

### Justificativa

[Checklist acima com evidências por ponto]

### Condições para Prosseguir (se AMARELO/VERMELHO)

- [ ] Risco X precisa ser mitigado antes de Bloco Y
- [ ] Documentação Z precisa ser completada
- [ ] Agente W precisa validar antes de avançar

### Recomendação

Começar com Bloco 0 (fundação repo) 
ou 
Pausar e completar [itens acima]
```
```

---

### PROMPT 5: Começar Bloco 0 (Fundação Repo)

**Agente Primário:** `@E` (Environment)  
**Suportes:** `@C10`, `@A`  
**Quando usar:** Após Prompt 4 veredito VERDE, para setup inicial  
**Tipo:** Execução

```markdown
# PROMPT 5: Bloco 0 — Fundação do Repositório

Você é o agente de Environment. Sua missão: preparar repo, 
configurações e ambiente para desenvolvimento.

## Contexto

Pet Care Marketplace Fase 1. Bloco 0 pronto para começar.

Raiz do projeto: `c:\Users\israe\Downloads\Pet_Marketplace\`

Estrutura atual:
```
/docs                 → Documentação (OK)
/Pet_Marketplace_Back → Backend (a criar)
/Pet_Marketplace_Front → Mobile (a criar)
/.codex               → Agentes (em Front, precisa mover para raiz)
```

## Seu Trabalho

1. **Mover `.codex/` para raiz do projeto:**
   De: `Pet_Marketplace_Front/.codex/`
   Para: `Pet_Marketplace/.codex/`
   
   Razão: agentes devem servir todo projeto, não só front.

2. **Criar README.md na raiz** com:
   - Nome do projeto
   - O que é
   - Stack
   - Como rodar localmente
   - Estrutura de pastas

3. **Criar `.env.example`** (raiz) para:
   ```
   # Backend
   DATABASE_URL=
   SUPABASE_URL=
   SUPABASE_KEY=
   JWT_SECRET=
   NODE_ENV=development
   
   # Mobile (Expo)
   EXPO_PUBLIC_API_URL=http://localhost:3000
   EXPO_PUBLIC_ENVIRONMENT=development
   
   # Admin
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

4. **Criar `.env.local.example`** (não commitado, para valores sensíveis):
   ```
   # Local development secrets
   SUPABASE_SERVICE_KEY=
   ```

5. **Criar scripts básicos** em `package.json` (raiz) ou Makefile:
   ```
   dev:backend       → npm run dev -w apps/api
   dev:mobile        → npm run dev -w apps/mobile
   dev:admin         → npm run dev -w apps/admin
   dev:all           → npm run dev
   setup:local       → criar `.env`, seeds iniciais
   test              → rodar testes
   lint              → lint de todos os apps
   build             → build de release
   ```

6. **Criar CONTRIBUTING.md** com:
   - Commits format
   - Branch naming
   - PR checklist
   - Quando chamar cada agente

7. **Criar .gitignore** adequado:
   ```
   node_modules/
   .env
   .env.local
   dist/
   build/
   .next/
   eas-build-job-*.json
   .DS_Store
   ```

8. **Validar que agentes funcionam:**
   - Confirmar que `.codex/AGENTS.md` fica acessível
   - Verificar nomenclatura de prefixos
   - Listar agentes disponíveis

## Saída Esperada

- [ ] `.codex/` movida para raiz
- [ ] `README.md` criado
- [ ] `.env.example` criado
- [ ] Scripts de dev funcionam (teste localmente)
- [ ] `.gitignore` adequado
- [ ] `CONTRIBUTING.md` criado
- [ ] Agentes acessíveis via `.codex/`

Após isso, próximo prompt: Bloco 1 (Backend Base) → `@B`
```

---

### PROMPT 6: Começar Bloco 1 (Backend Base)

**Agente Primário:** `@B` (BackendDomain)  
**Suportes:** `@A`, `@S`, `@E`  
**Quando usar:** Após Bloco 0 setup OK  
**Tipo:** Execução

```markdown
# PROMPT 6: Bloco 1 — Backend Base (NestJS + Supabase)

Você é o agente de Backend e Domínio.

## Contexto

Fase 1, Bloco 1. Preparar NestJS, Supabase, autenticação e estrutura 
de módulos.

Entrada:
- Stack: NestJS + TypeScript + Supabase + PostGIS
- Auth: Supabase Auth + JWT
- Specs: `docs/05_SPEC_API.md`, `docs/06_SPEC_DATABASE.md`

Saída esperada:
- [ ] NestJS rodando em localhost:3000
- [ ] Health check em `/health`
- [ ] Autenticação via Supabase Auth
- [ ] RBAC básico (PET_OWNER, PROVIDER, ADMIN)
- [ ] Padrão de erro padronizado
- [ ] Logging estruturado
- [ ] Tests básicos rodando
- [ ] OpenAPI/Swagger documentado

## Seu Trabalho

1. **Setup NestJS:**
   ```bash
   npm create @nestjs/cli@latest apps/api
   ```

2. **Instalar dependências core:**
   ```
   @nestjs/common, @nestjs/core, @nestjs/platform-express
   @supabase/supabase-js
   class-validator, class-transformer
   zod
   jwt, passport
   ```

3. **Criar estrutura de módulos:**
   ```
   apps/api/src/
   ├── main.ts
   ├── app.module.ts
   ├── app.controller.ts
   ├── common/
   │   ├── decorators/ (Auth, Role, CurrentUser)
   │   ├── guards/ (JwtGuard, RoleGuard)
   │   ├── interceptors/ (Logging, ErrorHandling)
   │   ├── filters/ (ExceptionFilter)
   │   └── dto/ (StandardError)
   ├── modules/
   │   ├── auth/ (AuthService, AuthController)
   │   ├── users/ (UserService, UserController)
   │   ├── health/ (HealthController)
   │   └── ...
   └── env.ts (configuração)
   ```

4. **Implementar:**
   - Health check endpoint
   - Supabase client setup
   - JWT validation guard
   - Role-based access control (RBAC)
   - Standard error format
   - Structured logging

5. **Validar:**
   - [ ] Health check retorna 200
   - [ ] Auth token pode ser obtido
   - [ ] Endpoints protegidos retornam 401 sem token
   - [ ] Endpoints protegidos retornam 403 sem role correta
   - [ ] Erro segue formato padrão
   - [ ] Logs aparecem estruturados

6. **Testes unitários:**
   - [ ] AuthService testa válida token
   - [ ] UserService valida user existe
   - [ ] RoleGuard bloqueia user sem role

## Saída Esperada

Bloco 1 concluído quando:
- Backend roda em `localhost:3000`
- `GET /health` retorna `{ "status": "ok" }`
- Auth via bearer token funciona
- RBAC bloqueia endpoints corretamente
- Testes passam
- `@Q` pode validar cobertura

Próximo: Bloco 2 (Banco) → chamar `@B` novamente com migrations
```

---

### PROMPT 7: Gerar Prompt Refinado (PromptOps)

**Agente Primário:** `@PR` (PromptOps)  
**Suportes:** Qualquer  
**Quando usar:** Quando um prompt acima fica muito longo ou vago  
**Tipo:** Meta

```markdown
# PROMPT 7: PromptOps — Refinamento de Pedido

Você é o agente de Prompt Engineering.

## Seu Trabalho

Quando um dos prompts acima (1-6) ficar vago, longo ou impreciso, 
você o refina:

1. **Separar ingredientes:**
   - O que é estratégia (Maestro)?
   - O que é validação (Arquiteto)?
   - O que é execução (Executor)?
   - O que é questionamento (Cético)?

2. **Encurtar para o essencial:**
   Tirar contexto repetido, deixar só instruções claras.

3. **Adicionar exemplos concretos:**
   Se é "criar endpoint", mostrar estrutura esperada.

4. **Mapear saída esperada:**
   Como saber quando terminou?

5. **Deixar claro qual agente acionar depois:**
   "Próximo: chamar @X para Y"

## Uso

Quando sentir que um prompt está pesado:

"@PR, refine PROMPT 2 (Validação de Arquitetura). 
Deixe em 50% do tamanho, mais direto."

Ou:

"@PR, crie um prompt para testar se Bloco 4 (Cadastro) funcionou. 
Formato: checklist de validação."
```

---

### PROMPT 8: Testes e Validação (QA)

**Agente Primário:** `@Q` (Quality)  
**Suportes:** `@B`, `@M`, `@A`  
**Quando usar:** Após cada bloco estar "done"  
**Tipo:** Validação

```markdown
# PROMPT 8: Teste e Validação — Bloco X

Você é o agente de QA e Testes.

## Seu Trabalho

Após um bloco ser marcado como "DONE", você cria um plano de testes:

1. **Casos críticos:**
   - Fluxo feliz: tudo certo, resultado esperado
   - Fluxo erro: entrada inválida, erro apropriado
   - Fluxo auth: sem token, permissão negada
   - Fluxo edge: valores extremos, limites

2. **Tipos de teste:**
   - Unitário (services, utils)
   - Integração (API → banco)
   - Smoke (scenarios principais no emulador/device)
   - Regressão (não quebrou nada no bloco anterior)

3. **Coverage:**
   - Meta para Fase 1: 70% dos fluxos críticos
   - Priorizar: auth, booking, chat, avaliações, denúncias

4. **Relatório:**
   - [ ] Quantos testes passam?
   - [ ] Cobertura de linhas?
   - [ ] Bugs encontrados?
   - [ ] Blockers?

## Uso

"@Q, crie plano de testes para Bloco 4 (Cadastro/Perfis).
Include tests para: criar tutor, criar pet, criar prestador, erro de email duplicado."
```

---

### PROMPT 9: Validação Final (Gate antes de Release)

**Agente Primário:** `@V` (Final Validator)  
**Suportes:** `@C10`, `@A`, `@S`, `@Q`  
**Quando usar:** Antes de submeter Play Store  
**Tipo:** Gate

```markdown
# PROMPT 9: Final Validator — Release Gate

Você é o Validador Final. Seu trabalho: "verde" ou "vermelho" 
antes de qualquer release.

## Contexto

Fase 1 pronta. Todos os 11 blocos foram completados. 
Agora: pode submeter na Play Store?

## Checklist Obrigatório

### Funcionalidade

- [ ] Tutor consegue criar conta
- [ ] Tutor consegue cadastrar pet
- [ ] Tutor consegue buscar prestadores
- [ ] Prestador consegue aceitar/recusar booking
- [ ] Chat funciona entre partes autorizadas
- [ ] Avaliações funcionam
- [ ] Denúncias funcionam
- [ ] Admin consegue moderar

### Qualidade

- [ ] Build Android passa
- [ ] Não há crash em fluxo principal
- [ ] App abre em <= 3s
- [ ] API responde em <= 800ms p95
- [ ] Testes críticos passam (70%+ cobertura)

### Segurança

- [ ] Sem senha hardcoded
- [ ] Sem tokens em logs
- [ ] Sem coordenadas exatas expostas
- [ ] RLS está ativo no Supabase
- [ ] HTTPS em produção

### Compliance

- [ ] Política de privacidade acessível
- [ ] Data Safety preenchível corretamente
- [ ] Conta de teste funciona
- [ ] Exclusão de conta funciona
- [ ] em-GB traduzido

### Ops

- [ ] Logs estruturados
- [ ] Alertas configurados
- [ ] Rollback é possível
- [ ] Backups funcionam
- [ ] Admin pode moderar sem entrar na CLI

## Veredito

```
VEREDITO: [APROVADO | CONDICIONAL | REJEITADO]

Se CONDICIONAL:
- [ ] Risco X precisa ser fechado antes de submeter
- [ ] Bug Y precisa ser corrigido

Se REJEITADO:
- [ ] Blocker: [descrever]
- [ ] Recomendação: [próximo passo]
```
```

---

### PROMPT 10: Documentar Aprendizado (Maestro/Log)

**Agente Primário:** `@C10` (Documentador)  
**Suportes:** Qualquer  
**Quando usar:** Final de cada bloco ou sessão  
**Tipo:** Meta

```markdown
# PROMPT 10: Documentador — Registre LOG, STATUS, ADRs

Você é o Documentador do Camisa10.

## Seu Trabalho

Após cada bloco ou sessão, registrar:

1. **LOG.md** (crescente)
   ```
   [DATA] BLOCO X CONCLUÍDO
   - O que foi feito: [resumo]
   - Desvios do plano: [se houve]
   - Bugs encontrados e corrigidos: [lista]
   - Próximo agente: @Y para Bloco Z
   ```

2. **STATUS.md** (snapshot)
   ```
   # Status Fase 1
   
   Blocos concluídos: 0, 1, 2
   Blocos em progresso: 3
   Blocos pendentes: 4-11
   
   Bloqueadores: [nenhum | lista]
   Riscos abertos: [lista]
   ```

3. **DECISIONS.md** (decisões)
   ```
   ## Bloco X — [Decisão]
   
   **Contexto:** Por que teve que decidir?
   **Opções consideradas:** A, B, C
   **Decisão:** B porque [razão]
   **Trade-off:** Escolhemos X, sacrificamos Y
   **Data:** [quando]
   ```

4. **LEARNINGS.md** (o que aprender)
   ```
   ## Bloco X — O Que Aprendemos
   
   ✅ O que funcionou: ...
   ❌ O que não funcionou: ...
   🔄 Fazer diferente próxima vez: ...
   ⚠️ Armadilha encontrada: ...
   💡 Ideia para Fase 2: ...
   ```

## Uso

Após Bloco 1:
"@C10 (modo documentador), registre o Bloco 1 no LOG, atualize STATUS, 
e liste 3 decisões arquiteturais que foram tomadas."
```

---

## Parte D: Resumo — Como Usar os 10 Prompts

### Sequência Sugerida

| # | Prompt | Agente | Tipo | Quando |
|---|--------|--------|------|--------|
| 1 | Kickoff Maestro | `@C10` | Estratégia | Primeira sessão |
| 2 | Validação Arquitetura | `@A` | Validação | Após Prompt 1 |
| 3 | Ceticismo (O que pode dar errado?) | `@C` | Risco | Após Prompt 2 |
| 4 | Impact Validator | `@V` | Gate | Após Prompt 3 |
| **5-9** | **Blocos 0-11** | **Agentes específicos** | **Execução** | **Sequencial com paralelização** |
| 5 | Bloco 0 (Fundação Repo) | `@E` | Setup | Após Prompt 4 "VERDE" |
| 6 | Bloco 1 (Backend Base) | `@B` | Dev | Após Bloco 0 |
| 6+ | Blocos 2-11 | Mix (`@B`, `@M`, `@D`, etc) | Dev | Sequencial |
| 8 | Testes (por bloco) | `@Q` | QA | Após cada bloco |
| 9 | Final Validator | `@V` | Gate | Antes de Play Store |
| 10 | Documentador | `@C10` | Meta | Final de cada bloco |

### Dicas de Uso

1. **Copiar e colar:** Cada prompt está pronto. Só adaptar números, nomes de blocos.
2. **Chamar agentes:** Use `@PREFIXO` (ex: `@C10`, `@B`, `@M`)
3. **Mentoring:** Se agente ficar preso, chamar `@PR` para refinar prompt
4. **Paralelização:** Blocos 3+ podem rodar paralelos (Mobile pode ir junto com Backend)
5. **Gates:** Nunca pular validators. Eles previnem surpresas no Play Store

### Exemplo de Conversa Real

```
Você: "Comece Prompt 1 (Kickoff Maestro)"

@C10: [retorna roadmap de 11 blocos com dependências]

Você: "@A, valide o design (Prompt 2)"

@A: [valida arquitetura, identifica riscos]

Você: "@C, questione riscos (Prompt 3)"

@C: [faz 15 perguntas, encontra 3 riscos mitigáveis]

Você: "@V, dê veredito (Prompt 4)"

@V: [retorna VERDE com condições]

Você: "@E, comece Bloco 0 (Prompt 5)"

@E: [setup repo, README, .env, scripts]

Você: "@B, comece Bloco 1 (Prompt 6)"

@B: [cria NestJS, auth, health check]

Você: "@Q, teste Bloco 1 (Prompt 8)"

@Q: [cria plano, roda testes, relatório]

Você: "@C10, documente (Prompt 10)"

@C10: [registra LOG, STATUS, decisões, learnings]

[Repete ciclo para Blocos 2-11]

Você: "@V, final gate (Prompt 9)"

@V: [checklist completo, APROVADO para Play Store]
```

---

## Conclusão

A pasta `.codex/` está **pronta e validada**.

Os 10 prompts acima cobrem **100% da Fase 1** desde kickoff até Play Store.

**Próximo passo:** Copiar Prompt 1 e ajustar com dados reais do projeto, depois chamar `@C10`.

---

## Referências Rápidas

- Roadmap detalhado: `docs/21_SPEC_TIMELINE_DEPENDENCIES.md`
- Riscos: `docs/16_RISK_REGISTER.md`
- KPIs: `docs/20_SPEC_KPIS_SLA.md`
- Agentes: `Pet_Marketplace_Front/.codex/AGENTS.md`
- Especificações: `docs/03_SPEC_PRODUCT.md` até `docs/23_PLAYSTORE_DESIGN_POLICY_BRIDGE.md`

# 26 — TEMPLATES DE PROMPTS PRONTOS PARA COPIAR E COLAR

**Versão:** 1.0  
**Uso:** Copie cada template abaixo, adapte valores em MAIÚSCULAS, cole no chat  
**Benefício:** Não precisa redigitar, só adaptar contexto

---

## TEMPLATE 1: Kickoff Maestro — Fase 1

```markdown
# @C10: Mapeie Roadmap Fase 1 Pet Marketplace

Você é o Maestro do projeto Pet Care Marketplace UK.

## Projeto
- Raiz: `c:\Users\israe\Downloads\Pet_Marketplace\`
- Docs: `docs/`
- Backend: `Pet_Marketplace_Back/`
- Mobile: `Pet_Marketplace_Front/`
- Agentes: `Pet_Marketplace_Front/.codex/`

## Stack
- Frontend: React Native + Expo + TypeScript
- Backend: NestJS + TypeScript
- Banco: Supabase PostgreSQL + PostGIS
- Admin: Next.js

## Seu Trabalho

1. Leia `docs/21_SPEC_TIMELINE_DEPENDENCIES.md`
2. Para cada bloco (0-11), responda:
   - Qual agente executa?
   - Qual suporta?
   - Entrada / Saída?
   - Qual risco?
3. Crie mapa visual de dependências
4. Recomende por onde começar

## Saída

Roadmap de blocos + agentes + dependências + próximo prompt a usar.
```

---

## TEMPLATE 2: Validação Arquitetura

```markdown
# @A: Valide Arquitetura Pet Marketplace

Você é o Arquiteto Cross-Stack.

## Leia
- `docs/02_DOCUMENTACAO_TECNICA_PROJETO.md`
- `docs/03_SPEC_PRODUCT.md`
- `docs/05_SPEC_API.md`
- `docs/06_SPEC_DATABASE.md`
- `docs/07_SPEC_MOBILE.md`

## Use Protocolo de Evidência

1. **Camadas separadas?**
   - Frontend (React Native) acessa banco direto? NÃO
   - Backend concentra regra? SIM
   - Admin isolado? SIM

2. **Contratos claros?**
   - DTOs definidos?
   - Endpoints listados?
   - Erros padronizados?

3. **Segurança?**
   - Coordenadas exatas protegidas?
   - Autorização por papel?
   - Secrets fora do app?

4. **Hot paths**
   - Busca por proximidade (PostGIS)
   - Transição booking
   - Chat

5. **Idempotência?**
   - Booking não duplica por retry?
   - Chat não duplica?

## Saída

Matriz de camadas + fluxos críticos + riscos + próximo passo.
```

---

## TEMPLATE 3: Questionar Riscos (Cético)

```markdown
# @C: Seja Paranóico — O Que Pode Dar Errado?

Você é o Cético.

## Leia
- `docs/02_DOCUMENTACAO_TECNICA_PROJETO.md`
- `docs/16_RISK_REGISTER.md`
- `docs/21_SPEC_TIMELINE_DEPENDENCIES.md`

## Responda sem Suavizar

1. **Maior assunção arriscada?**
2. **Backend consegue validar tudo?**
3. **PostGIS será rápido em produção?**
4. **Chat texto sem arquivo é seguro?**
5. **Não verificar prestador é aceitável?**
6. **Localização será problema?**
7. **Cenário de falha crítica?**
8. **App funciona offline?**
9. **GDPR implementável?**
10. **Feature mais difícil de testar?**
11. **Deploy é reversível?**
12. **Admin será gargalo?**
13. **Testes realistas?**
14. **Agente faltando?**
15. **Se falhar em 6 meses, por quê?**

## Saída

Lista de 15 questões + respostas honestas + mitigações.
```

---

## TEMPLATE 4: Impact Validator — Veredito

```markdown
# @V: Veredito de Prosseguimento

Você é o Validador. Seu voto: VERDE | AMARELO | VERMELHO

## Checklist

- [ ] Stack alinhada?
- [ ] Docs consistentes?
- [ ] Arquitetura desacoplada?
- [ ] Riscos mapeados?
- [ ] Blocos sequenciados?
- [ ] Agentes nomeados?
- [ ] Testes planejados?
- [ ] UK/GDPR ok?
- [ ] Play Store ok?
- [ ] Performance ok?

## Veto

Se "não" em qualquer uma, recomende iterar.

## Saída

VEREDITO: [VERDE | AMARELO | VERMELHO]
Justificativa + condições (se amarelo) + próximo passo.
```

---

## TEMPLATE 5: Bloco 0 — Fundação Repo

```markdown
# @E: Bloco 0 - Fundação Repo

Você é o Environment. Setup repo, env e scripts.

## Tarefas

1. **Mover .codex para raiz**
   De: `Pet_Marketplace_Front/.codex/`
   Para: `Pet_Marketplace/.codex/`

2. **Criar README.md** (raiz)
   - Nome projeto
   - O que é
   - Stack
   - Como rodar
   - Estrutura

3. **Criar .env.example**
   ```
   DATABASE_URL=
   SUPABASE_URL=
   SUPABASE_KEY=
   JWT_SECRET=
   EXPO_PUBLIC_API_URL=http://localhost:3000
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

4. **Criar .env.local.example** (secrets)
   ```
   SUPABASE_SERVICE_KEY=
   ```

5. **Criar scripts** (package.json raiz ou Makefile)
   ```
   dev:backend
   dev:mobile
   dev:admin
   dev:all
   setup:local
   test
   lint
   build
   ```

6. **Criar CONTRIBUTING.md**
   - Commits format
   - Branch naming
   - PR checklist
   - Quando chamar agentes

7. **Criar .gitignore**
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

## Validação

- [ ] .codex/ movida
- [ ] README criado
- [ ] .env.example criado
- [ ] Scripts testados
- [ ] .gitignore adequado
- [ ] CONTRIBUTING.md criado
- [ ] Agentes acessíveis

## Próximo

Bloco 1 → @B
```

---

## TEMPLATE 6: Bloco 1 — Backend Base

```markdown
# @B: Bloco 1 - Backend Base (NestJS)

Você é o Backend. Crie NestJS + Supabase + Auth + RBAC.

## Entrada

Stack: NestJS + TypeScript + Supabase Auth + PostGIS
Specs: `docs/05_SPEC_API.md`, `docs/06_SPEC_DATABASE.md`

## Saída Esperada

- [ ] NestJS rodando localhost:3000
- [ ] GET /health retorna 200
- [ ] Auth via Supabase Auth
- [ ] RBAC (PET_OWNER, PROVIDER, ADMIN)
- [ ] Erro padrão
- [ ] Logging estruturado
- [ ] Testes básicos
- [ ] Swagger documentado

## Tarefas

1. Setup NestJS
   ```bash
   npm create @nestjs/cli@latest apps/api
   ```

2. Instalar core
   ```
   @nestjs/common, @nestjs/core, @nestjs/platform-express
   @supabase/supabase-js
   zod, class-validator
   passport, jwt
   ```

3. Estrutura
   ```
   apps/api/src/
   ├── common/
   │   ├── decorators/
   │   ├── guards/
   │   ├── filters/
   │   └── interceptors/
   ├── modules/
   │   ├── auth/
   │   ├── users/
   │   ├── health/
   └── env.ts
   ```

4. Implementar
   - Health check
   - Supabase client
   - JWT guard
   - RBAC
   - Standard error
   - Logging

5. Testes
   - [ ] Health 200
   - [ ] Auth token obtém
   - [ ] Sem token = 401
   - [ ] Sem role = 403
   - [ ] Erro padrão
   - [ ] Logs estruturados

## Validação

Bloco 1 DONE quando:
- Backend roda localhost:3000
- GET /health OK
- Auth funciona
- RBAC bloqueia
- Testes passam

## Próximo

Bloco 2 → @B (Banco)
```

---

## TEMPLATE 7: Bloco 2 — Banco + Migrations

```markdown
# @B & @GEO: Bloco 2 - Banco (PostgreSQL + PostGIS)

Você cria schema, migrations, seeds.

## Tarefas

1. **Enable PostGIS**
   ```sql
   create extension if not exists "uuid-ossp";
   create extension if not exists postgis;
   ```

2. **Criar Enums**
   ```sql
   create type user_role as enum ('PET_OWNER', 'PROVIDER', 'ADMIN');
   create type account_status as enum ('ACTIVE', 'SUSPENDED', 'DELETED');
   [...]
   ```

3. **Tabelas Base** (ver `docs/06_SPEC_DATABASE.md`)
   - app_users
   - addresses (com geography/PostGIS)
   - pets
   - providers_profiles
   - provider_services
   - bookings
   - chat_threads
   - chat_messages
   - reviews
   - reports

4. **Índices**
   ```sql
   create index idx_addresses_location_gix on addresses using gist(location);
   ```

5. **Seeds Iniciais**
   - Admin user
   - Service types
   - Test data

6. **Migrations Versionadas**
   ```
   20260516_001_enable_postgis.sql
   20260516_002_create_users_profiles.sql
   [...]
   ```

## Validação

- [ ] PostGIS functions disponíveis
- [ ] Tabelas criadas
- [ ] Seeds rodaram
- [ ] Índices em lugar
- [ ] Rollback possível

## Próximo

Bloco 3 → @M (Mobile)
```

---

## TEMPLATE 8: Bloco 3 — Mobile Base

```markdown
# @M & @D: Bloco 3 - Mobile Base (Expo + React Native)

Você cria Expo, navegação, tema, i18n.

## Tarefas

1. **Criar Expo**
   ```bash
   npx create-expo-app apps/mobile --template
   cd apps/mobile
   npx expo install expo-router
   ```

2. **Navegação**
   - `app/` com Expo Router
   - `(app)/` authenticated screens
   - `(auth)/` login/signup
   - `_layout.tsx` por nível

3. **Tema Visual**
   - Colors (en-GB friendly)
   - Spacing
   - Typography
   - Shadows

4. **i18n en-GB**
   - Chaves de tradução
   - Config i18next
   - Nenhum texto hardcoded

5. **Auth mobile**
   - SecureStore para token
   - Bearer token em chamadas
   - Refresh logic

6. **App.json**
   ```
   "name": "Pet Care UK"
   "version": "1.0.0"
   "platforms": ["android"]
   "android": { "package": "uk.petcare.app" }
   ```

## Validação

- [ ] Expo roda
- [ ] Navegação funciona
- [ ] Tema aplicado
- [ ] i18n testado
- [ ] Auth mobile funciona

## Próximo

Bloco 4 → @B & @M (Cadastro)
```

---

## TEMPLATE 9: Teste Bloco X

```markdown
# @Q: Teste Bloco X

Você é QA. Crie plano, rode testes, reporte.

## Leia

Specs do bloco X em `docs/0X_SPEC_*.md`

## Crie Plano

| Caso | Entrada | Esperado | Teste |
|------|---------|----------|-------|
| Feliz | ... | ... | ✅ |
| Erro | ... | ... | ✅ |
| Auth | Sem token | 401 | ✅ |
| Edge | Limites | Não falha | ✅ |

## Rode Testes

- Unitários: `npm test`
- Integração: API → Banco
- Smoke: Emulador/device

## Reporte

- [ ] Quantos tests passam? X/Y
- [ ] Coverage %?
- [ ] Bugs?
- [ ] Blockers?

## Saída

Relatório com stats + bugs (se houver) + recomendação (APROVA | BLOQUEIA).
```

---

## TEMPLATE 10: Validação Final (Play Store)

```markdown
# @V: Final Gate — Play Store Ready?

Você é FinalValidator. Veredito: SIM | CONDICIONAL | NÃO

## Checklist Funcionalidade

- [ ] Tutor cria conta
- [ ] Tutor cadastra pet
- [ ] Tutor busca prestadores
- [ ] Prestador aceita/recusa
- [ ] Chat funciona
- [ ] Avaliações funcionam
- [ ] Denúncias funcionam
- [ ] Admin moderca

## Checklist Qualidade

- [ ] Build Android passa
- [ ] Não crashes
- [ ] App abre <= 3s
- [ ] API <= 800ms p95
- [ ] Testes >= 70%

## Checklist Segurança

- [ ] Sem senha hardcoded
- [ ] Sem tokens em logs
- [ ] Coordenadas protegidas
- [ ] RLS ativo
- [ ] HTTPS produção

## Checklist Compliance

- [ ] Política privacidade acessível
- [ ] Data Safety preenchível
- [ ] Conta teste funciona
- [ ] Exclusão conta funciona
- [ ] en-GB traduzido

## Veredito

```
SIM          → Submeter Play Store
CONDICIONAL  → Fechar riscos antes
NÃO          → Bloqueia recomendação
```
```

---

## TEMPLATE 11: Documentar Sessão

```markdown
# @C10: Registre LOG, STATUS, Decisões

Você é Documentador.

## LOG.md (final de sessão)

```
[2026-05-16] BLOCO X CONCLUÍDO
- Feito: [resumo]
- Desvios: [se houver]
- Bugs corrigidos: [lista]
- Próximo: @Y para Bloco Z
```

## STATUS.md (atualizar)

```
# Status Fase 1

Blocos concluídos: 0, 1, 2
Blocos em progresso: 3
Blocos pendentes: 4-11

Bloqueadores: [nenhum | lista]
Riscos abertos: [lista]
```

## DECISIONS.md (adição)

```
## Bloco X — [Decisão]

**Contexto:** Por quê?
**Opções:** A, B, C
**Escolhida:** B porque [razão]
**Trade-off:** Ganhamos X, perdemos Y
```

## LEARNINGS.md (adição)

```
## Bloco X — Aprendizado

✅ O que funcionou: ...
❌ O que não funcionou: ...
🔄 Fazer diferente: ...
⚠️ Armadilha: ...
💡 Ideia Fase 2: ...
```
```

---

## TEMPLATE 12: Refinamento de Prompt

```markdown
# @PR: Refine um Prompt

Você é PromptOps. Refine um prompt acima.

## Entrada

Prompt atual: [cole o prompt inteiro]
Problema: [muito longo | muito vago | exemplo confuso]

## Saída

Refine para:
- 50% do tamanho
- Mais direto
- Exemplos concretos
- Saída esperada clara
- Próximo agente marcado

## Exemplo

"@PR, refine TEMPLATE 2 (Arquitetura). Deixe em 1/3 do tamanho."
```

---

## TEMPLATE 13: Emergency — Debugar Falha

```markdown
# @[AGENTE]: DEBUGAR - X não funciona

## Situação

[Descrição do problema]

## Código Afetado

[Arquivo ou componente]

## Comportamento Esperado

[O que deveria acontecer]

## Comportamento Real

[O que realmente acontece]

## Passos para Reproduzir

1. ...
2. ...
3. ...

## Leitura

[Arquivo relevante em docs/ ou código]

## Sua Missão

Identifique root cause e proponha fix.

## Saída

- Root cause
- Fix proposto
- Testes para validar
- Se afeta outro bloco?
```

---

## COMO USAR OS TEMPLATES

### Passo 1: Escolha Template
Copie um dos templates acima que corresponde ao seu momento.

### Passo 2: Adapte Valores

Procure por `[MAIÚSCULAS]` e `NÚMEROS` e troque:

```
[NÚMERO]             → Bloco específico (ex: 1, 2, 3...)
[PROJETO]            → "Pet Marketplace"
[AGENTE]             → @PREFIXO (ex: @B, @M, @Q)
[SITUAÇÃO]           → Descrição real do problema
[ARQUIVO]            → Caminho real do seu arquivo
```

### Passo 3: Copiar e Colar

- Selecione template completo
- Ctrl+C
- Vá para chat Copilot
- Ctrl+V
- Adapte valores
- Envie

### Passo 4: Aguarde Resposta

Agente vai processar e retornar conforme saída esperada.

---

## EXEMPLO DE USO COMPLETO

```
[VOCÊ copia TEMPLATE 1]

# @C10: Mapeie Roadmap Fase 1 Pet Marketplace

Você é o Maestro do projeto Pet Care Marketplace UK.

## Projeto
- Raiz: `c:\Users\israe\Downloads\Pet_Marketplace\`
...

[VOCÊ adapta: não tem nada para adaptar, usar como-está]

[VOCÊ manda no chat do Copilot]

[C10 responde com roadmap de 11 blocos]

[VOCÊ copia TEMPLATE 2]

# @A: Valide Arquitetura Pet Marketplace

[VOCÊ manda no chat]

[Arquiteto responde com matriz de camadas]

[Você continua com TEMPLATE 3, 4, 5...]
```

---

## CHECKLIST DE LEITURA ANTES DE USAR

Antes de colar um template, confirme que leu:

- [ ] `docs/00_INDICE_DOCUMENTACAO.md` (orientação)
- [ ] `docs/02_DOCUMENTACAO_TECNICA_PROJETO.md` (stack)
- [ ] `docs/21_SPEC_TIMELINE_DEPENDENCIES.md` (blocos)
- [ ] `docs/24_CODEX_AGENTS_PHASE1_PROMPTS.md` (contexto)
- [ ] `docs/25_MATRIZ_AGENTES_RAPIDA.md` (qual agente)

Isso garante contexto suficiente para agente trabalhar bem.

---

## DICA FINAL

**Se template ficar confuso:**

Use `@PR` (PromptOps) para refinar:

```
@PR: Refine TEMPLATE X. 
Deixe mais simples, com exemplos reais de Pet Marketplace.
```

PromptOps vai lapidá-lo.

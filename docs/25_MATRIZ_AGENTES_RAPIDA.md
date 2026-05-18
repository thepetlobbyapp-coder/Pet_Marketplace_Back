# MATRIZ AGENTES ESSENCIAIS FASE 1

**Versão:** 1.0  
**Uso:** Referência rápida para saber qual agente chamar  
**Como usar:** Ctrl+F para buscar por situação

---

## 🎯 MATRIZ RÁPIDA — Situação → Agente

| Situação | Agente | Arquivo | Prompt |
|----------|--------|---------|--------|
| **Projeto começando?** | `@C10` | `C10_CAMISA10.md` | PROMPT 1 |
| **Precisa validar arquitetura?** | `@A` | `A_Agent_CrossStackArchitect.md` | PROMPT 2 |
| **Quer questionar riscos?** | `@C` ou `@C10` modo ceticismo | `C_Cetico/C_Agent.md` | PROMPT 3 |
| **Precisa veredito de prosseguimento?** | `@V` | `V_Validation/V_Agent_ImpactValidator.toml` | PROMPT 4 |
| **Setup de repo, env, scripts?** | `@E` | `E_Environment/E_Agent_Environment.md` | PROMPT 5 |
| **Criar backend, NestJS, auth?** | `@B` | `B_BackendDomain/B_Agent_BackendDomain.md` | PROMPT 6 |
| **Criar banco, migrations, PostGIS?** | `@B` + `@GEO` | `B_BackendDomain/...` + `GEO_Location/...` | PROMPT 6+ |
| **Busca por proximidade/localização?** | `@GEO` | `GEO_Location/GEO_Agent_Location.md` | Durante `@B` |
| **Criar mobile, React Native, Expo?** | `@M` | `M_MobilePlaystore/M_Agent_MobilePlaystore.md` | PROMPT 6+ |
| **Design system, UI/UX?** | `@D` | `D_Design/D_Agent_Design.md` | PROMPT 6+ |
| **Segurança, auth, PII, secrets?** | `@S` | `S_Seguranca/S_Agent_SecurityValidator.toml` | Durante blocos |
| **Compliance UK, GDPR, dados?** | `@UK` | `UK_CompliancePetCare/UK_Agent.md` | Durante blocos |
| **Tradução en-GB, i18n?** | `@I18N` | `I18N_LocalizationUX/I18N_Agent.md` | Bloco 9 |
| **Denúncias, moderação, trust?** | `@MOD` | `MOD_TrustSafety/MOD_Agent.md` | Bloco 8 |
| **Testes, QA, casos críticos?** | `@Q` | `Q_Quality/Q_Agent_TestEngineer.md` | PROMPT 8 |
| **Performance, cache, PostGIS?** | `@P` | `P_Performance/P_Agent_PerformanceValidator.toml` | Blocos críticos |
| **Play Store, release, compliance?** | `@M` | `M_MobilePlaystore/M_Agent_MobilePlaystore.md` | PROMPT 6+ |
| **Observabilidade, logs, deploy?** | `@O` | `O_Observability/O_Agent_DeployObservability.md` | Fase 2 |
| **Refinamento de prompt, briefing?** | `@PR` | `PR_PromptOps/PR_Agent_PromptRefiner.md` | PROMPT 7 |
| **Documentar LOG, STATUS, ADRs?** | `@C10` modo documentador | `C10_Maestro/C10_DOCUMENTADOR.md` | PROMPT 10 |
| **Checklist arquitetura cross-stack?** | `@A` | `A_Architecture/A_Agent_CrossStackArchitect.md` | PROMPT 2 |
| **Validação final antes de release?** | `@V` FinalValidator | `V_Validation/V_Agent_FinalValidator.toml` | PROMPT 9 |

---

## 📊 MATRIZ POR BLOCO DE IMPLEMENTAÇÃO

### Bloco 0: Fundação Repo

| Tarefa | Agente | Checklist |
|--------|--------|-----------|
| Setup repo, package.json, estrutura | `@E` | [ ] README [ ] .env.example [ ] scripts |
| Mover .codex para raiz | `@E` | [ ] Pasta movida [ ] Paths ajustados |
| Criar CONTRIBUTING.md | `@C10` | [ ] Formats definidos [ ] Agentes mapeados |
| Validar que agentes funcionam | `@C10` | [ ] AGENTS.md acessível [ ] Prefixos OK |

### Bloco 1: Backend Base

| Tarefa | Agente | Checklist |
|--------|--------|-----------|
| Criar NestJS + estrutura | `@B` | [ ] main.ts [ ] app.module.ts [ ] modules/ |
| Setup Supabase + auth | `@B` + `@S` | [ ] Client setup [ ] JWT [ ] RBAC |
| Health check + logging | `@B` | [ ] GET /health [ ] Logs estruturados |
| Testes unitários básicos | `@Q` | [ ] AuthService [ ] UserService [ ] 70%+ coverage |

### Bloco 2: Banco + Migrations

| Tarefa | Agente | Checklist |
|--------|--------|-----------|
| Enable PostGIS | `@B` + `@GEO` | [ ] Extensão criada [ ] Índices em lugar |
| Criar tabelas base | `@B` | [ ] users [ ] profiles [ ] addresses [ ] PostGIS geography |
| Seeds iniciais | `@B` | [ ] Serviços [ ] Admin [ ] Dados teste |
| Migrations versionadas | `@B` | [ ] Rollback possível [ ] Nomes claros |

### Bloco 3: Mobile Base

| Tarefa | Agente | Checklist |
|--------|--------|-----------|
| Criar Expo + navegação | `@M` | [ ] app.json [ ] Expo Router [ ] Stacks |
| Tema visual + design tokens | `@D` | [ ] Colors [ ] Spacing [ ] Typography |
| i18n en-GB | `@I18N` | [ ] Chaves de tradução [ ] Keys definidas |
| Autenticação mobile | `@M` + `@S` | [ ] SecureStore [ ] Bearer token [ ] Refresh logic |

### Bloco 4: Cadastro/Perfis

| Tarefa | Agente | Checklist |
|--------|--------|-----------|
| Endpoints POST /users, /profiles | `@B` | [ ] DTOs [ ] Validação [ ] Erro padrão |
| Telas de cadastro tutor/prestador | `@M` + `@D` | [ ] Fluxo OK [ ] Validação client [ ] en-GB |
| Integração mobile ↔ backend | `@M` | [ ] API client [ ] Error handling [ ] Retry logic |
| Compliance: minimal data | `@UK` | [ ] GDPR checklist [ ] Nenhum dado excessivo |

### Bloco 5: Localização/Busca

| Tarefa | Agente | Checklist |
|--------|--------|-----------|
| Endpoints POST /addresses, GET /providers?radius | `@B` + `@GEO` | [ ] PostGIS query [ ] Distância aproximada [ ] Sem coords exatas |
| Tela de busca mobile | `@M` | [ ] Mapa opcional [ ] Filtros [ ] Listagem |
| Performance PostGIS | `@P` | [ ] Índice GIST [ ] Query plana [ ] p95 <= 1200ms |

### Bloco 6: Agendamento/Booking

| Tarefa | Agente | Checklist |
|--------|--------|-----------|
| Endpoints POST /bookings, PATCH /bookings/:id/status | `@B` | [ ] Transição de status [ ] Validação permissions [ ] Idempotência |
| Chat thread automático | `@B` | [ ] Thread criada com booking [ ] Isolamento by auth |
| Telas de agendamento mobile | `@M` | [ ] Solicitar [ ] Listar [ ] Aceitar/recusar |
| Denúncias rápidas | `@MOD` | [ ] Report durante booking [ ] Admin vê |

### Bloco 7: Design System

| Tarefa | Agente | Checklist |
|--------|--------|-----------|
| Componentes base | `@D` | [ ] Button [ ] Input [ ] Card [ ] Avatar |
| Acessibilidade | `@D` | [ ] Contraste [ ] Touch targets [ ] Labels |
| Tokens no projeto | `@D` | [ ] Colors [ ] Spacing [ ] Elevation |

### Bloco 8: Denúncias/Moderação

| Tarefa | Agente | Checklist |
|--------|--------|-----------|
| Endpoints POST /reports, GET /reports (admin) | `@B` + `@MOD` | [ ] Report criado [ ] Status [ ] Escalação |
| Admin web básico | Next.js admin | [ ] Listar reports [ ] Mudar status [ ] Bloquear user |
| Operação: SLA, categorias | `@MOD` | [ ] Urgências definidas [ ] Fluxo mod [ ] Logs audit |

### Bloco 9: Avaliações

| Tarefa | Agente | Checklist |
|--------|--------|-----------|
| Endpoints POST /bookings/:id/reviews, GET /reviews | `@B` | [ ] Rating [ ] Comment [ ] Moderação status |
| Telas de avaliação mobile | `@M` + `@I18N` | [ ] Pós-booking [ ] Rating stars [ ] en-GB |
| Moderação de reviews | `@MOD` | [ ] Flag abusivo [ ] Hide by admin |

### Bloco 10: Play Store Prep

| Tarefa | Agente | Checklist |
|--------|--------|-----------|
| Build AAB via EAS | `@M` | [ ] VersionCode incremental [ ] Assinado [ ] AAB gerado |
| Data Safety preenchimento | `@S` + `@UK` | [ ] Dados mapeados [ ] Coleta legitimate [ ] Compartilhamento honesto |
| Screenshots, store listing | `@M` | [ ] 5+ screenshots [ ] Descrição en-GB |
| Conta de teste | `@M` | [ ] Tutor [ ] Prestador [ ] Instruções |

### Bloco 11: Testes Críticos + Release

| Tarefa | Agente | Checklist |
|--------|--------|-----------|
| Plano de testes Fase 1 | `@Q` | [ ] Casos críticos [ ] Coverage 70%+ [ ] Regressão |
| Smoke test em device real | `@Q` + `@M` | [ ] App abre [ ] Login [ ] Busca [ ] Agendamento |
| Validação final | `@V` | [ ] Checklist completo [ ] APROVADO | CONDICIONAL | REJEITADO |

---

## 🎪 PIPELINE RECOMENDADO (Execução Realista)

```
SEMANA 1-2: Bloco 0 + Bloco 1 + Bloco 2 (Backend foundation)
├─ @E (Bloco 0): 3-4h
├─ @B (Blocos 1-2): 16-20h
└─ @Q (Testes): 4h

SEMANA 3: Bloco 3 (Mobile foundation) PARALELO com Bloco 4 start
├─ @M (Bloco 3): 8-10h
├─ @D (Design tokens): 4-6h
├─ @I18N (i18n setup): 2-3h
└─ @B (Bloco 4 endpoints): 6-8h (paralelo)

SEMANA 4-5: Blocos 4, 5, 6 (Core features)
├─ @B (Blocos 4-6): 20-24h
├─ @M (Mobile screens): 12-16h
├─ @GEO (Search): 6-8h
├─ @S (Auth): 4-6h
└─ @Q (Testes): 8-10h

SEMANA 6: Blocos 7, 8, 9 (Polish + Moderation)
├─ @D (Bloco 7): 6-8h
├─ @B (Blocos 8-9): 10-12h
├─ @MOD (Operations): 4-6h
├─ @M (UI screens): 6-8h
└─ @Q (Testes): 6-8h

SEMANA 7-8: Bloco 10 + 11 (Release prep)
├─ @M (Play Store): 8-10h
├─ @S (Data Safety): 4-6h
├─ @Q (Final tests + smoke): 10-12h
├─ @V (Gate validation): 2-3h
└─ @C10 (Documentation): 4-6h

TOTAL ESTIMADO: 40-48h para 1 dev com paralelização
```

---

## 🚀 COMO USAR ESTA MATRIZ

### Cenário 1: "Estou preso em X"

```
Problema: "Busca por proximidade está lenta"

1. Procure na matriz: "Busca por proximidade/localização" → `@GEO`
2. Chamar: "@GEO, otimize a busca do Bloco 5"
3. @GEO lê `GEO_Location/GEO_Agent_Location.md`
4. Problema resolvido ou @P (performance) validado
```

### Cenário 2: "Quero começar Bloco X"

```
Objetivo: Começar Bloco 6 (Agendamento)

1. Procure "Bloco 6" na matriz → Veja todos os agentes
2. Sequência: @B (backend endpoints) → @MOD (rules) → @M (UI) → @Q (testes)
3. Chamar: "@B, implemente Bloco 6 (Agendamento)..."
```

### Cenário 3: "Play Store rejeitou por X"

```
Motivo: "Data Safety incompleto"

1. Procure "Play Store" → `@M` + `@S` + `@UK`
2. Chamar: "@S e @UK, revisem Data Safety do app. @M verifica submissão."
3. Fix → Resubmeter
```

### Cenário 4: "Quero validação antes de avançar"

```
Situação: Terminei Bloco 5, mas não tenho certeza

1. Chamar: "@Q, teste Bloco 5 (Localização/Busca). PROMPT 8"
2. Se tudo OK: avançar para Bloco 6
3. Se problema: registrar bug, `@B` ou `@GEO` corrige
```

---

## 📋 CHECKLIST ANTES DE CHAMAR CADA AGENTE

### Antes de chamar `@C10` (Maestro)

- [ ] Ler `docs/21_SPEC_TIMELINE_DEPENDENCIES.md`
- [ ] Definir qual bloco quer atacar
- [ ] Revisar STATUS.md para contexto

### Antes de chamar `@A` (Arquiteto)

- [ ] Ler specs técnicas relevantes
- [ ] Ter código (ou sketch) do que pretende
- [ ] Questão clara: "Está desacoplado?" ou "Contratos OK?"

### Antes de chamar `@B` (Backend)

- [ ] Ler spec de API relevante
- [ ] Ter DTOs/payloads definidos
- [ ] Saber qual módulo/serviço afeta

### Antes de chamar `@M` (Mobile)

- [ ] Ler spec de mobile
- [ ] Ter wireframe/user flow da tela
- [ ] Saber qual navegação afeta

### Antes de chamar `@GEO` (Location)

- [ ] Ler `GEO_Location/GEO_Agent_Location.md`
- [ ] Ter query SQL de referência ou pergunta clara

### Antes de chamar `@Q` (QA)

- [ ] Bloco já foi "DONE"
- [ ] Código mergeado e testável
- [ ] Casos críticos listados

### Antes de chamar `@V` (Validator)

- [ ] Todos os blocos que depende estão DONE
- [ ] Testes passam
- [ ] Compilação está verde

---

## 🔥 SITUAÇÕES DE EMERGÊNCIA

| Situação | Ação |
|----------|------|
| **App crasha na tela X** | `@M` debug + `@B` valida backend |
| **Busca não funciona** | `@GEO` + `@P` (performance) |
| **Data Safety rejeitada** | `@S` + `@UK` review |
| **Teste não passa** | `@Q` debug + agente responsável corrige |
| **Agente ficou preso** | `@PR` refina prompt |
| **Dúvida arquitetural** | `@A` valida |
| **Antes de Play Store** | `@V` dá veredito |

---

## 📞 ORDEM CORRETA DE CHAMADAS (Regra de Ouro)

```
1. NUNCA chamar executor sem validação prévia (@A, @V)
2. NUNCA avançar de bloco sem teste passando (@Q)
3. NUNCA submeter Play Store sem @V "VERDE"
4. SEMPRE documentar (@C10) ao final de sessão
5. SEMPRE questionar (@C) antes de decision grande
```

---

## 🎯 RESUMO EM UMA LINHA

**Use esta matriz para saber qual `@AGENTE` chamar em cada situação, seguindo a ordem dos blocos e os gates de validação.**

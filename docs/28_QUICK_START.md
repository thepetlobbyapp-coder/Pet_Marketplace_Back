# ⚡ QUICK START — Comece Fase 1 em 5 Minutos

**Você está aqui:** Validação .codex + Agentes + Prompts = PRONTO  
**Próximo:** Copiar e colar o primeiro prompt  
**Tempo:** 5 minutos

---

## 🎯 O Que Fazer AGORA

### Passo 1: Abra o Template (1 min)

```
Arquivo: docs/26_TEMPLATES_PROMPTS_PRONTOS.md

Procure por: "## TEMPLATE 1: Kickoff Maestro"
```

### Passo 2: Copie o Prompt (2 min)

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

### Passo 3: Cole no Chat (1 min)

```
1. Abra chat do GitHub Copilot
2. Ctrl+V (colar)
3. Envie (Enter)
```

### Passo 4: Aguarde Resposta (1 min)

```
@C10 vai retornar:
- Mapa de 11 blocos
- Agentes por bloco
- Dependências
- Riscos
- Próximo passo
```

---

## ✅ Resultado Esperado

Você recebe um documento estruturado como:

```
## Roadmap Pet Marketplace Fase 1

Bloco 0: Fundação Repo
├─ Agente: @E
├─ Suporte: @C10, @A
├─ Input: Projeto novo
├─ Output: README, env, scripts
└─ Risco: [nenhum | lista]

Bloco 1: Backend Base
├─ Agente: @B
├─ [...]

[11 blocos descritos assim]

Dependências:
Bloco 0 → Bloco 1 → Blocos 2,3 paralelo...

Próximo: Chamar @A para validar arquitetura (TEMPLATE 2)
```

---

## 📌 Depois Do Primeiro Prompt

### Se Recebeu Roadmap (Esperado)
```
Próximo: Abra docs/26_TEMPLATES_PROMPTS_PRONTOS.md
         Copie TEMPLATE 2 (Validação Arquitetura)
         Envie @A
```

### Se Ficou Confuso
```
Próximo: Abra docs/25_MATRIZ_AGENTES_RAPIDA.md
         Procure "Kickoff Maestro"
         Veja qual agente você precisa
```

### Se Quer Entender Melhor Antes
```
Próximo: Leia docs/24_CODEX_AGENTS_PHASE1_PROMPTS.md
         Seção "Parte A: Validação .codex"
         Seção "Parte B: Agentes Essenciais"
```

---

## 🗺️ Fluxo de Prompts (Próximos 10 Passos)

Após Prompt 1 (Kickoff), você vai usar estes na sequência:

| # | Template | Agente | Quando |
|---|----------|--------|--------|
| 1 | Kickoff Maestro | `@C10` | Agora (você está aqui) |
| 2 | Validação Arquitetura | `@A` | Após Prompt 1 |
| 3 | Ceticismo (Riscos) | `@C` | Após Prompt 2 |
| 4 | Impact Validator | `@V` | Após Prompt 3 |
| 5 | Bloco 0 (Repo) | `@E` | Após Prompt 4 VERDE |
| 6 | Bloco 1 (Backend) | `@B` | Após Bloco 0 |
| 7 | PromptOps (refinar) | `@PR` | Se agente ficar preso |
| 8 | Testes (cada bloco) | `@Q` | Após cada bloco |
| 9 | Final Validator | `@V` | Antes Play Store |
| 10 | Documentador | `@C10` | Fim de cada sessão |

**Cada prompt tem um template pronto em `docs/26_TEMPLATES_PROMPTS_PRONTOS.md`**

---

## 🆘 SOS — Algo Deu Errado?

### "O agente não respondeu como esperado"
→ Use `@PR` (PromptOps) para refinar o prompt
→ Template em `docs/26_TEMPLATES_PROMPTS_PRONTOS.md` (TEMPLATE 12)

### "Não sei qual agente chamar"
→ Abra `docs/25_MATRIZ_AGENTES_RAPIDA.md`
→ Procure sua situação na Matriz Rápida

### "Quero entender o conceito"
→ Leia `docs/24_CODEX_AGENTS_PHASE1_PROMPTS.md`
→ Comece pela Parte A (validação .codex)

### "Estou preso em um bloco"
→ Abra `docs/25_MATRIZ_AGENTES_RAPIDA.md`
→ Procure "BLOCO X" e veja agentes/suportes
→ Use template do agente primário em `docs/26_*.md`

---

## 📚 Referência Rápida — Os 3 Documentos Novos

| Documento | Use para... | Busca por... |
|-----------|------------|-------------|
| **24_CODEX_AGENTS** | Entender tudo | "Parte B: Agentes Essenciais" |
| **25_MATRIZ_AGENTES** | Achar agente | "🎯 MATRIZ RÁPIDA" |
| **26_TEMPLATES_PRONTOS** | Copiar/colar | "## TEMPLATE X" |

---

## 🚀 Comece AGORA

```
1. Vá para: docs/26_TEMPLATES_PROMPTS_PRONTOS.md

2. Procure: "## TEMPLATE 1: Kickoff Maestro"

3. Copie: Bloco de markdown inteiro

4. Cole: Chat Copilot

5. Envie: Enter

PRONTO! Primeira prompt rodando.
```

---

## ✨ O Que Você Vai Ter ao Final

Após completar os 10 prompts em ordem:

✅ **Roadmap claro** de 11 blocos  
✅ **Arquitetura validada** (desacoplada)  
✅ **Riscos mapeados** e mitigados  
✅ **Repo setup** pronto  
✅ **Backend** rodando  
✅ **Banco** com schema  
✅ **Mobile** com navegação  
✅ **Cadastro/Perfis** funcional  
✅ **Busca + agendamento** funcionando  
✅ **Chat + denúncias** operacional  
✅ **Testes** validados  
✅ **Ready for Play Store**

**Tempo estimado: 6-8 semanas com 1 dev**

---

## 🎬 Vá!

```bash
# Próximo comando mental:
Abrir: docs/26_TEMPLATES_PROMPTS_PRONTOS.md
Buscar: "TEMPLATE 1"
Copiar: Bloco markdown
Colar: Chat
Enviar: @C10 kickoff

# Estou pronto? SIM ✅
```

---

## Dúvida Final?

**Todos os 3 documentos estão em:** `docs/`

```
docs/24_CODEX_AGENTS_PHASE1_PROMPTS.md    ← Entender
docs/25_MATRIZ_AGENTES_RAPIDA.md          ← Achar
docs/26_TEMPLATES_PROMPTS_PRONTOS.md      ← Copiar
docs/27_SUMARIO_COMPLETO.md               ← Visão geral
```

**Sem mais lacunas. Sem mais dúvidas. Pronto para começar.**

🚀 **Abra o template, copie, cole, envie. Tudo automatizado daqui em diante.**

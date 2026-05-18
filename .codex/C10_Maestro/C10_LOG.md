# LOG — [NOME DO PROJETO]

> Cronologia completa do projeto. Nada é apagado daqui.
> Cada entrada é imutável após ser criada.
> Análises e aprendizados ficam no LEARNINGS.md.
> Este arquivo é fatos, datas, e o que aconteceu.

---

## Como ler este log

- Entradas mais recentes no topo
- Cada entrada tem data, título, e descrição objetiva
- `[OK]` → ciclo encerrado com sucesso
- `[OK*]` → encerrado com ressalvas documentadas
- `[PARCIAL]` → entrega incompleta, continua no próximo ciclo
- `[REVERTIDO]` → implementação foi desfeita

---

<!-- NOVA ENTRADA SEMPRE ACIMA DESTA LINHA -->

---

## 2026-05-18 - Bloco 2B: smoke autenticado de `/me`

**Fase:** DESENVOLVIMENTO / INTEGRACAO BACKEND-SUPABASE
**Agentes ativos:** C10_Maestro, B_BackendDomain, S_Seguranca, O_Observability
**O que aconteceu:** Gerado token local para usuario de teste sem expor segredo; validado `GET /api/v1/me` com backend local; sincronizacao `auth.users -> public.users` executada para `admin@teste.com`; role fallback `tutor` criada em `public.user_roles`; smokes e validacoes passaram.
**Arquivos criados/alterados:**
  - scripts/auth/get-block2b-token.mjs
  - scripts/db/smoke-me-authenticated.mjs
  - package.json
  - docs/PROGRESS.md
  - .codex/C10_Maestro/C10_LOG.md
**Status:** [OK]

---

## [DATA] — INÍCIO DO PROJETO

**Fase:** CONCEPÇÃO
**Agentes ativos:** CAMISA10
**O que aconteceu:** Onboarding concluído. PROJECT.md, STATUS.md, LOG.md,
DECISIONS.md, LEARNINGS.md e claude.md criados na raiz do projeto.
**Arquivos criados:**
  - PROJECT.md
  - STATUS.md
  - LOG.md
  - DECISIONS.md
  - LEARNINGS.md
  - claude.md
**Status:** [OK]

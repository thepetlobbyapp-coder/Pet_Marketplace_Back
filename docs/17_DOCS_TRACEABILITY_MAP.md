# 17 — Mapa de Rastreabilidade entre Documentos

Este documento conecta as especificações do projeto para evitar que agentes ou desenvolvedores implementem funcionalidades fora de contexto.

## Fonte oficial

A fonte oficial do projeto é a pasta `docs/`.

Ordem obrigatória de leitura:

1. `00_INDICE_DOCUMENTACAO.md`
2. `01_ESCOPO_CLIENTE_LINGUAGEM_NATURAL.md`
3. `02_DOCUMENTACAO_TECNICA_PROJETO.md`
4. `03_SPEC_PRODUCT.md`
5. Documento específico da área de atuação do agente

## Mapa de dependência entre specs

| Documento | Depende de | Alimenta |
|---|---|---|
| `03_SPEC_PRODUCT.md` | Escopo do cliente | Mobile, API, Admin, Database |
| `04_SPEC_USER_FLOWS.md` | Produto | Mobile, API, Admin, Testes |
| `05_SPEC_API.md` | Produto, User Flows, Database | Backend, Mobile, Admin, Testes |
| `06_SPEC_DATABASE.md` | Produto, API, Privacidade | Backend, Migrations, Rollback |
| `07_SPEC_MOBILE.md` | Produto, API, Design, Play Store | App Android |
| `08_SPEC_ADMIN.md` | Produto, API, Operação | Painel Admin |
| `09_SPEC_DESIGN_SYSTEM.md` | Produto, Play Store, Apple futura | Mobile, Admin |
| `10_SPEC_PLAYSTORE_RELEASE.md` | Mobile, Privacidade, Testes | Release Android |
| `11_SPEC_PRIVACY_DATA_SAFETY.md` | Produto, Database, API | Play Store, Segurança, UX |
| `12_SPEC_OPERATIONS_MODERATION.md` | Produto, Admin, Trust/Safety | Admin, Suporte, Métricas |
| `13_SPEC_NOTIFICATIONS.md` | User Flows, API, Mobile | Mobile, Backend |
| `14_SPEC_TEST_PLAN.md` | Todas as specs | QA, Release |
| `15_SPEC_MIGRATIONS_ROLLBACK.md` | Database, API | Backend, DevOps |
| `16_RISK_REGISTER.md` | Todas as specs | Decisões de produto |
| `18_SPEC_DATABASE_SQL_DRAFT.md` | Database | Backend, Migrations |
| `19_SPEC_API_EXAMPLES.md` | API | Backend, Mobile, Admin |
| `20_SPEC_KPIS_SLA.md` | Produto, Operação | Admin, Métricas |
| `21_SPEC_TIMELINE_DEPENDENCIES.md` | Produto, Specs técnicas | Planejamento |
| `22_GLOSSARY.md` | Todas as specs | Padronização de termos |

## Regra para agentes

Antes de implementar qualquer módulo, o agente deve responder:

- qual documento consultou;
- quais requisitos serão implementados;
- quais requisitos ficaram fora;
- quais riscos ou ambiguidades encontrou;
- quais arquivos serão criados ou alterados.

## Regra para mudanças de escopo

Qualquer alteração de escopo deve atualizar, no mínimo:

1. `03_SPEC_PRODUCT.md`
2. spec técnica afetada;
3. `16_RISK_REGISTER.md`, se criar risco;
4. `20_SPEC_KPIS_SLA.md`, se afetar operação;
5. `22_GLOSSARY.md`, se introduzir novo termo.

## Convenção de status

Cada requisito pode receber um dos status:

- `PLANNED`: previsto, ainda não implementado.
- `IN_PROGRESS`: em implementação.
- `DONE`: implementado e testado.
- `DEFERRED`: adiado para fase futura.
- `OUT_OF_SCOPE`: fora do escopo contratado.
- `BLOCKED`: depende de decisão externa.


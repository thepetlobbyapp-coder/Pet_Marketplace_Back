# 21 — Timeline Técnica e Dependências

Este documento organiza a implementação em blocos. Não é orçamento e não é promessa contratual. Serve para orientar execução individual e agentes.

## Premissas

- Equipe: 1 desenvolvedor.
- Fase 1 sem pagamento.
- Testes locais primeiro.
- Android/Play Store como prioridade.
- iOS preparado tecnicamente, mas publicação futura.
- Chat apenas texto.
- Sem documentos obrigatórios de prestadores.
- Sem home boarding comercial na Fase 1.

## Ordem recomendada de implementação

### Bloco 0 — Fundação do repositório

Dependências: nenhuma.

Entregas:

- estrutura de pastas;
- configuração TypeScript;
- lint/format;
- env examples;
- README principal;
- scripts de dev;
- convenções de commits;
- documentação conectada.

### Bloco 1 — Backend base

Depende de: Bloco 0.

Entregas:

- NestJS;
- health check;
- configuração Supabase;
- autenticação;
- RBAC;
- padrão de erro;
- logging;
- estrutura de módulos.

### Bloco 2 — Banco e migrations

Depende de: Bloco 1.

Entregas:

- PostGIS;
- tabelas base;
- seeds de serviços;
- migrations versionadas;
- rollback básico;
- políticas mínimas de segurança.

### Bloco 3 — Mobile base

Depende de: Bloco 0.

Entregas:

- Expo/React Native;
- navegação;
- tema visual;
- i18n en-GB;
- telas base;
- integração com auth;
- configuração Android.

### Bloco 4 — Cadastro e perfis

Depende de: Blocos 1, 2, 3.

Entregas:

- cadastro/login;
- perfil tutor;
- perfil prestador;
- cadastro de pet;
- cadastro de endereço;
- fluxo de onboarding.

### Bloco 5 — Localização e busca

Depende de: Blocos 2 e 4.

Entregas:

- geocoding;
- armazenamento de localização;
- busca por raio com PostGIS;
- filtros;
- proteção de endereço exato;
- listagem de prestadores.

### Bloco 6 — Agendamento

Depende de: Blocos 4 e 5.

Entregas:

- disponibilidade do prestador;
- solicitação de agendamento;
- aceitar/recusar;
- status;
- histórico.

### Bloco 7 — Chat texto

Depende de: Bloco 6.

Entregas:

- conversa por booking aceito;
- envio/recebimento de mensagens;
- bloqueio de chat fora de contexto;
- limites de texto;
- denúncia a partir do chat.

### Bloco 8 — Avaliações e denúncias

Depende de: Blocos 6 e 7.

Entregas:

- avaliação bidirecional;
- denúncia;
- status de denúncia;
- regras de bloqueio.

### Bloco 9 — Admin

Depende de: Blocos 1, 2, 4, 8.

Entregas:

- login admin;
- lista de usuários;
- aprovação/suspensão de prestadores;
- denúncias;
- agendamentos;
- ações administrativas auditáveis.

### Bloco 10 — Notificações

Depende de: Blocos 6, 7, 8.

Entregas:

- notificações locais/push;
- eventos de agendamento;
- eventos de chat;
- eventos de denúncia/suporte;
- preferências básicas.

### Bloco 11 — QA e Play Store readiness

Depende de: todos os blocos anteriores.

Entregas:

- testes de fluxos críticos;
- build Android;
- checklist Play Store;
- privacy policy;
- Data Safety;
- conta demo;
- App Access instructions;
- screenshots;
- revisão final.

## Estimativa de esforço por bloco

Estimativa em dias úteis focados, sujeita a variações.

| Bloco | Esforço aproximado |
|---|---:|
| 0 — Fundação | 1 a 2 dias |
| 1 — Backend base | 2 a 4 dias |
| 2 — Banco/migrations | 2 a 4 dias |
| 3 — Mobile base | 2 a 4 dias |
| 4 — Cadastro/perfis | 4 a 7 dias |
| 5 — Localização/busca | 3 a 6 dias |
| 6 — Agendamento | 4 a 7 dias |
| 7 — Chat texto | 3 a 5 dias |
| 8 — Avaliações/denúncias | 3 a 5 dias |
| 9 — Admin | 4 a 8 dias |
| 10 — Notificações | 2 a 5 dias |
| 11 — QA/Play Store | 4 a 8 dias |

## Caminho crítico

O caminho crítico é:

```txt
Backend base
→ Banco/PostGIS
→ Auth/perfis
→ Localização/busca
→ Agendamento
→ Chat
→ Admin/moderação
→ QA/Play Store
```

## Dependências externas

| Dependência | Impacto |
|---|---|
| Conta Google Play Developer | Necessária para publicação |
| Nome do app | Necessário para store listing |
| Logo/ícone | Necessário para build e loja |
| Política de privacidade | Necessária para Play Store |
| E-mail de suporte | Necessário para loja e app |
| Domínio/site de suporte | Recomendado para loja |
| Chaves Supabase | Necessário para dev |
| Chave de mapa/geocoding | Necessário para localização |
| Conta Expo/EAS | Necessário para build nativo |

## Bloqueios conhecidos

- Sem nome final do app, o branding pode ficar temporário.
- Sem política de privacidade publicada em URL pública, Play Store pode bloquear submissão.
- Sem conta demo para review, Play Store pode rejeitar ou atrasar análise.
- Sem textos en-GB revisados, UX e store listing podem parecer amadores.


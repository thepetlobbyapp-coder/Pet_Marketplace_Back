# 20 — KPIs e SLAs da Fase 1

Este documento define métricas práticas para validar se a Fase 1 está funcionando.

Como a equipe é composta por uma pessoa, os SLAs são metas operacionais realistas para MVP, não garantias contratuais rígidas.

## Objetivo da Fase 1

Validar o fluxo principal sem pagamento:

1. tutor cria conta;
2. tutor cadastra pet;
3. tutor busca prestadores próximos;
4. tutor solicita agendamento;
5. prestador aceita ou recusa;
6. chat texto funciona;
7. serviço pode ser concluído;
8. avaliações e denúncias funcionam;
9. admin consegue moderar e bloquear usuários.

## KPIs de produto

| Métrica | Meta inicial | Como medir |
|---|---:|---|
| Cadastro concluído de tutor | 80% dos usuários que começam cadastro | Evento `owner_signup_completed` |
| Cadastro concluído de prestador | 60% dos prestadores que começam cadastro | Evento `provider_signup_completed` |
| Busca com resultado | 70% das buscas em áreas atendidas | Evento `provider_search_performed` |
| Solicitação de agendamento | 20% dos tutores ativos | Evento `booking_requested` |
| Aceite de agendamento | 50% das solicitações | Evento `booking_accepted` |
| Mensagens enviadas | 1+ mensagem por agendamento aceito | Evento `message_sent` |
| Avaliação após conclusão | 40% dos serviços concluídos | Evento `review_created` |
| Denúncias tratadas | 100% das denúncias críticas | Admin status de denúncias |

## KPIs técnicos

| Métrica | Meta MVP |
|---|---:|
| Crash-free sessions Android | >= 98% |
| Tempo de resposta API p95 | <= 800ms em endpoints comuns |
| Busca geográfica p95 | <= 1200ms em base inicial |
| Taxa de erro 5xx API | < 1% |
| Tempo de abertura do app | <= 3s em aparelho intermediário |
| Build Android release | reproduzível via EAS |
| Cobertura mínima de testes críticos | 70% dos fluxos principais |

## SLAs operacionais sugeridos

### Denúncia crítica

Exemplos:

- ameaça;
- assédio;
- risco ao pet;
- comportamento abusivo;
- suspeita de fraude.

Meta:

```txt
Primeira análise: até 24 horas úteis
Ação temporária, quando necessário: imediata após análise
```

### Denúncia comum

Exemplos:

- comentário inadequado;
- desacordo sobre atendimento;
- problema de comunicação.

Meta:

```txt
Primeira análise: até 3 dias úteis
Resolução: conforme complexidade
```

### Solicitação de suporte comum

Meta:

```txt
Primeira resposta: até 3 dias úteis
```

### Exclusão de conta

Meta operacional:

```txt
Solicitação recebida pelo app: imediata
Processamento técnico: conforme regras de retenção e histórico operacional
```

## Eventos mínimos de analytics

Eventos devem evitar dados pessoais desnecessários.

```txt
app_opened
signup_started
owner_signup_completed
provider_signup_completed
pet_created
address_added
provider_search_performed
provider_profile_viewed
booking_requested
booking_accepted
booking_declined
message_sent
booking_completed
review_created
report_created
account_deletion_requested
```

## Métricas que não devem ser usadas na Fase 1

- receita;
- GMV;
- comissão;
- payout;
- conversão de pagamento;
- chargeback;
- dispute rate.

Essas métricas pertencem à Fase 2, com pagamentos.

## Painel admin mínimo

O admin deve permitir visualizar:

- usuários ativos;
- prestadores pendentes;
- prestadores aprovados;
- agendamentos por status;
- denúncias abertas;
- denúncias críticas;
- contas suspensas;
- erros recentes, se integrado ao monitoramento.


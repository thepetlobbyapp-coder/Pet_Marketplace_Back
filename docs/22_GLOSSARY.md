# 22 — Glossário do Projeto

Este documento centraliza termos para evitar inconsistência entre app, API, admin, documentação e textos em inglês.

## Idiomas

| Contexto | Idioma |
|---|---|
| Documentação técnica interna | pt-BR |
| App final | en-GB |
| Store listing | en-GB |
| Privacy Policy / Terms | en-GB |
| Comentários técnicos em código | inglês simples ou padrão do projeto |

## Termos de domínio

| pt-BR interno | en-GB recomendado | Observação |
|---|---|---|
| Tutor | Pet owner | Usuário que contrata serviço para o pet |
| Prestador | Pet care provider | Pessoa que oferece serviços |
| Pet | Pet | Animal cadastrado pelo tutor |
| Agendamento | Booking | Solicitação/reserva de serviço |
| Solicitação de agendamento | Booking request | Antes do aceite |
| Aceitar agendamento | Accept booking | Ação do prestador |
| Recusar agendamento | Decline booking | Ação do prestador |
| Concluir serviço | Mark as completed | Sem pagamento na Fase 1 |
| Avaliação | Review | Nota e comentário |
| Denúncia | Report | Reportar usuário/comportamento |
| Suporte | Support | Atendimento administrativo |
| Área de atendimento | Service area | Região atendida pelo prestador |
| Raio de busca | Search radius | Filtro definido pelo usuário |
| Distância aproximada | Approximate distance | Nunca exibir endereço exato |
| Mural comunitário | Community feed | Se entrar na fase atual/futura |
| Chat interno | In-app chat | Fase 1 apenas texto |

## Serviços permitidos na Fase 1

| Código | Nome en-GB | Entra na Fase 1? |
|---|---|---|
| `DOG_WALKING` | Dog walking | Sim |
| `PET_SITTING_OWNER_HOME` | Pet sitting at owner home | Sim |
| `DROP_IN_VISIT` | Drop-in visit | Sim |
| `HOME_BOARDING` | Home boarding | Não |
| `DAY_CARE_AT_PROVIDER_HOME` | Day care at provider home | Não |
| `GROOMING` | Grooming | Futuro |
| `PET_TRANSPORT` | Pet transport | Futuro |

## Termos que devem ser evitados

Evitar no app e na loja:

| Termo | Motivo |
|---|---|
| Verified provider | Só usar se houver verificação real |
| Licensed provider | Só usar se a plataforma validar licença |
| Guaranteed safety | Promessa jurídica perigosa |
| Escrow | Não há pagamento/custódia na Fase 1 |
| Background checked | Só usar se houver checagem real |
| DBS checked | Só usar se houver checagem DBS real |
| Insured | Só usar se seguro for validado |

## Termos seguros

| Termo | Uso recomendado |
|---|---|
| Profile reviewed | Se o admin revisar o perfil |
| Approved provider profile | Se o admin aprovar cadastro |
| Report a concern | Para denúncia sem acusação direta |
| Approximate distance | Para privacidade geográfica |
| Booking request | Para reserva sem pagamento |
| In-app messaging | Para chat texto |

## Status de usuário

| Status | Significado |
|---|---|
| `ACTIVE` | Conta ativa |
| `SUSPENDED` | Conta bloqueada temporária ou administrativamente |
| `DELETED` | Conta excluída ou desativada conforme política |

## Status de prestador

| Status | Significado |
|---|---|
| `DRAFT` | Perfil iniciado, incompleto |
| `PENDING_REVIEW` | Aguardando análise admin |
| `APPROVED` | Pode aparecer na busca |
| `REJECTED` | Não aprovado |
| `SUSPENDED` | Oculto/bloqueado pelo admin |

## Status de agendamento

| Status | Significado |
|---|---|
| `REQUESTED` | Tutor solicitou |
| `ACCEPTED` | Prestador aceitou |
| `DECLINED` | Prestador recusou |
| `CANCELLED_BY_OWNER` | Tutor cancelou |
| `CANCELLED_BY_PROVIDER` | Prestador cancelou |
| `COMPLETED` | Serviço marcado como concluído |
| `NO_SHOW` | Uma das partes não compareceu |
| `DISPUTED` | Existe problema/denúncia associada |

## Microcopy inicial em inglês

| Chave | Texto en-GB |
|---|---|
| `booking.request.sendButton` | Send booking request |
| `booking.status.requested` | Booking requested |
| `booking.status.accepted` | Booking accepted |
| `provider.search.empty` | No pet care providers found nearby. Try increasing your search radius. |
| `chat.placeholder` | Write a message |
| `report.action` | Report a concern |
| `location.approxDistance` | Approximately {{distance}} away |
| `profile.notVerifiedDisclaimer` | Provider profiles are reviewed by the platform, but licences or background checks are not verified in this phase. |


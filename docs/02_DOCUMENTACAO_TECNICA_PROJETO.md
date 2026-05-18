# Documentação Técnica — Pet Care Marketplace UK

**Versão:** 1.1  
**Idioma do documento:** Português do Brasil  
**Idioma final do aplicativo:** Inglês britânico (`en-GB`)  
**Prioridade:** Android / Google Play Store primeiro  
**Objetivo:** orientar agentes, arquitetura, specs, fases e critérios técnicos

---

## 1. Decisões travadas

- O produto é um marketplace de cuidadores de pets no Reino Unido.
- O app será mobile-first, publicado primeiro na Google Play Store.
- O app final deve nascer em inglês britânico (`en-GB`).
- A equipe pode trabalhar internamente em português.
- Não usar Flutter.
- Usar React Native + Expo + TypeScript para o app mobile.
- Usar NestJS + TypeScript para o backend.
- O backend é o cérebro da aplicação.
- Usar Supabase PostgreSQL com PostGIS para banco e consultas geográficas.
- Usar Supabase Auth, salvo decisão técnica posterior diferente.
- Usar Supabase Storage apenas quando houver necessidade real de arquivos.
- Na Fase 1, o chat será somente texto.
- Na Fase 1, não haverá pagamento.
- Na Fase 1, não haverá upload obrigatório de documentos do prestador.
- Na Fase 1, não haverá home boarding comercial.
- Testes iniciais serão locais, sem publicação do front mobile na Vercel.
- O painel administrativo pode ser web local no desenvolvimento e futuramente hospedado quando necessário.

---

## 2. Estrutura recomendada do repositório

```txt
/apps/mobile
  React Native + Expo + TypeScript

/apps/admin
  Next.js + TypeScript + Tailwind + shadcn/ui

/apps/api
  NestJS + TypeScript

/packages/shared
  Tipos compartilhados, DTOs, schemas Zod, constantes, enums

/docs
  Documentação comercial, técnica, publicação, design, privacidade e decisões

/.codex
  Agentes e templates do projeto
```

---

## 3. Aplicações do sistema

### 3.1 Mobile app

Aplicativo usado por tutores e prestadores.

Responsabilidades:

- onboarding;
- login;
- cadastro de perfil;
- cadastro de pets;
- busca por prestadores;
- filtros por distância;
- visualização de perfil do prestador;
- solicitação de agendamento;
- chat texto;
- avaliações;
- denúncias;
- configurações de conta;
- exclusão de conta;
- consentimentos e permissões.

### 3.2 Admin web

Painel usado pela equipe operacional.

Responsabilidades:

- visualizar usuários;
- bloquear/desbloquear usuários;
- visualizar prestadores;
- visualizar agendamentos;
- analisar denúncias;
- moderar avaliações ou conteúdo reportado;
- acompanhar métricas básicas;
- preparar operação futura de pagamentos.

### 3.3 Backend API

Aplicação central de regras de negócio.

Responsabilidades:

- autorização;
- regras de negócio;
- busca geográfica;
- criação e transição de status de agendamento;
- validação de permissões;
- moderação;
- logs de auditoria;
- integração futura com pagamentos;
- webhooks futuros;
- isolamento entre usuário, prestador e admin;
- APIs consumidas pelo mobile e admin.

### 3.4 Banco de dados

Supabase PostgreSQL com PostGIS.

Responsabilidades:

- persistência;
- dados relacionais;
- coordenadas geográficas;
- índices espaciais;
- histórico de status;
- auditoria mínima;
- suporte a RLS onde fizer sentido.

---

## 4. Stack técnica

### 4.1 Mobile

- React Native;
- Expo;
- TypeScript;
- Expo Router ou React Navigation;
- TanStack Query para estado assíncrono;
- Zustand para estado local simples, se necessário;
- i18n desde o início;
- EAS Build para builds nativas;
- Sentry para erros, quando viável.

### 4.2 Admin

- Next.js;
- TypeScript;
- Tailwind CSS;
- shadcn/ui;
- TanStack Query;
- autenticação via Supabase/Auth ou backend;
- RBAC obrigatório para rotas administrativas.

### 4.3 Backend

- NestJS;
- TypeScript;
- PostgreSQL;
- PostGIS;
- Supabase client ou Prisma com cuidado para PostGIS;
- OpenAPI/Swagger para documentação da API;
- Zod ou class-validator para validação;
- rate limit;
- logging estruturado;
- testes unitários e de integração.

### 4.4 Banco/infra

- Supabase PostgreSQL;
- extensão PostGIS;
- migrations versionadas;
- backups conforme plano contratado;
- ambientes separados: local, staging e produção futura.

---

## 5. Entidades principais

### 5.1 User

Representa a conta base.

Campos sugeridos:

- id;
- email;
- phone;
- role flags ou relação com roles;
- status;
- created_at;
- updated_at;
- deleted_at.

### 5.2 TutorProfile

Perfil de tutor.

Campos sugeridos:

- id;
- user_id;
- display_name;
- preferred_contact_method;
- default_address_id;
- created_at;
- updated_at.

### 5.3 Pet

Pet cadastrado pelo tutor.

Campos sugeridos:

- id;
- tutor_profile_id;
- name;
- species;
- breed;
- size;
- age_range;
- notes;
- special_needs;
- created_at;
- updated_at.

### 5.4 ProviderProfile

Perfil do prestador.

Campos sugeridos:

- id;
- user_id;
- display_name;
- bio;
- experience_summary;
- service_radius_meters;
- base_location geography(Point, 4326);
- approximate_area_label;
- status;
- created_at;
- updated_at.

Status sugeridos:

- draft;
- active;
- paused;
- blocked.

Não usar status como `verified` na Fase 1, pois o app não fará verificação formal.

### 5.5 Address

Endereço usado para geocodificação e busca.

Campos sugeridos:

- id;
- user_id;
- label;
- address_line_1;
- address_line_2;
- city;
- postcode;
- country;
- latitude;
- longitude;
- geo geography(Point, 4326);
- is_default;
- created_at;
- updated_at.

Observação: endereço completo não deve ser exposto publicamente.

### 5.6 ServiceType

Tipos de serviço.

Exemplos iniciais:

- dog_walking;
- pet_sitting_at_owner_home;
- drop_in_visit;
- feeding_visit;
- companionship.

Fora da Fase 1:

- commercial_home_boarding;
- commercial_daycare;
- veterinary_service;
- grooming;
- pet_transport.

### 5.7 ProviderService

Serviços oferecidos pelo prestador.

Campos sugeridos:

- id;
- provider_profile_id;
- service_type;
- title;
- description;
- price_amount;
- price_currency;
- duration_minutes;
- active;
- created_at;
- updated_at.

Preço é apenas informativo na Fase 1.

### 5.8 AvailabilitySlot

Disponibilidade do prestador.

Campos sugeridos:

- id;
- provider_profile_id;
- weekday;
- start_time;
- end_time;
- timezone;
- active.

### 5.9 Booking

Solicitação/agendamento.

Campos sugeridos:

- id;
- tutor_profile_id;
- provider_profile_id;
- pet_id;
- provider_service_id;
- requested_start_at;
- requested_end_at;
- status;
- notes;
- created_at;
- updated_at.

Status sugeridos:

- requested;
- accepted;
- declined;
- cancelled_by_tutor;
- cancelled_by_provider;
- completed;
- disputed_non_financial.

### 5.10 ChatThread

Thread de conversa vinculada a um booking.

Campos sugeridos:

- id;
- booking_id;
- tutor_profile_id;
- provider_profile_id;
- status;
- created_at;
- updated_at.

### 5.11 ChatMessage

Mensagem de texto.

Campos sugeridos:

- id;
- thread_id;
- sender_user_id;
- body;
- created_at;
- edited_at;
- deleted_at;
- moderation_status.

Na Fase 1, `body` deve aceitar somente texto. Sem anexos.

### 5.12 Review

Avaliação.

Campos sugeridos:

- id;
- booking_id;
- reviewer_user_id;
- reviewed_user_id;
- rating;
- comment;
- status;
- created_at;
- updated_at.

Status:

- visible;
- hidden_by_admin;
- reported;
- removed.

### 5.13 Report

Denúncia/suporte.

Campos sugeridos:

- id;
- reporter_user_id;
- target_type;
- target_id;
- reason;
- details;
- status;
- admin_notes;
- created_at;
- updated_at.

Status:

- open;
- in_review;
- resolved;
- rejected.

### 5.14 AuditLog

Registro de ações sensíveis.

Campos sugeridos:

- id;
- actor_user_id;
- action;
- entity_type;
- entity_id;
- metadata;
- created_at.

---

## 6. Busca geográfica com PostGIS

A busca por prestadores deve usar PostGIS.

### 6.1 Objetivo

Permitir buscar prestadores próximos ao endereço/região do tutor de forma eficiente, segura e escalável.

### 6.2 Regras

- O backend recebe o ponto geográfico do tutor ou endereço selecionado.
- O backend aplica filtros de distância usando PostGIS.
- O banco usa índice espacial para performance.
- A API retorna distância aproximada.
- A API não retorna coordenadas exatas de outros usuários.
- O app não calcula distância crítica no client.

### 6.3 Benefícios

- Melhor performance em consultas por raio.
- Menor exposição de dados sensíveis.
- Menos lógica sensível no app.
- Resultados mais consistentes.
- Melhor base para filtros futuros.

### 6.4 Exemplo conceitual

```sql
SELECT *
FROM provider_profiles
WHERE status = 'active'
AND ST_DWithin(
  base_location,
  ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
  :radius_meters
);
```

### 6.5 Índice recomendado

```sql
CREATE INDEX provider_profiles_base_location_gix
ON provider_profiles
USING GIST (base_location);
```

---

## 7. Permissões e privacidade

### 7.1 Permissões Android

A Fase 1 deve minimizar permissões.

Permissões prováveis:

- localização aproximada ou precisa, somente se realmente necessária;
- notificações, se houver push;
- internet.

Evitar na Fase 1:

- câmera;
- galeria/fotos;
- microfone;
- contatos;
- SMS;
- chamadas;
- arquivos do dispositivo;
- localização em background.

### 7.2 Localização

A localização deve ser solicitada em contexto, por exemplo, quando o usuário quiser buscar prestadores próximos.

O usuário deve poder usar endereço digitado caso não queira conceder localização.

Não usar localização em background na Fase 1.

### 7.3 Dados pessoais

Dados pessoais devem ser coletados apenas quando necessários para a funcionalidade.

Dados prováveis:

- nome;
- e-mail;
- telefone, se necessário;
- endereço;
- localização aproximada;
- informações de pets;
- mensagens de chat;
- avaliações;
- denúncias.

### 7.4 Exclusão de conta

Como o app permite criação de conta, deve haver fluxo de exclusão de conta:

- dentro do app;
- com link externo para solicitação, quando exigido pela Play Console;
- com explicação sobre retenção de dados quando houver motivo legítimo.

### 7.5 Política de privacidade

A política de privacidade deve ser pública, não geobloqueada, não editável pelo usuário e disponível por URL.

Também deve haver acesso à política dentro do app.

---

## 8. Play Store — requisitos desde o início

### 8.1 Antes do envio

Checklist mínimo:

- app estável;
- sem telas placeholder;
- sem funcionalidades anunciadas e não implementadas;
- descrição da loja compatível com o que o app realmente faz;
- política de privacidade disponível;
- Data Safety preenchido corretamente;
- conta de teste fornecida para revisão;
- backend ativo durante review;
- permissões justificadas;
- exclusão de conta disponível;
- suporte/contato visível;
- classificação etária respondida corretamente;
- SDKs revisados.

### 8.2 Data Safety

A seção Data Safety deve ser consistente com:

- código real;
- SDKs usados;
- política de privacidade;
- textos do app;
- finalidade real dos dados.

### 8.3 App Access

Se o app exigir login, a Play Console deve receber:

- usuário de teste;
- senha de teste;
- instruções claras;
- perfil de tutor e/ou prestador preparado;
- dados suficientes para navegar pelo app.

### 8.4 Metadados

A descrição da Play Store não deve prometer:

- pagamento integrado na Fase 1;
- verificação formal de prestadores;
- prestadores licenciados;
- seguro;
- atendimento veterinário;
- home boarding;
- garantia de serviço.

---

## 9. Apple App Store — preparação futura

Mesmo que a publicação inicial seja Android, o projeto deve evitar decisões que prejudiquem iOS.

### 9.1 Requisitos gerais futuros

- app completo no envio;
- metadados precisos;
- conta de demonstração;
- backend ativo;
- política de privacidade;
- permissões justificadas;
- design de qualidade;
- estabilidade;
- conformidade com pagamentos para serviços físicos fora do app.

### 9.2 Pagamentos futuros

Como os serviços são físicos e realizados fora do aplicativo, pagamentos futuros podem usar gateway externo. Ainda assim, a implementação final deve ser revisada contra as regras vigentes da Apple no momento da submissão.

---

## 10. Design system

### 10.1 Objetivo

Criar uma interface clara, acessível, confiável e adequada para marketplace de pet care.

### 10.2 Direção de produto

O design deve transmitir:

- confiança;
- cuidado;
- segurança;
- proximidade;
- simplicidade;
- profissionalismo.

Evitar:

- visual infantilizado;
- excesso de animações;
- telas poluídas;
- linguagem exageradamente informal;
- dark patterns;
- botões enganosos;
- promessas não comprovadas.

### 10.3 Base Android

Usar Material Design 3 como referência principal.

Requisitos:

- navegação consistente;
- componentes previsíveis;
- estados de loading;
- estados vazios;
- estados de erro;
- feedback de ação;
- botões com área mínima confortável;
- contraste adequado;
- suporte a fontes dinâmicas quando possível;
- layout responsivo para tamanhos diferentes.

### 10.4 Compatibilidade futura com iOS

Evitar dependência excessiva de padrões exclusivamente Android.

O design deve ser adaptável para:

- iOS navigation patterns;
- safe areas;
- gestos;
- permissões iOS;
- Human Interface Guidelines.

### 10.5 Tokens iniciais

Definir tokens no projeto:

- colors;
- spacing;
- typography;
- radius;
- shadows/elevation;
- icon sizes;
- touch targets;
- z-index/elevation;
- semantic colors: success, warning, danger, info.

### 10.6 Componentes mínimos

- Button;
- TextInput;
- TextArea;
- Select;
- Chip/FilterChip;
- Card;
- Avatar placeholder;
- Badge;
- Rating;
- EmptyState;
- ErrorState;
- LoadingState;
- ScreenHeader;
- BottomNavigation;
- Modal/BottomSheet;
- Toast/Snackbar;
- PermissionPrompt;
- ConfirmationDialog.

### 10.7 Telas mínimas

Tutor:

- onboarding;
- login;
- cadastro;
- home/busca;
- filtros;
- perfil do prestador;
- pets;
- criar/editar pet;
- solicitar agendamento;
- detalhe do agendamento;
- chat;
- avaliação;
- denúncia;
- configurações;
- exclusão de conta.

Prestador:

- onboarding de prestador;
- perfil profissional;
- serviços;
- preços informativos;
- raio de atendimento;
- disponibilidade;
- solicitações;
- detalhe do agendamento;
- chat;
- avaliações recebidas;
- configurações.

Admin:

- login admin;
- dashboard;
- usuários;
- prestadores;
- agendamentos;
- denúncias;
- avaliações reportadas;
- auditoria básica.

---

## 11. Fluxos principais

### 11.1 Tutor encontra prestador

1. Tutor faz login.
2. Tutor cadastra endereço ou usa localização.
3. Tutor escolhe raio de busca.
4. Backend consulta prestadores com PostGIS.
5. App exibe prestadores próximos.
6. Tutor aplica filtros.
7. Tutor abre perfil do prestador.

### 11.2 Tutor solicita agendamento

1. Tutor seleciona serviço.
2. Tutor seleciona pet.
3. Tutor escolhe data/hora.
4. Tutor envia observações.
5. Backend cria booking com status `requested`.
6. Prestador recebe solicitação.

### 11.3 Prestador responde

1. Prestador visualiza solicitação.
2. Prestador aceita ou recusa.
3. Backend atualiza status.
4. Chat é liberado quando aplicável.
5. Tutor recebe atualização.

### 11.4 Serviço concluído

1. Prestador ou tutor marca serviço como concluído.
2. Backend valida transição de status.
3. Sistema libera avaliação.
4. Usuários avaliam.

### 11.5 Denúncia

1. Usuário abre denúncia a partir de perfil, chat, booking ou avaliação.
2. Backend registra denúncia.
3. Admin recebe no painel.
4. Admin analisa e toma ação.

---

## 12. Segurança

### 12.1 Princípios

- backend valida tudo;
- client nunca é fonte de verdade;
- usuários só acessam seus próprios dados;
- admin tem permissões separadas;
- logs para ações sensíveis;
- dados sensíveis minimizados;
- HTTPS obrigatório em produção;
- segredos fora do código;
- validação de input em todas as camadas.

### 12.2 Autorização

Regras mínimas:

- tutor só acessa seus pets;
- tutor só acessa seus bookings;
- prestador só acessa bookings direcionados a ele;
- chat só é acessível pelos participantes do booking;
- admin acessa dados via permissões específicas;
- usuário bloqueado não pode criar booking ou enviar chat.

### 12.3 Rate limit

Aplicar rate limit em:

- login;
- cadastro;
- busca;
- envio de mensagem;
- criação de denúncia;
- criação de agendamento.

---

## 13. Observabilidade

Para MVP:

- logs estruturados no backend;
- captura de erros mobile;
- logs de ações administrativas;
- monitoramento básico de API;
- métricas de bookings, usuários e denúncias.

Futuro:

- Sentry;
- dashboards;
- alertas;
- tracing.

---

## 14. Testes

### 14.1 Mobile

- testes de telas principais;
- testes de navegação;
- testes de permissões;
- testes em dispositivo Android real;
- testes de login/logout;
- testes de estados offline/erro;
- testes de acessibilidade básica.

### 14.2 Backend

- testes unitários de services;
- testes de autorização;
- testes de transição de booking;
- testes de busca geográfica;
- testes de chat;
- testes de denúncias;
- testes de rate limit.

### 14.3 Admin

- testes de login admin;
- testes de permissões;
- testes de listagem;
- testes de moderação;
- testes de bloqueio/desbloqueio.

---

## 15. Critérios de aceite da Fase 1

A Fase 1 só pode ser considerada pronta quando:

- tutor consegue criar conta;
- tutor consegue cadastrar pet;
- tutor consegue buscar prestadores por distância;
- prestador consegue criar perfil;
- prestador consegue definir serviços e raio;
- tutor consegue solicitar agendamento;
- prestador consegue aceitar/recusar;
- chat texto funciona entre as partes autorizadas;
- avaliação funciona após conclusão;
- denúncia funciona;
- admin consegue visualizar e agir sobre denúncias;
- exclusão de conta existe;
- política de privacidade está acessível;
- permissões são mínimas e justificadas;
- Data Safety pode ser preenchido com base no comportamento real;
- app passa checklist interna de Play Store;
- não há promessas falsas nos textos.

---

## 16. Agentes responsáveis sugeridos

### C10_Maestro

Coordena decisões, fases e documentação.

### A_Architecture

Garante coerência cross-stack.

### M_MobilePlaystore

Responsável por app mobile, Play Store, build, permissões, qualidade e release Android.

### D_Design

Responsável por UI/UX e design system.

### B_BackendDomain

Responsável por NestJS, domínio, APIs, regras e banco.

### GEO_Location

Responsável por geolocalização, PostGIS, raio, privacidade de endereço e performance.

### UK_CompliancePetCare

Responsável por riscos de UK, privacidade, limites do serviço pet e linguagem segura.

### I18N_LocalizationUX

Responsável por inglês britânico, chaves de tradução e textos de loja.

### MOD_TrustSafety

Responsável por denúncias, moderação, bloqueios, avaliações e segurança comunitária.

### PAY_PaymentsMarketplace

Participa como consultor na Fase 1 para evitar modelagem incompatível com a Fase 2.

---

## 17. Documentos adicionais que os agentes devem gerar

Após ler este documento, os agentes devem gerar:

- `SPEC_PRODUCT.md`;
- `SPEC_TECHNICAL.md`;
- `SPEC_DATABASE.md`;
- `SPEC_API.md`;
- `SPEC_MOBILE.md`;
- `SPEC_ADMIN.md`;
- `SPEC_DESIGN_SYSTEM.md`;
- `SPEC_PLAYSTORE_RELEASE.md`;
- `SPEC_PRIVACY_DATA_SAFETY.md`;
- `ROADMAP_PHASES.md`;
- `ACCEPTANCE_CRITERIA.md`;
- `RISK_REGISTER.md`.

---

## 18. Fora de escopo técnico da Fase 1

- pagamentos;
- Stripe Connect;
- Wise;
- Pix;
- Apple Pay;
- Google Pay;
- escrow;
- split;
- KYC;
- documentos obrigatórios;
- DBS;
- home boarding comercial;
- mídia no chat;
- localização em background;
- contatos;
- câmera;
- galeria;
- microfone;
- app web público;
- publicação iOS.

---

## 19. Referências oficiais a consultar continuamente

Os agentes devem consultar fontes oficiais sempre que houver dúvida ou antes de preparar release:

- Google Play Developer Program Policies;
- Google Play User Data Policy;
- Google Play Data Safety;
- Google Play App Access;
- Android Core App Quality Guidelines;
- Material Design 3;
- Apple App Review Guidelines;
- Apple Human Interface Guidelines;
- UK GDPR / ICO guidance;
- GOV.UK quando serviços pet exigirem validação futura.

---

## 20. Observação final

Este documento orienta a implementação e reduz risco de erro de escopo, arquitetura e publicação. Ele não substitui revisão jurídica, revisão oficial das lojas nem validação final na Play Console/App Store Connect.


# SPEC_TEST_PLAN — Plano de Testes

**Versão:** 1.1  
**Fase:** 1

---

## 1. Objetivo

Garantir que os fluxos principais do app funcionem de forma estável antes de qualquer envio para Play Console.

---

## 2. Tipos de teste

### Backend

- testes unitários de regras;
- testes de integração de API;
- testes de autorização;
- testes de transição de status;
- testes de busca PostGIS;
- testes de rate limit básicos.

### Mobile

- testes manuais de fluxo;
- validação em emulador Android;
- validação em dispositivo Android real;
- validação de permissões;
- validação de estados de erro.

### Admin

- testes de login admin;
- listagens;
- bloqueio/desbloqueio;
- denúncias;
- audit logs.

---

## 3. Casos críticos

### Conta

- criar conta tutor;
- criar conta prestador;
- login;
- logout;
- recuperar senha;
- excluir conta;
- tentar acessar conta bloqueada.

### Pet

- criar pet;
- editar pet;
- apagar/arquivar pet;
- tentar criar pet sem nome;
- tentar acessar pet de outro usuário.

### Prestador

- criar perfil;
- adicionar serviço;
- editar preço;
- definir raio;
- definir disponibilidade;
- tentar oferecer serviço fora da Fase 1.

### Busca

- buscar prestadores até 1 km;
- buscar até 5 km;
- buscar sem resultados;
- buscar com endereço inválido;
- buscar prestador fora do raio;
- garantir que endereço exato não aparece.

### Booking

- criar solicitação válida;
- criar solicitação sem pet;
- aceitar solicitação;
- recusar solicitação;
- cancelar solicitação;
- concluir booking;
- impedir status inválido;
- impedir usuário externo acessar booking.

### Chat

- enviar mensagem texto;
- listar mensagens;
- bloquear mensagem vazia;
- bloquear mensagem longa;
- impedir não participante;
- impedir usuário bloqueado.

### Avaliação

- avaliar booking concluído;
- impedir avaliação antes da conclusão;
- impedir avaliação duplicada;
- reportar avaliação.

### Denúncia

- criar denúncia;
- admin lista denúncia;
- admin altera status;
- admin bloqueia usuário;
- audit log gerado.

### Play Store

- app sem crashes no fluxo principal;
- sem textos placeholder;
- política de privacidade acessível;
- exclusão de conta acessível;
- permissões mínimas;
- conta de teste funcional.

---

## 4. Edge cases

- usuário sem internet;
- sessão expirada;
- backend fora do ar;
- endereço não geocodificado;
- prestador sem disponibilidade;
- booking duplicado por duplo clique;
- cancelamento simultâneo;
- mensagem enviada durante bloqueio;
- conta deletada com booking antigo;
- alteração de raio do prestador após solicitação;
- fuso horário do Reino Unido;
- horário de verão britânico.

---

## 5. Critérios mínimos antes de build interno

- todos os fluxos principais testados manualmente;
- nenhum crash conhecido nos fluxos principais;
- erros amigáveis;
- logs sem dados sensíveis;
- variáveis de ambiente documentadas;
- seed de teste disponível;
- usuário tutor e prestador de teste disponíveis.

---

## 6. Matriz de cobertura inicial

| Área | Unit | Integration | Manual | Obrigatório Fase 1 |
|---|---:|---:|---:|---:|
| Auth | Sim | Sim | Sim | Sim |
| Pets | Sim | Sim | Sim | Sim |
| Provider profile | Sim | Sim | Sim | Sim |
| Search/PostGIS | Sim | Sim | Sim | Sim |
| Booking status | Sim | Sim | Sim | Sim |
| Chat | Sim | Sim | Sim | Sim |
| Reviews | Sim | Sim | Sim | Sim |
| Reports | Sim | Sim | Sim | Sim |
| Admin actions | Sim | Sim | Sim | Sim |
| Payments | Não | Não | Não | Não Fase 1 |

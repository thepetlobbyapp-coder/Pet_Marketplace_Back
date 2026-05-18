# SPEC_DESIGN_SYSTEM — Design, UX e Acessibilidade

**Versão:** 1.1  
**Produto:** Pet Care Marketplace UK  
**Prioridade:** Android primeiro, preparado para iOS depois  
**Idioma visual/textual:** en-GB

---

## 1. Objetivo do design

Criar uma interface simples, confiável, acessível e adequada para marketplace de cuidado de pets.

O design deve transmitir:

- confiança;
- proximidade;
- clareza;
- cuidado;
- segurança sem prometer garantias absolutas;
- profissionalismo suficiente para aprovação em lojas.

---

## 2. Princípios

1. Clareza acima de estética complexa.
2. Fluxos curtos e previsíveis.
3. Sem dark patterns.
4. Permissões explicadas no momento certo.
5. Dados pessoais sempre minimizados.
6. Endereços exatos não aparecem para terceiros.
7. Ações perigosas exigem confirmação.
8. Todo estado deve ter feedback: carregando, vazio, erro e sucesso.

---

## 3. Plataforma

### Android

Seguir boas práticas de:

- Material Design;
- touch targets confortáveis;
- navegação previsível;
- botão voltar do Android;
- contraste adequado;
- performance;
- compatibilidade com tamanhos de tela.

### iOS futuro

Evitar design excessivamente Android-only que prejudique adaptação futura.

Preparar:

- espaçamentos consistentes;
- componentes abstratos;
- navegação adaptável;
- linguagem neutra.

---

## 4. Tokens de design sugeridos

### 4.1 Espaçamento

```txt
space.1 = 4
space.2 = 8
space.3 = 12
space.4 = 16
space.5 = 20
space.6 = 24
space.8 = 32
```

### 4.2 Raio

```txt
radius.sm = 8
radius.md = 12
radius.lg = 16
radius.xl = 24
```

### 4.3 Tipografia

- Título principal: 24–28
- Título de seção: 18–20
- Texto comum: 14–16
- Texto auxiliar: 12–14

Regra:

- não usar texto menor que 12;
- respeitar aumento de fonte do sistema quando possível.

### 4.4 Cores

Definir no projeto, mas respeitar:

- contraste mínimo acessível;
- estados de erro/sucesso/aviso;
- não depender apenas de cor para comunicar status.

---

## 5. Componentes obrigatórios

- Button;
- TextInput;
- Select;
- Date/Time picker wrapper;
- Card de prestador;
- Card de pet;
- Booking status badge;
- EmptyState;
- ErrorState;
- LoadingState;
- ConfirmationDialog;
- ReportButton;
- RatingInput;
- DistanceBadge;
- ServiceTypeBadge;
- ScreenHeader.

---

## 6. Conteúdo e tom de voz

Tom:

- claro;
- calmo;
- direto;
- amigável;
- não exagerado;
- sem prometer segurança absoluta.

Evitar:

- “guaranteed”;
- “fully verified”;
- “safe provider”;
- “licensed by us”;
- “we guarantee the service”.

Preferir:

- “Send booking request”;
- “Report a concern”;
- “Approximate distance”;
- “Provider description”;
- “This information is provided by the provider”.

---

## 7. Acessibilidade

Obrigatório:

- contraste suficiente;
- labels em inputs;
- botões com área mínima confortável;
- suporte a leitores de tela quando viável;
- mensagens de erro próximas ao campo;
- não usar apenas placeholder como label;
- não usar apenas cor para status;
- feedback claro para loading.

---

## 8. Telas prioritárias para design

1. Splash / loading inicial.
2. Login.
3. Cadastro.
4. Escolha de perfil.
5. Home tutor / busca.
6. Filtros.
7. Perfil do prestador.
8. Solicitação de booking.
9. Lista de bookings.
10. Detalhe do booking.
11. Chat texto.
12. Cadastro/edição de pet.
13. Perfil do prestador.
14. Disponibilidade.
15. Avaliação.
16. Denúncia.
17. Configurações.
18. Exclusão de conta.

---

## 9. Regras para Play Store/App Store

O app deve:

- parecer completo, não protótipo vazio;
- não conter textos temporários;
- não ter botões sem função;
- não quebrar sem login;
- fornecer conta de teste para revisão, se necessário;
- ter política de privacidade acessível;
- explicar permissões;
- não coletar dados sem necessidade;
- não prometer funcionalidades não implementadas;
- não induzir o usuário a erro.

---

## 10. Critérios de aceite visual

- Todas as telas principais têm estados completos.
- Todos os textos finais estão em inglês britânico.
- Componentes estão reutilizáveis.
- Não há texto hardcoded fora de i18n.
- Formulários têm validação visível.
- A navegação é clara.
- Botões críticos têm confirmação.
- O design pode ser apresentado ao cliente sem explicar “isso ainda está quebrado”.

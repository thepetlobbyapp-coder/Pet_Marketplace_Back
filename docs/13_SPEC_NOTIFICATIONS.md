# SPEC_NOTIFICATIONS — Notificações

**Versão:** 1.1  
**Fase:** 1

---

## 1. Objetivo

Definir quando e como usuários serão notificados sem criar spam, sem exigir permissões desnecessárias e respeitando a experiência esperada em Android.

---

## 2. Canais

### Fase 1

- In-app notifications: recomendado.
- Push notifications: opcional, se tecnicamente viável.
- E-mail: opcional para eventos críticos de conta.

### Fora da Fase 1

- SMS;
- WhatsApp;
- marketing automation.

---

## 3. Eventos de notificação

| Evento | Tutor | Prestador | Canal sugerido |
|---|---:|---:|---|
| Booking solicitado | Não | Sim | in-app/push |
| Booking aceito | Sim | Não | in-app/push |
| Booking recusado | Sim | Não | in-app/push |
| Booking cancelado | Sim | Sim | in-app/push |
| Nova mensagem | Sim | Sim | in-app/push |
| Serviço marcado concluído | Sim | Sim | in-app |
| Avaliação disponível | Sim | Sim | in-app |
| Denúncia recebida | Admin | Admin | admin dashboard |
| Conta bloqueada | Sim | Sim | e-mail/in-app |
| Exclusão solicitada | Sim | Sim | e-mail opcional |

---

## 4. Permissão de push

- Pedir apenas após o usuário entender o valor.
- Não pedir na primeira tela sem contexto.
- App deve funcionar sem push.
- Usuário deve poder desativar preferências.

Texto sugerido:

```txt
Allow notifications to receive updates about booking requests and messages.
```

---

## 5. Conteúdo das notificações

Evitar dados sensíveis na lock screen.

Bom:

```txt
New booking request
You have a new request to review.
```

Evitar:

```txt
John at 10 Downing Street wants you to walk Max, aggressive dog, at 8pm.
```

---

## 6. Preferências

Preferências mínimas:

- booking updates;
- messages;
- reviews;
- support/reports;
- account/security.

Notificações de segurança/conta podem ser obrigatórias por necessidade operacional.

---

## 7. Critérios de aceite

- Eventos críticos geram notificação in-app.
- Push, se implementado, não quebra o app quando negado.
- Mensagens de push não expõem dados sensíveis.
- Usuário entende por que a permissão é pedida.

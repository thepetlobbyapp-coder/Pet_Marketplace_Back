# SPEC_API — Backend NestJS

**Versão:** 1.1  
**Backend:** NestJS + TypeScript  
**Objetivo:** API REST inicial para Mobile e Admin

---

## 1. Princípios

- O backend é a autoridade de regra de negócio.
- O mobile nunca decide sozinho permissões sensíveis.
- Toda rota autenticada deve validar usuário, papel e status.
- Toda transição de status deve ser validada e auditada.
- Não expor coordenadas exatas de terceiros.
- Não retornar dados pessoais desnecessários.
- Todas as respostas de erro devem ser previsíveis.
- Toda rota pública deve ter rate limit.
- APIs devem ser documentadas com OpenAPI/Swagger.

---

## 2. Convenções

Base path:

```txt
/api/v1
```

Formato padrão de erro:

```json
{
  "error": {
    "code": "BOOKING_NOT_FOUND",
    "message": "Booking not found.",
    "details": {}
  }
}
```

Status HTTP:

- `200` sucesso com corpo;
- `201` recurso criado;
- `204` sucesso sem corpo;
- `400` entrada inválida;
- `401` não autenticado;
- `403` sem permissão;
- `404` não encontrado;
- `409` conflito de estado;
- `422` regra de negócio inválida;
- `429` rate limit;
- `500` erro inesperado.

---

## 3. Módulos NestJS

- `AuthModule`
- `UsersModule`
- `TutorProfilesModule`
- `ProviderProfilesModule`
- `PetsModule`
- `AddressesModule`
- `ServicesModule`
- `SearchModule`
- `AvailabilityModule`
- `BookingsModule`
- `ChatModule`
- `ReviewsModule`
- `ReportsModule`
- `AdminModule`
- `NotificationsModule`
- `AuditModule`
- `HealthModule`

---

## 4. Auth e conta

### `GET /me`

Retorna usuário autenticado e perfis vinculados.

### `PATCH /me`

Atualiza dados básicos permitidos.

### `POST /me/delete-request`

Inicia exclusão de conta.

### `POST /auth/logout`

Encerra sessão/token conforme estratégia final.

---

## 5. Pets

### `GET /pets`

Lista pets do tutor autenticado.

### `POST /pets`

Cria pet.

Payload:

```json
{
  "name": "Buddy",
  "species": "dog",
  "breed": "Labrador",
  "size": "medium",
  "ageRange": "adult",
  "notes": "Friendly with people, nervous around loud noises."
}
```

### `PATCH /pets/:id`

Edita pet do próprio tutor.

### `DELETE /pets/:id`

Remove ou arquiva pet.

---

## 6. Prestadores

### `POST /providers/profile`

Cria perfil de prestador.

### `GET /providers/me`

Retorna perfil do prestador autenticado.

### `PATCH /providers/me`

Atualiza perfil do próprio prestador.

### `POST /providers/me/services`

Adiciona serviço oferecido.

### `PATCH /providers/me/services/:id`

Atualiza preço informativo, descrição e status do serviço.

### `POST /providers/me/availability`

Define disponibilidade.

---

## 7. Endereços e localização

### `POST /addresses/geocode`

Recebe texto de endereço e retorna candidatos normalizados.

### `POST /addresses`

Salva endereço/região do próprio usuário.

### `PATCH /addresses/:id`

Atualiza endereço do próprio usuário.

Regras:

- salvar coordenadas em campo geográfico;
- controlar precisão armazenada;
- não expor coordenadas exatas a terceiros.

---

## 8. Busca

### `GET /search/providers`

Query params:

```txt
serviceType=dog_walking
radiusKm=5
lat=51.5000
lng=-0.1200
availableFrom=2026-05-20T10:00:00Z
availableTo=2026-05-20T12:00:00Z
page=1
limit=20
```

Resposta:

```json
{
  "items": [
    {
      "providerId": "uuid",
      "displayName": "Emma",
      "bio": "Experienced pet carer.",
      "services": ["dog_walking"],
      "priceFrom": 15,
      "currency": "GBP",
      "ratingAverage": 4.8,
      "ratingCount": 12,
      "distanceKmApprox": 1.7
    }
  ],
  "page": 1,
  "limit": 20,
  "totalApprox": 42
}
```

Regras:

- usar PostGIS no banco;
- arredondar distância;
- não retornar endereço completo;
- limitar raio máximo;
- aplicar rate limit.

---

## 9. Bookings

### `POST /bookings`

Cria solicitação.

Payload:

```json
{
  "providerId": "uuid",
  "petId": "uuid",
  "serviceType": "dog_walking",
  "startsAt": "2026-05-20T10:00:00Z",
  "endsAt": "2026-05-20T11:00:00Z",
  "notes": "Please use the red leash."
}
```

### `GET /bookings`

Lista bookings do usuário autenticado.

### `GET /bookings/:id`

Detalhe do booking, se participante/admin.

### `POST /bookings/:id/accept`

Prestador aceita.

### `POST /bookings/:id/decline`

Prestador recusa.

### `POST /bookings/:id/cancel`

Tutor ou prestador cancela, conforme regras.

### `POST /bookings/:id/complete`

Marca como concluído.

Transições permitidas:

```txt
requested -> accepted
requested -> declined
requested -> cancelled
accepted -> cancelled
accepted -> completed
```

---

## 10. Chat

### `GET /bookings/:id/messages`

Lista mensagens do booking.

### `POST /bookings/:id/messages`

Envia mensagem texto.

Payload:

```json
{
  "body": "Hi, can you meet at 10am?"
}
```

Regras:

- tamanho máximo: 2000 caracteres;
- texto puro;
- sem anexos;
- validar participante do booking;
- registrar timestamps.

---

## 11. Reviews

### `POST /bookings/:id/reviews`

Cria avaliação após conclusão.

Payload:

```json
{
  "rating": 5,
  "comment": "Great communication and care."
}
```

Regras:

- somente participantes;
- somente após `completed`;
- uma avaliação por avaliador por booking;
- comentário opcional.

---

## 12. Reports

### `POST /reports`

Cria denúncia.

Payload:

```json
{
  "targetType": "booking",
  "targetId": "uuid",
  "category": "safety_concern",
  "description": "The provider did not show up."
}
```

### `GET /admin/reports`

Admin lista denúncias.

### `PATCH /admin/reports/:id`

Admin altera status e adiciona nota interna.

---

## 13. Admin

Todas as rotas admin exigem papel `admin`.

- `GET /admin/users`
- `GET /admin/users/:id`
- `POST /admin/users/:id/block`
- `POST /admin/users/:id/unblock`
- `GET /admin/providers`
- `PATCH /admin/providers/:id/status`
- `GET /admin/bookings`
- `GET /admin/audit-logs`

---

## 14. Segurança da API

Obrigatório:

- autenticação em rotas privadas;
- autorização por papel;
- validação de payload;
- rate limit;
- CORS restrito;
- logs sem dados sensíveis;
- variáveis de ambiente;
- secrets fora do repositório;
- healthcheck sem vazar dados internos.

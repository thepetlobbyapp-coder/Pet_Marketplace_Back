# 19 — Exemplos de API

Este documento complementa `05_SPEC_API.md`.

Formato sugerido:

- Backend: NestJS
- API: REST JSON
- Auth: Bearer token via Supabase Auth
- Validação: DTOs + Zod/class-validator
- Erros: formato padronizado

## Padrão de erro

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Some fields are invalid.",
    "details": [
      {
        "field": "postcode",
        "message": "Postcode is required."
      }
    ]
  }
}
```

## Health check

### GET `/health`

```bash
curl -X GET http://localhost:3000/health
```

Resposta:

```json
{
  "status": "ok",
  "service": "pet-marketplace-api"
}
```

## Perfil do usuário autenticado

### GET `/me`

```bash
curl -X GET http://localhost:3000/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

Resposta:

```json
{
  "id": "uuid",
  "role": "PET_OWNER",
  "status": "ACTIVE",
  "fullName": "Jane Smith",
  "email": "jane@example.com",
  "locale": "en-GB"
}
```

## Criar pet

### POST `/pets`

```bash
curl -X POST http://localhost:3000/pets \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Buddy",
    "type": "DOG",
    "breed": "Cocker Spaniel",
    "size": "medium",
    "ageYears": 4,
    "notes": "Friendly with adults, nervous around large dogs."
  }'
```

Resposta:

```json
{
  "id": "uuid",
  "name": "Buddy",
  "type": "DOG",
  "createdAt": "2026-05-16T12:00:00.000Z"
}
```

## Criar perfil de prestador

### POST `/providers/profile`

```bash
curl -X POST http://localhost:3000/providers/profile \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "headline": "Friendly dog walker in your area",
    "bio": "I help pet owners with safe and reliable dog walks.",
    "serviceRadiusMeters": 3000,
    "acceptsDogs": true,
    "acceptsCats": false
  }'
```

Resposta:

```json
{
  "id": "uuid",
  "status": "DRAFT",
  "headline": "Friendly dog walker in your area"
}
```

## Buscar prestadores próximos

### GET `/providers/search`

Parâmetros:

- `lat`: latitude do endereço do cliente
- `lng`: longitude do endereço do cliente
- `radiusMeters`: raio de busca, máximo permitido na Fase 1: 10000
- `serviceType`: opcional
- `minRating`: opcional
- `limit`: padrão 20
- `offset`: padrão 0

```bash
curl -X GET "http://localhost:3000/providers/search?lat=51.5074&lng=-0.1278&radiusMeters=3000&serviceType=DOG_WALKING" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

Resposta:

```json
{
  "items": [
    {
      "providerId": "uuid",
      "displayName": "Sarah M.",
      "headline": "Dog walking near you",
      "averageRating": 4.8,
      "ratingCount": 23,
      "distanceMetersApprox": 1200,
      "publicAreaLabel": "North London",
      "services": [
        {
          "code": "DOG_WALKING",
          "name": "Dog walking",
          "priceAmount": 15.0,
          "currency": "GBP"
        }
      ]
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

Regra: a resposta nunca deve retornar endereço completo ou coordenadas exatas do prestador.

## Solicitar agendamento

### POST `/bookings`

```bash
curl -X POST http://localhost:3000/bookings \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": "uuid",
    "petId": "uuid",
    "serviceTypeCode": "DOG_WALKING",
    "requestedStartAt": "2026-06-01T10:00:00.000Z",
    "requestedEndAt": "2026-06-01T11:00:00.000Z",
    "ownerNotes": "Buddy prefers quiet streets."
  }'
```

Resposta:

```json
{
  "id": "uuid",
  "status": "REQUESTED",
  "requestedStartAt": "2026-06-01T10:00:00.000Z"
}
```

## Aceitar agendamento

### POST `/bookings/{bookingId}/accept`

```bash
curl -X POST http://localhost:3000/bookings/<BOOKING_ID>/accept \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

Resposta:

```json
{
  "id": "uuid",
  "status": "ACCEPTED",
  "conversationId": "uuid"
}
```

## Recusar agendamento

### POST `/bookings/{bookingId}/decline`

```bash
curl -X POST http://localhost:3000/bookings/<BOOKING_ID>/decline \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "I am not available at that time."
  }'
```

## Enviar mensagem de texto

### POST `/conversations/{conversationId}/messages`

```bash
curl -X POST http://localhost:3000/conversations/<CONVERSATION_ID>/messages \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "body": "Hi, I can confirm the booking."
  }'
```

Resposta:

```json
{
  "id": "uuid",
  "body": "Hi, I can confirm the booking.",
  "createdAt": "2026-05-16T12:00:00.000Z"
}
```

## Criar denúncia

### POST `/reports`

```bash
curl -X POST http://localhost:3000/reports \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "reportedUserId": "uuid",
    "bookingId": "uuid",
    "category": "INAPPROPRIATE_BEHAVIOUR",
    "description": "The user sent inappropriate messages."
  }'
```

## Admin: aprovar prestador

### POST `/admin/providers/{providerId}/approve`

```bash
curl -X POST http://localhost:3000/admin/providers/<PROVIDER_ID>/approve \
  -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>"
```

Resposta:

```json
{
  "providerId": "uuid",
  "status": "APPROVED"
}
```

## OpenAPI mínimo sugerido

O agente de backend deve gerar um arquivo:

```txt
apps/api/openapi.json
```

Com pelo menos:

- `/health`
- `/me`
- `/pets`
- `/providers/profile`
- `/providers/search`
- `/bookings`
- `/conversations/{conversationId}/messages`
- `/reports`
- `/admin/providers/{providerId}/approve`


# PLAN_BLOCO_2B_BACKEND_SCHEMA_INTEGRATION

## Objetivo

Integrar o backend NestJS ao schema Supabase real aplicado no Bloco 2, mantendo o
backend como autoridade de regra de negocio e usando `SUPABASE_SERVICE_ROLE_KEY`
somente no servidor.

## Estado de entrada

- Supabase Auth esta ativo.
- `postgis` e `pgcrypto` estao habilitados.
- As tabelas base existem: `users`, `user_roles`, `tutor_profiles`,
  `provider_profiles`, `provider_services`, `pets`, `addresses`, `audit_logs`.
- RLS esta habilitado em todas as tabelas.
- `authenticated` nao possui grants de escrita nas tabelas do Bloco 2.
- Backend valida bearer token via Supabase Auth.

## Escopo do Bloco 2B

1. Criar camada de banco no backend.
   - Adicionar provider para Supabase service-role client.
   - Separar cliente anon/auth de cliente service-role.
   - Bloquear uso de service role fora do backend.

2. Sincronizar usuario autenticado.
   - A partir de `auth.users`, garantir registro correspondente em `public.users`.
   - Popular `email`, `status`, `locale`, timestamps e soft-delete quando aplicavel.
   - Criar/garantir roles em `public.user_roles` com valores `tutor`, `provider` ou `admin`.
   - Definir fallback conservador quando o token nao trouxer roles validas.

3. Enriquecer `GET /api/v1/me`.
   - Retornar identidade autenticada.
   - Retornar roles reais do banco.
   - Retornar status real de `public.users`.
   - Nao retornar enderecos completos ou coordenadas.

4. Preparar base para perfis.
   - Criar repositorios/servicos para consultar `tutor_profiles` e `provider_profiles`.
   - Nao criar endpoints publicos de perfil completo ainda, salvo se exigido pelo bloco.
   - Manter escrita controlada pelo backend.

5. Smoke e testes.
   - Manter e2e degradado sem `.env` real.
   - Criar smoke controlado com Supabase real usando `DATABASE_URL`/service role local.
   - Validar que `authenticated` continua sem escrita direta.
   - Validar que `GET /me` falha de forma segura sem token e funciona com token real quando houver usuario de teste.

## Fora do escopo

- Bookings, availability, chat, reviews, reports e admin completo.
- Pagamentos, Stripe, Pix, Wise, escrow, ledger ou payouts.
- Exposicao publica de enderecos completos/coordenadas.
- Seeds com dados reais.
- Alteracoes destrutivas no banco.

## Arquivos provaveis

- `src/common/auth/supabase.service.ts`
- `src/common/auth/auth.guard.ts`
- `src/users/users.controller.ts`
- `src/users/users.module.ts`
- `src/users/*`
- `src/config/env.schema.ts`
- `scripts/db/*`
- `test/*`

## Criterios de aceite

- `pnpm typecheck`, `pnpm lint`, `pnpm build` e `pnpm test:e2e` passam.
- Smoke read-only do banco passa.
- Nenhum secret e impresso ou commitado.
- Service role e usada apenas em codigo backend.
- `GET /api/v1/me` usa dados reais do banco quando Supabase esta configurado.
- Usuario bloqueado em `public.users.status` nao passa como usuario ativo.
- Roles retornadas vem do banco, nao apenas de metadata do token.

## Riscos e mitigacoes

- Risco: service role vazar para cliente.
  Mitigacao: manter variaveis sem prefixo publico e nunca exportar para Mobile/Admin.

- Risco: duplicidade entre metadata do Auth e `public.user_roles`.
  Mitigacao: tratar banco como fonte final para RBAC depois da sincronizacao.

- Risco: testes e2e dependerem de ambiente real.
  Mitigacao: separar e2e degradado de smoke real opt-in.

- Risco: RLS impedir leitura esperada.
  Mitigacao: usar service role para operacoes backend e smoke read-only para verificar grants.

## Sequencia recomendada

1. Criar service-role client no backend.
2. Criar repositorio de usuarios/roles.
3. Atualizar `resolveUser` para sincronizar e ler `public.users`/`user_roles`.
4. Ajustar `GET /me`.
5. Criar smoke real opt-in.
6. Rodar validacoes locais.
7. Atualizar `docs/PROGRESS.md`.

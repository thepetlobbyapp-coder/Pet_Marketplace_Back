# 18 — Draft SQL do Banco de Dados

Este documento não substitui migrations finais. Ele serve como base para o agente de backend criar migrations versionadas.

Stack alvo:

- PostgreSQL no Supabase
- Extensão PostGIS
- IDs UUID
- Datas em `timestamptz`
- Soft delete quando aplicável
- Regras críticas validadas no backend NestJS

## Extensões

```sql
create extension if not exists "uuid-ossp";
create extension if not exists postgis;
```

## Tipos enumerados

```sql
create type user_role as enum ('PET_OWNER', 'PROVIDER', 'ADMIN');
create type account_status as enum ('ACTIVE', 'SUSPENDED', 'DELETED');
create type provider_status as enum ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED');
create type booking_status as enum (
  'REQUESTED',
  'ACCEPTED',
  'DECLINED',
  'CANCELLED_BY_OWNER',
  'CANCELLED_BY_PROVIDER',
  'COMPLETED',
  'NO_SHOW',
  'DISPUTED'
);
create type pet_type as enum ('DOG', 'CAT', 'BIRD', 'RABBIT', 'OTHER');
create type report_status as enum ('OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED');
```

## Usuários

```sql
create table app_users (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid unique,
  role user_role not null,
  status account_status not null default 'ACTIVE',
  full_name text not null,
  email text not null unique,
  phone text,
  avatar_url text,
  locale text not null default 'en-GB',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_app_users_role on app_users(role);
create index idx_app_users_status on app_users(status);
```

## Endereços e localização

Importante: coordenadas exatas não devem ser retornadas para outros usuários. A API deve retornar apenas distância aproximada e região.

```sql
create table addresses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references app_users(id) on delete cascade,
  label text,
  line1 text not null,
  line2 text,
  city text not null,
  postcode text not null,
  country_code char(2) not null default 'GB',
  location geography(point, 4326) not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_addresses_user_id on addresses(user_id);
create index idx_addresses_location_gix on addresses using gist(location);
```

## Pets

```sql
create table pets (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references app_users(id) on delete cascade,
  name text not null,
  type pet_type not null,
  breed text,
  size text,
  age_years int,
  notes text,
  medical_notes text,
  behavioural_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_pets_owner_id on pets(owner_id);
```

## Prestadores

```sql
create table provider_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references app_users(id) on delete cascade,
  status provider_status not null default 'DRAFT',
  headline text,
  bio text,
  base_address_id uuid references addresses(id),
  service_radius_meters int not null default 3000,
  years_experience int,
  accepts_dogs boolean not null default true,
  accepts_cats boolean not null default true,
  public_area_label text,
  average_rating numeric(3,2) not null default 0,
  rating_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_provider_profiles_status on provider_profiles(status);
create index idx_provider_profiles_user_id on provider_profiles(user_id);
```

## Serviços

```sql
create table service_types (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  name_en_gb text not null,
  description_en_gb text,
  is_active boolean not null default true
);

insert into service_types (code, name_en_gb, description_en_gb) values
('DOG_WALKING', 'Dog walking', 'Walking service for dogs.'),
('PET_SITTING_OWNER_HOME', 'Pet sitting at owner home', 'Care provided at the pet owner home.'),
('DROP_IN_VISIT', 'Drop-in visit', 'Short visit for feeding, water, litter, companionship or basic care.');
```

Observação: `HOME_BOARDING` e `DAY_CARE_AT_PROVIDER_HOME` não entram na Fase 1.

```sql
create table provider_services (
  id uuid primary key default uuid_generate_v4(),
  provider_id uuid not null references provider_profiles(id) on delete cascade,
  service_type_id uuid not null references service_types(id),
  price_amount numeric(10,2),
  currency char(3) not null default 'GBP',
  duration_minutes int,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider_id, service_type_id)
);

create index idx_provider_services_provider on provider_services(provider_id);
```

## Disponibilidade

```sql
create table provider_availability (
  id uuid primary key default uuid_generate_v4(),
  provider_id uuid not null references provider_profiles(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_provider_availability_provider on provider_availability(provider_id);
```

## Agendamentos

```sql
create table bookings (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references app_users(id),
  provider_id uuid not null references provider_profiles(id),
  pet_id uuid references pets(id),
  service_type_id uuid not null references service_types(id),
  status booking_status not null default 'REQUESTED',
  requested_start_at timestamptz not null,
  requested_end_at timestamptz,
  owner_notes text,
  provider_response_notes text,
  location_area_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,
  completed_at timestamptz
);

create index idx_bookings_owner on bookings(owner_id);
create index idx_bookings_provider on bookings(provider_id);
create index idx_bookings_status on bookings(status);
create index idx_bookings_requested_start on bookings(requested_start_at);
```

## Chat somente texto

```sql
create table conversations (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null unique references bookings(id) on delete cascade,
  owner_id uuid not null references app_users(id),
  provider_user_id uuid not null references app_users(id),
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references app_users(id),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_messages_conversation_created on messages(conversation_id, created_at);
```

## Avaliações

```sql
create table reviews (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references bookings(id) on delete cascade,
  reviewer_id uuid not null references app_users(id),
  reviewee_id uuid not null references app_users(id),
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique(booking_id, reviewer_id)
);

create index idx_reviews_reviewee on reviews(reviewee_id);
```

## Denúncias e suporte

```sql
create table reports (
  id uuid primary key default uuid_generate_v4(),
  reporter_id uuid not null references app_users(id),
  reported_user_id uuid references app_users(id),
  booking_id uuid references bookings(id),
  status report_status not null default 'OPEN',
  category text not null,
  description text not null,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index idx_reports_status on reports(status);
create index idx_reports_reported_user on reports(reported_user_id);
```

## Busca por distância com PostGIS

Exemplo de consulta para listar prestadores aprovados dentro de um raio:

```sql
select
  pp.id as provider_id,
  u.full_name,
  pp.headline,
  pp.average_rating,
  pp.rating_count,
  round(
    st_distance(a.location, st_makepoint(:lng, :lat)::geography)
  ) as distance_meters
from provider_profiles pp
join app_users u on u.id = pp.user_id
join addresses a on a.id = pp.base_address_id
where
  pp.status = 'APPROVED'
  and u.status = 'ACTIVE'
  and st_dwithin(
    a.location,
    st_makepoint(:lng, :lat)::geography,
    least(:radius_meters, 10000)
  )
order by distance_meters asc
limit :limit
offset :offset;
```

## Regras de segurança

- A API não deve retornar `line1`, `line2` ou coordenadas exatas de prestadores para clientes.
- O cliente só deve ver distância aproximada e região pública.
- Dados sensíveis devem ser minimizados.
- Exclusão de conta deve aplicar soft delete quando houver histórico operacional.
- Mensagens podem ser retidas conforme política de segurança e suporte.


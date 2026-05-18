# LOCATION_MODEL

## Decisao De Produto
- Proximidade por raio.
- Sem exposicao de endereco exato em listagens.
- PostGIS no PostgreSQL/Supabase.

## Origem Da Localizacao
- Endereco cadastrado:
- GPS atual:
- Autocomplete/geocoding:

## Raio
- Default:
- Minimo:
- Maximo:
- Personalizado permitido? sim/nao

## Schema
```sql
-- exemplo conceitual
-- habilitar extensao conforme ambiente Supabase/Postgres
-- create extension if not exists postgis;
```

## Resposta Publica
Retornar:
- id do prestador
- nome publico
- servicos
- preco base
- rating
- distancia aproximada

Nao retornar:
- endereco completo
- coordenadas exatas
- dados privados

## Testes
- endereco invalido
- sem permissao de localizacao
- raio maximo
- paginacao
- privacidade da resposta
- plano de query com indice

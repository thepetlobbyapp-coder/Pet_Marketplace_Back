# SPEC_MIGRATIONS_ROLLBACK — Migrations, Ambientes e Rollback

**Versão:** 1.1  
**Banco:** Supabase PostgreSQL + PostGIS

---

## 1. Objetivo

Garantir evolução segura do banco, com migrations versionadas, ambientes separados e possibilidade de rollback ou recuperação quando necessário.

---

## 2. Ambientes

### Local

- banco local ou Supabase local;
- dados seedados;
- sem dados reais.

### Staging futuro

- ambiente próximo de produção;
- dados fake;
- usado para testes de release.

### Produção futura

- dados reais;
- backups ativos;
- acesso restrito;
- mudanças controladas.

---

## 3. Migrations

Regras:

- toda mudança de schema deve virar migration;
- não alterar banco manualmente sem registrar migration;
- migrations devem ser revisadas antes de rodar em produção;
- migrations destrutivas exigem plano de backup;
- usar nomes claros e timestamp;
- preparar SQL nao autoriza aplicar SQL no banco;
- aplicar SQL exige confirmacao explicita do usuario, ambiente alvo e comando exato.

### 3.1 Regra de aplicacao de SQL

Por padrao, migrations ficam em estado **preparado para revisao**.

O agente deve diferenciar sempre:

- **Preparar SQL:** criar/revisar arquivos `.sql`, documentar impacto e rodar
  validacoes locais que nao alteram banco.
- **Aplicar SQL:** executar no Supabase/Postgres ou orientar o usuario a colar no
  SQL Editor. Esta acao so acontece apos confirmacao explicita.
- **Smoke SQL:** consulta read-only para verificar schema; deve ser rodada apenas
  depois da aplicacao das migrations relacionadas.

Antes de aplicar SQL, registrar claramente:

- ambiente alvo (`local`, `staging`, `production` ou projeto Supabase especifico);
- projeto Supabase/ref;
- arquivos SQL em ordem;
- se a migration e aditiva, destrutiva ou read-only;
- plano de rollback ou backup quando necessario;
- comando exato ou bloco SQL que sera executado.

Texto de confirmacao esperado:

```txt
APLICAR MIGRATIONS NO SUPABASE <ambiente>
```

Sem essa confirmacao, o SQL nao deve ser executado.

Exemplo:

```txt
20260516_001_enable_postgis.sql
20260516_002_create_users_profiles.sql
20260516_003_create_addresses_location_index.sql
```

---

## 4. Seeds

Criar seeds para:

- admin local;
- tutor de teste;
- prestador de teste;
- pets de teste;
- serviços;
- endereços geocodificados fake;
- bookings em diferentes status;
- denúncias de teste.

Nunca usar dados reais em seed.

---

## 5. Rollback

Para MVP/local:

- rollback pode ser recriar banco local e rodar migrations.

Para produção futura:

- backup antes de migration crítica;
- migration reversível quando possível;
- plano manual para mudanças destrutivas;
- janela de manutenção quando necessário.

---

## 6. Migrations destrutivas

Exemplos:

- drop column;
- drop table;
- alteração de tipo incompatível;
- remoção de enum;
- alteração de constraint em tabela grande.

Regra:

1. criar campo novo;
2. migrar dados;
3. adaptar aplicação;
4. validar;
5. remover campo antigo em etapa posterior.

---

## 7. Backups

Local:

- não crítico.

Produção futura:

- backup automático conforme plano Supabase;
- testar restauração periodicamente;
- documentar ponto de recuperação.

---

## 8. Variáveis de ambiente

Não versionar `.env` real.

Criar:

- `.env.example` para API;
- `.env.example` para mobile;
- `.env.example` para admin.

Variáveis esperadas:

```txt
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY= # somente backend
DATABASE_URL=
JWT_SECRET=
API_BASE_URL=
GEOCODING_PROVIDER=
```

---

## 9. Critérios de aceite

- PostGIS habilitado via migration.
- Tabelas criadas via migration.
- Índices geográficos criados.
- Seeds locais disponíveis.
- `.env.example` criado.
- Instruções de setup local documentadas.
- Nenhum secret real commitado.

# SPEC_ADMIN — Painel Administrativo

**Versão:** 1.1  
**Stack:** Next.js + TypeScript + Tailwind + shadcn/ui  
**Fase:** 1

---

## 1. Objetivo

Criar painel web para operação interna da plataforma, permitindo visualizar usuários, prestadores, agendamentos, denúncias e aplicar ações de moderação.

Na fase local, o painel pode rodar apenas em desenvolvimento. Hospedagem pública não é requisito imediato.

---

## 2. Acesso

- Admin deve autenticar.
- Rotas administrativas exigem papel `admin`.
- Backend deve validar permissão.
- Front não deve ser única barreira de segurança.

---

## 3. Módulos do painel

### 3.1 Dashboard

Mostrar:

- total de usuários;
- total de tutores;
- total de prestadores;
- bookings por status;
- denúncias abertas;
- usuários bloqueados.

### 3.2 Usuários

Ações:

- listar;
- buscar por e-mail/nome;
- visualizar detalhe;
- bloquear;
- desbloquear;
- ver histórico básico.

### 3.3 Prestadores

Ações:

- listar;
- filtrar por status;
- visualizar perfil;
- visualizar serviços;
- desativar perfil;
- reativar perfil.

Não fazer na Fase 1:

- aprovação documental;
- verificação de licença;
- selo verificado.

### 3.4 Bookings

Ações:

- listar por status;
- ver detalhe;
- ver participantes;
- ver histórico de status;
- consultar denúncias relacionadas.

Admin não deve alterar booking livremente sem registrar motivo.

### 3.5 Denúncias

Ações:

- listar abertas;
- atribuir status;
- adicionar nota interna;
- bloquear usuário;
- fechar denúncia;
- marcar como improcedente.

### 3.6 Avaliações

Ações:

- listar avaliações reportadas;
- ocultar avaliação;
- restaurar avaliação;
- registrar motivo.

### 3.7 Auditoria

Mostrar logs relevantes:

- bloqueios;
- desbloqueios;
- alterações de status;
- moderação;
- exclusões de conta.

---

## 4. Design do admin

- Interface simples e funcional.
- Tabelas com paginação.
- Filtros claros.
- Estados vazios.
- Confirmação para ações destrutivas.
- Notas internas sempre identificadas por admin e data.

---

## 5. Segurança

- Não expor service role key no admin.
- Admin consome backend.
- Logs não devem conter senha/token.
- Dados sensíveis devem ser minimizados.
- Bloqueios devem exigir confirmação.

---

## 6. Critérios de aceite

- Admin consegue login.
- Admin vê usuários.
- Admin bloqueia/desbloqueia.
- Admin vê prestadores.
- Admin vê bookings.
- Admin vê denúncias.
- Admin altera status de denúncia.
- Admin adiciona nota interna.
- Todas as ações críticas geram audit log.

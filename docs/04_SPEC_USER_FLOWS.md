# SPEC_USER_FLOWS — Fluxos de Usuário

**Versão:** 1.1  
**Fase:** 1  
**Idioma dos textos finais:** en-GB

---

## 1. Fluxo: cadastro de tutor

1. Usuário abre o app.
2. Escolhe criar conta.
3. Informa e-mail e senha.
4. Confirma e-mail, se aplicável.
5. Escolhe perfil inicial: `Pet owner`.
6. Preenche nome de exibição.
7. Informa endereço/região de referência.
8. App converte endereço em coordenadas aproximadas.
9. Usuário cadastra pelo menos um pet ou pula para fazer depois.
10. Usuário chega à tela inicial.

Estados de erro:

- e-mail inválido;
- senha fraca;
- e-mail já cadastrado;
- endereço não encontrado;
- falha de rede;
- usuário não aceita termos obrigatórios.

Critério de aceite:

- nenhum dado sensível desnecessário deve ser obrigatório.

---

## 2. Fluxo: cadastro de prestador

1. Usuário cria conta ou faz login.
2. Escolhe perfil: `Pet care provider`.
3. Preenche nome de exibição.
4. Preenche descrição curta.
5. Escolhe serviços oferecidos.
6. Define preço informativo por serviço.
7. Define endereço/região base.
8. Define raio de atendimento.
9. Define disponibilidade básica.
10. Salva perfil.
11. Perfil fica com status `active` ou `pending_review`, conforme decisão operacional.

Na Fase 1:

- não solicitar documentos obrigatórios;
- não chamar o prestador de verificado;
- não permitir serviços fora do escopo.

---

## 3. Fluxo: busca de prestador por proximidade

1. Tutor entra na tela de busca.
2. App usa endereço/região do tutor como base.
3. Tutor escolhe filtros:
   - serviço;
   - distância;
   - disponibilidade;
   - avaliação, se existir.
4. Mobile envia filtros ao backend.
5. Backend consulta PostGIS.
6. Backend retorna prestadores elegíveis.
7. Mobile mostra cards com:
   - nome de exibição;
   - serviços;
   - preço informativo;
   - avaliação média;
   - distância aproximada;
   - disponibilidade resumida.

Regras:

- não retornar coordenadas exatas de outros usuários;
- não fazer cálculo sensível apenas no mobile;
- aplicar paginação;
- aplicar rate limit no backend.

---

## 4. Fluxo: solicitação de agendamento

1. Tutor abre perfil do prestador.
2. Escolhe serviço.
3. Escolhe pet.
4. Escolhe data e horário.
5. Informa observação opcional.
6. Confirma envio.
7. Backend cria booking com status `requested`.
8. Prestador recebe notificação in-app/push, se ativa.
9. Tutor vê status pendente.

Erros:

- prestador indisponível;
- pet obrigatório não selecionado;
- horário inválido;
- prestador fora da área;
- usuário bloqueado;
- booking duplicado.

---

## 5. Fluxo: aceite/recusa pelo prestador

1. Prestador abre solicitações.
2. Visualiza dados mínimos:
   - serviço;
   - pet;
   - data/hora;
   - região aproximada;
   - observações.
3. Prestador aceita ou recusa.
4. Se aceitar, status vira `accepted`.
5. Se recusar, status vira `declined`.
6. Tutor é notificado.

Regras:

- não permitir aceitar booking cancelado;
- não permitir aceitar booking de outro prestador;
- registrar transição em histórico.

---

## 6. Fluxo: chat texto

1. Chat é criado quando booking é solicitado ou aceito, conforme decisão de produto.
2. Tutor e prestador podem enviar texto.
3. Backend valida que usuário pertence ao booking.
4. Mensagem é salva.
5. Destinatário recebe atualização.
6. Usuário pode denunciar conversa.

Regras:

- sem anexos na Fase 1;
- sanitizar conteúdo;
- limitar tamanho da mensagem;
- bloquear envio por usuários suspensos;
- manter logs mínimos para moderação.

---

## 7. Fluxo: conclusão e avaliação

1. Booking aceito chega ao horário do serviço.
2. Uma das partes pode marcar como concluído, conforme regra final.
3. Backend altera status para `completed` após validações.
4. App libera avaliação para ambas as partes.
5. Usuários avaliam com nota e comentário opcional.
6. Avaliação fica visível, salvo denúncia/moderação.

Regras:

- não permitir avaliação antes de conclusão;
- não permitir múltiplas avaliações da mesma parte para o mesmo booking;
- comentário ofensivo pode ser denunciado.

---

## 8. Fluxo: denúncia

1. Usuário toca em `Report a concern`.
2. Escolhe categoria:
   - safety concern;
   - inappropriate behaviour;
   - harassment;
   - spam/scam;
   - no-show;
   - other.
3. Adiciona descrição opcional.
4. Envia denúncia.
5. Backend registra status `open`.
6. Admin visualiza no painel.
7. Admin pode:
   - marcar em análise;
   - enviar observação interna;
   - bloquear usuário;
   - fechar denúncia.

---

## 9. Fluxo: exclusão de conta

1. Usuário acessa configurações.
2. Toca em `Delete account`.
3. App explica consequências.
4. Usuário confirma.
5. Backend inicia processo de exclusão/anomização.
6. Conta é desativada e dados não necessários são removidos/anomizados.
7. Usuário é deslogado.

Regras:

- manter dados mínimos exigidos para segurança, auditoria e disputas não-financeiras, se necessário;
- documentar retenção na política de privacidade;
- oferecer canal externo/web para solicitação de exclusão quando exigido pela Play Store.

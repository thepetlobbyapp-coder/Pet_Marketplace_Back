# SPEC_PRODUCT — Produto

**Versão:** 1.1  
**Produto:** Pet Care Marketplace UK  
**Fase alvo:** Fase 1 — Marketplace sem pagamento  
**Idioma final do app:** en-GB

---

## 1. Proposta do produto

O produto é um aplicativo marketplace para conectar tutores de pets a prestadores de serviços próximos no Reino Unido.

Na Fase 1, o app deve permitir que um tutor encontre prestadores, visualize perfis, solicite agendamentos, converse por chat de texto e avalie o serviço após a conclusão. O app também deve permitir que prestadores cadastrem seus serviços, preços informativos, raio de atendimento e disponibilidade.

O app não processa pagamento na Fase 1 e não deve se apresentar como plataforma financeira, seguradora, entidade de licenciamento ou certificadora de prestadores.

---

## 2. Personas

### 2.1 Tutor de pet

Pessoa que possui um ou mais pets e busca ajuda local para passeio, visita, alimentação básica, companhia ou pet sitting na casa do próprio tutor.

Necessidades:

- encontrar prestadores próximos;
- entender serviços e preços;
- enviar solicitação de agendamento;
- conversar com o prestador;
- avaliar experiência;
- denunciar comportamento inadequado;
- controlar seus dados e excluir a conta.

### 2.2 Prestador de serviço

Pessoa que oferece cuidado não veterinário para pets dentro de uma área de atendimento definida.

Necessidades:

- criar perfil profissional;
- descrever experiência;
- definir serviços e preços informativos;
- definir raio de atendimento;
- gerenciar disponibilidade;
- aceitar ou recusar solicitações;
- conversar com tutores;
- receber avaliações;
- reportar problemas.

### 2.3 Admin

Pessoa responsável por operar a plataforma.

Necessidades:

- visualizar usuários;
- bloquear contas;
- acompanhar agendamentos;
- analisar denúncias;
- moderar conteúdo reportado;
- consultar logs básicos;
- preparar lançamento na Play Store.

---

## 3. Funcionalidades da Fase 1

### 3.1 Conta e autenticação

Incluído:

- cadastro por e-mail;
- login;
- recuperação de senha;
- sessão autenticada;
- edição de perfil básico;
- exclusão de conta;
- logout.

Não incluído:

- login social obrigatório;
- autenticação biométrica obrigatória;
- KYC;
- verificação de identidade formal.

### 3.2 Perfil de tutor

Incluído:

- nome de exibição;
- e-mail;
- telefone opcional, se justificado;
- endereço/região de referência;
- pets cadastrados.

Regra de minimização:

- coletar apenas dados necessários para busca, agendamento e comunicação.

### 3.3 Cadastro de pets

Incluído:

- nome;
- espécie;
- raça opcional;
- porte;
- idade aproximada;
- observações de comportamento;
- necessidades importantes;
- instruções de rotina.

Não incluído:

- prontuário veterinário completo;
- dados médicos sensíveis desnecessários;
- documentos do pet;
- integração veterinária.

### 3.4 Perfil de prestador

Incluído:

- nome de exibição;
- descrição;
- experiência declarada pelo próprio prestador;
- região base aproximada;
- raio de atendimento;
- serviços oferecidos;
- preço informativo por serviço;
- disponibilidade;
- status do perfil.

Não incluído:

- verificação formal de identidade;
- upload obrigatório de documentos;
- DBS check automatizado;
- licença validada pela plataforma;
- seguro validado pela plataforma;
- selo de “verificado” na Fase 1.

### 3.5 Serviços da Fase 1

Permitidos:

- dog walking;
- pet sitting na casa do tutor;
- visitas rápidas;
- alimentação básica conforme instrução do tutor;
- companhia e cuidado temporário;
- rotina simples sem ato veterinário.

Fora da Fase 1:

- home boarding comercial na casa do prestador;
- day care comercial regulado;
- grooming profissional regulado, se exigir licença/local específico;
- transporte pet;
- serviços veterinários;
- administração de medicamentos complexos;
- emergências médicas;
- qualquer serviço que exija licença específica não contemplada pelo app.

### 3.6 Busca e filtros

Incluído:

- busca por distância;
- filtro por tipo de serviço;
- filtro por disponibilidade;
- filtro por avaliação, quando houver avaliações suficientes;
- ordenação por distância e relevância básica.

Regra de privacidade:

- o usuário vê distância aproximada, não o endereço exato.

### 3.7 Agendamento

Incluído:

- tutor escolhe serviço, pet, data e horário;
- tutor envia solicitação;
- prestador aceita ou recusa;
- tutor e prestador acompanham status;
- status final pode ser concluído ou cancelado;
- avaliação é liberada após conclusão.

Não incluído:

- pagamento;
- cobrança de taxa;
- split;
- reembolso;
- disputa financeira;
- escrow/custódia;
- nota fiscal/recibo de pagamento.

### 3.8 Chat texto

Incluído:

- mensagens de texto entre tutor e prestador;
- chat associado a uma solicitação/agendamento;
- bloqueio de envio se usuário estiver suspenso;
- histórico básico;
- denúncia a partir da conversa.

Não incluído:

- foto;
- vídeo;
- áudio;
- anexos;
- chamada de voz;
- chamada de vídeo.

### 3.9 Avaliações

Incluído:

- tutor avalia prestador após conclusão;
- prestador avalia tutor após conclusão;
- nota de 1 a 5;
- comentário opcional;
- moderação por denúncia.

Não incluído:

- remoção automática por IA;
- ranking avançado;
- recompensa por avaliação.

### 3.10 Denúncias e suporte

Incluído:

- denúncia de usuário;
- denúncia de agendamento;
- denúncia de mensagem/conversa;
- motivo categorizado;
- descrição opcional;
- acompanhamento no painel admin.

Não incluído:

- atendimento 24/7 garantido;
- mediação financeira;
- seguro;
- garantia de resolução.

---

## 4. Regras de linguagem e promessas

O app não deve dizer:

- “verified provider”;
- “licensed provider”;
- “insured provider”;
- “background checked”;
- “guaranteed safe”;
- “escrow protected”;
- “payment protected”.

Pode dizer:

- “Provider profile”;
- “Experience described by the provider”;
- “Approximate distance”;
- “Report a concern”;
- “Send booking request”;
- “No payment is processed in this app at this stage”.

---

## 5. Critérios de aceite do produto

A Fase 1 é considerada pronta quando:

- tutor consegue criar conta e cadastrar pet;
- prestador consegue criar perfil e serviços;
- tutor consegue buscar prestadores por proximidade;
- tutor consegue enviar solicitação;
- prestador consegue aceitar/recusar;
- chat texto funciona para agendamentos válidos;
- avaliação funciona após conclusão;
- denúncia chega ao admin;
- admin consegue bloquear usuário;
- app possui política de privacidade acessível;
- app possui exclusão de conta;
- permissões e dados coletados estão documentados;
- build Android pode ser submetida para teste interno na Play Console.

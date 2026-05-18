# SPEC_PRIVACY_DATA_SAFETY — Privacidade, UK GDPR e Data Safety

**Versão:** 1.1  
**País de uso:** Reino Unido  
**Fase:** 1

---

## 1. Princípios

- Coletar apenas o necessário.
- Explicar finalidade de cada dado.
- Proteger dados em trânsito e em repouso conforme infraestrutura.
- Permitir exclusão de conta.
- Não expor endereço exato de terceiros.
- Não coletar documentos de prestador na Fase 1.
- Não coletar dados veterinários sensíveis sem necessidade.
- Não processar pagamento na Fase 1.

---

## 2. Dados coletados na Fase 1

| Dado | Obrigatório? | Finalidade | Observação |
|---|---:|---|---|
| E-mail | Sim | Conta, login, suporte | Dado pessoal |
| Senha/token | Sim | Autenticação | Gerenciado com segurança/Auth |
| Nome de exibição | Sim | Perfil público | Evitar nome legal obrigatório |
| Telefone | Opcional | Contato/suporte | Só coletar se necessário |
| Endereço/região | Sim para busca | Proximidade e agendamento | Não expor endereço exato |
| Coordenadas | Sim se geocoding | Busca por distância | Armazenar com cuidado |
| Dados do pet | Sim para tutor | Serviço solicitado | Minimizar observações sensíveis |
| Serviços/preços do prestador | Sim para prestador | Marketplace | Preço apenas informativo na Fase 1 |
| Disponibilidade | Sim para prestador | Agendamento | Não é dado sensível em geral |
| Mensagens texto | Sim se usar chat | Comunicação | Conteúdo gerado pelo usuário |
| Avaliações | Opcional | Confiança/reputação | Pode ser reportado/moderado |
| Denúncias | Opcional | Segurança/suporte | Acesso restrito ao admin |
| Logs técnicos | Sim | Segurança/diagnóstico | Sem dados sensíveis desnecessários |

---

## 3. Dados não coletados na Fase 1

- Dados de cartão.
- Dados bancários.
- Documentos de identidade.
- DBS check.
- Licenças profissionais.
- Dados biométricos.
- Fotos/vídeos no chat.
- Áudio.
- Contatos do dispositivo.
- Localização em background.
- Dados de saúde completos do pet.

---

## 4. Finalidades

Finalidades permitidas:

- criar e manter conta;
- conectar tutores e prestadores;
- permitir busca por proximidade;
- permitir agendamento;
- permitir comunicação por chat;
- permitir avaliação;
- receber denúncias;
- proteger a plataforma;
- cumprir exigências legais e de loja.

Não usar dados para:

- venda de dados pessoais;
- rastreamento oculto;
- publicidade comportamental sem consentimento e documentação;
- finalidades não declaradas.

---

## 5. UK GDPR

A documentação e política de privacidade devem refletir:

- transparência;
- finalidade específica;
- minimização de dados;
- segurança;
- direito de acesso;
- direito de correção;
- direito de exclusão, quando aplicável;
- retenção proporcional;
- contato para solicitações.

---

## 6. Segurança

Obrigatório:

- HTTPS;
- senhas nunca armazenadas em texto puro;
- tokens seguros;
- secrets fora do app e do repositório;
- logs sem senha/token;
- permissões mínimas;
- rate limit;
- controle de acesso por papel;
- isolamento entre usuários.

Desejável:

- Sentry com mascaramento de dados;
- auditoria para ações admin;
- backups;
- alertas de erro.

---

## 7. Localização e endereço

Regras:

- usar coordenadas para busca, não para exposição pública;
- retornar distância aproximada;
- esconder endereço completo de outros usuários;
- permitir usuário editar endereço;
- não solicitar localização em background;
- se usar localização atual, pedir permissão apenas no momento necessário.

---

## 8. Mensagens de chat

Na Fase 1:

- texto apenas;
- sem anexos;
- acesso apenas aos participantes do booking e admin quando necessário para denúncia/moderação;
- conteúdo pode ser usado para investigar denúncia, se informado na política.

---

## 9. Exclusão de conta

Requisitos:

- opção dentro do app;
- confirmação;
- registro da solicitação;
- remoção/anomização de dados não necessários;
- manutenção temporária de dados necessários para segurança, auditoria ou obrigações legais, se justificado;
- canal externo/link para solicitação, se exigido pela Play Store.

---

## 10. Rascunho de Data Safety — orientação

Este documento não substitui o preenchimento final da Play Console, mas orienta.

Provável declaração:

- dados pessoais coletados: e-mail, nome, telefone opcional;
- localização aproximada/endereço/região;
- conteúdo gerado pelo usuário: mensagens, avaliações, denúncias;
- dados de app activity/logs técnicos;
- dados usados para funcionalidades do app, segurança e suporte;
- criptografia em trânsito: sim;
- exclusão de dados: sim, via app e canal externo;
- compartilhamento: evitar, exceto provedores de infraestrutura necessários.

---

## 11. Referências oficiais

- UK GDPR / Data Protection Act 2018: https://www.gov.uk/data-protection
- ICO Data minimisation: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/data-minimisation/
- Google Play User Data policy: https://support.google.com/googleplay/android-developer/answer/10144311
- Google Play account deletion: https://support.google.com/googleplay/android-developer/answer/13327111

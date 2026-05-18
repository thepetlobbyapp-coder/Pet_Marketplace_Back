# Escopo do Aplicativo — Marketplace de Cuidadores de Pets no Reino Unido

**Versão:** 1.1  
**Idioma do documento:** Português do Brasil  
**Idioma final do aplicativo:** Inglês britânico (`en-GB`)  
**Prioridade de publicação:** Google Play Store primeiro; Apple App Store em etapa posterior  
**Status:** Documento de alinhamento com cliente

---

## 1. Visão geral do produto

O aplicativo será um marketplace para conectar tutores de pets a prestadores de serviços próximos, dentro do Reino Unido.

A proposta é permitir que um tutor encontre cuidadores de pets na sua região, veja informações do prestador, escolha um serviço, envie uma solicitação de agendamento, converse por chat de texto e avalie o atendimento após a conclusão.

Na primeira fase, o aplicativo não terá pagamento integrado. O foco será validar o funcionamento principal do marketplace: cadastro, busca, proximidade, agenda, solicitação de serviço, comunicação e avaliação.

O aplicativo será desenvolvido considerando desde o início as exigências de publicação da Google Play Store e, posteriormente, da Apple App Store. Isso inclui cuidado com privacidade, permissões, segurança, acessibilidade, experiência do usuário e clareza sobre o que o aplicativo oferece.

---

## 2. Público-alvo

O aplicativo será usado por dois públicos principais:

### 2.1 Tutor de pet

Pessoa que possui um ou mais pets e deseja encontrar um prestador próximo para serviços como passeio, visita, cuidado temporário ou acompanhamento.

### 2.2 Prestador de serviço

Pessoa que oferece serviços de cuidado para pets dentro de uma região de atendimento definida.

---

## 3. Objetivo da Fase 1

A Fase 1 tem como objetivo entregar uma versão funcional do marketplace sem integração de pagamento.

Essa versão permitirá testar o produto com usuários reais ou grupo controlado, validar os fluxos principais e preparar a base técnica para futuras evoluções.

A Fase 1 deve entregar:

- cadastro e login de usuários;
- perfil de tutor;
- cadastro de pets;
- perfil de prestador;
- serviços oferecidos pelo prestador;
- preço informado pelo prestador, sem cobrança dentro do app;
- endereço e localização aproximada;
- busca por proximidade;
- filtros por distância e tipo de serviço;
- solicitação de agendamento;
- aceite ou recusa pelo prestador;
- chat interno somente por texto;
- avaliação após serviço;
- denúncia/suporte;
- painel administrativo web;
- preparação para publicação Android na Play Store.

---

## 4. O que o aplicativo faz na Fase 1

### 4.1 Cadastro e acesso

O usuário poderá criar uma conta, fazer login e gerenciar seu perfil.

O aplicativo terá dois tipos principais de usuários:

- tutor de pet;
- prestador de serviço.

Um mesmo usuário poderá, futuramente, ter mais de um papel, mas a Fase 1 deve priorizar fluxos simples e claros.

### 4.2 Perfil do tutor

O tutor poderá cadastrar informações básicas, como:

- nome;
- e-mail;
- telefone, se necessário;
- endereço ou região de referência;
- lista de pets.

### 4.3 Cadastro de pets

O tutor poderá cadastrar seus pets com informações úteis para o serviço, como:

- nome do pet;
- espécie;
- raça, se aplicável;
- porte;
- idade aproximada;
- observações de comportamento;
- necessidades especiais;
- instruções importantes para o prestador.

Na Fase 1, o cadastro de pet deve evitar coleta excessiva de dados. O objetivo é guardar apenas informações necessárias para a prestação do serviço.

### 4.4 Perfil do prestador

O prestador poderá cadastrar seu perfil profissional com:

- nome de exibição;
- descrição;
- região de atendimento;
- raio de atendimento;
- tipos de serviço oferecidos;
- preços informados;
- disponibilidade;
- experiência descrita pelo próprio prestador.

Na Fase 1, o aplicativo não exigirá documentação do prestador e não fará verificação formal de identidade, antecedentes, licença ou certificação.

### 4.5 Serviços disponíveis

A Fase 1 pode considerar serviços como:

- dog walking;
- pet sitting na casa do tutor;
- visitas rápidas;
- alimentação básica;
- companhia e cuidado temporário;
- administração simples de rotina informada pelo tutor, sem caracterizar serviço veterinário.

Serviços que exigem autorização, licença específica, responsabilidade técnica ou regulação própria devem ficar fora da Fase 1.

### 4.6 Busca por proximidade

O aplicativo permitirá que o tutor encontre prestadores próximos.

A busca será baseada em localização e distância aproximada. O tutor poderá definir filtros, por exemplo:

- até 1 km;
- até 3 km;
- até 5 km;
- até 10 km;
- raio personalizado, se implementado.

O aplicativo não deve expor o endereço exato do tutor ou do prestador para outros usuários. A experiência deve exibir informações aproximadas, como “atende sua região” ou “aproximadamente 2 km de distância”.

### 4.7 Agendamento

O tutor poderá enviar uma solicitação de agendamento para um prestador.

O prestador poderá aceitar ou recusar a solicitação.

O agendamento terá status claros, como:

- solicitado;
- aceito;
- recusado;
- cancelado;
- concluído.

Na Fase 1, o agendamento não terá pagamento integrado.

### 4.8 Chat interno

O aplicativo terá chat interno somente por texto.

Na Fase 1, o chat não terá envio de fotos, vídeos, áudio ou arquivos.

O chat deve existir para facilitar a comunicação relacionada ao serviço solicitado, antes e durante o atendimento.

O aplicativo deve ter mecanismos básicos de denúncia e bloqueio para lidar com comportamento inadequado.

### 4.9 Avaliações

Após a conclusão de um serviço, o tutor poderá avaliar o prestador.

O prestador também poderá avaliar o tutor, se esse fluxo for mantido na versão final.

A avaliação poderá incluir:

- nota de 1 a 5;
- comentário curto;
- data do serviço.

Avaliações ofensivas, falsas ou abusivas devem poder ser denunciadas e moderadas pelo administrador.

### 4.10 Denúncias e suporte

O aplicativo terá uma área simples para denúncia ou solicitação de suporte.

Exemplos:

- comportamento inadequado;
- problema com agendamento;
- perfil suspeito;
- avaliação abusiva;
- problema técnico.

As denúncias serão visualizadas no painel administrativo.

### 4.11 Painel administrativo

A equipe administradora terá acesso a um painel web para acompanhar e gerenciar a operação.

Na Fase 1, o painel deve permitir:

- visualizar usuários;
- visualizar prestadores;
- bloquear ou desbloquear usuários;
- analisar denúncias;
- visualizar agendamentos;
- moderar conteúdos quando necessário;
- acompanhar dados básicos da operação.

---

## 5. O que o aplicativo não faz na Fase 1

Para alinhar expectativas, a Fase 1 não inclui:

- pagamento dentro do aplicativo;
- integração com Stripe;
- integração com Wise;
- pagamento via Pix;
- split de pagamento;
- repasse automático ao prestador;
- custódia financeira ou escrow;
- disputas financeiras;
- reembolso pelo aplicativo;
- emissão de nota fiscal ou recibo fiscal;
- verificação formal de identidade;
- verificação criminal;
- DBS check automatizado;
- validação de licenças comerciais;
- exigência de documentos do prestador;
- garantia de que o prestador é licenciado, certificado ou verificado;
- seguro para pets;
- seguro para prestadores;
- responsabilidade veterinária;
- atendimento emergencial;
- telemedicina veterinária;
- envio de foto, vídeo, áudio ou arquivo no chat;
- publicação inicial na Apple App Store, caso o primeiro contrato seja Android;
- versão web pública do aplicativo para usuários finais.

---

## 6. Serviços fora do escopo inicial

A Fase 1 não deve focar em serviços que possam exigir licença específica, controle legal mais rígido ou operação mais complexa.

Ficam fora da Fase 1:

- home boarding comercial;
- hospedagem comercial de cães na casa do prestador;
- daycare comercial na casa do prestador;
- grooming, se exigir estrutura específica;
- transporte pet;
- serviços veterinários;
- administração de medicamentos complexos;
- qualquer serviço que dependa de autorização legal específica antes de ser ofertado.

Esses serviços podem ser analisados em fase futura, mediante revisão legal e operacional.

---

## 7. Pagamentos — Fase futura

A integração de pagamento será planejada como Fase 2.

Como o aplicativo conecta pessoas para prestação de serviços físicos fora do app, a cobrança não precisa ser feita usando o sistema de pagamento interno da Play Store ou da App Store. Mesmo assim, a implementação futura deve seguir as regras vigentes das lojas no momento da publicação.

A recomendação técnica inicial é usar Stripe Connect para marketplace no Reino Unido.

Na Fase 2, poderão ser considerados:

- pagamento por cartão;
- Apple Pay;
- Google Pay;
- comissão da plataforma;
- repasse ao prestador;
- reembolso;
- histórico financeiro;
- painel administrativo financeiro;
- webhooks de pagamento;
- regras de cancelamento;
- termos de pagamento.

Wise não será tratada como gateway principal na primeira modelagem de pagamento. Poderá ser analisada futuramente para casos específicos de repasse ou conversão.

---

## 8. Idioma do aplicativo

O aplicativo será desenvolvido para uso no Reino Unido. Por isso, o idioma final do app deve ser inglês britânico.

A equipe de desenvolvimento poderá trabalhar internamente em português, mas todos os textos exibidos ao usuário final devem nascer preparados para inglês britânico.

Isso inclui:

- botões;
- menus;
- mensagens de erro;
- notificações;
- textos de onboarding;
- textos de permissões;
- textos da Play Store;
- textos da App Store futuramente;
- política de privacidade;
- termos de uso.

O app deve evitar textos fixos diretamente no código. Os textos devem usar sistema de tradução/localização.

---

## 9. Design e experiência do usuário

O design será simples, limpo, acessível e voltado à confiança.

Como o produto envolve pets, pessoas e serviços próximos, a interface deve transmitir:

- segurança;
- clareza;
- cuidado;
- proximidade;
- profissionalismo;
- simplicidade.

### 9.1 Direção visual

A identidade visual deve ser amigável, mas não infantilizada.

O app não deve parecer um jogo, rede social genérica ou app informal demais. Ele deve parecer um serviço confiável para contratar cuidados com pets.

### 9.2 Padrão Android primeiro

A primeira publicação será na Google Play Store. Portanto, o design deve seguir padrões familiares ao Android:

- navegação clara;
- botões com áreas de toque confortáveis;
- feedback visual ao carregar dados;
- telas de erro e estado vazio bem definidas;
- compatibilidade com diferentes tamanhos de tela;
- respeito às permissões do Android;
- acessibilidade mínima desde a primeira versão.

### 9.3 Preparação para Apple depois

Mesmo com prioridade Android, o app deve evitar decisões de design que dificultem a versão iOS.

A interface deve ser preparada para futuramente respeitar padrões da Apple, como:

- navegação previsível;
- hierarquia visual clara;
- consistência;
- não imitar indevidamente recursos nativos da Apple;
- não usar componentes confusos ou incompatíveis com iOS.

### 9.4 Acessibilidade

A Fase 1 deve considerar:

- contraste adequado;
- textos legíveis;
- botões com tamanho mínimo confortável;
- suporte a leitores de tela sempre que possível;
- mensagens claras;
- não depender apenas de cor para indicar erro ou sucesso.

### 9.5 Privacidade no design

O design deve evitar exposição excessiva de dados pessoais.

Exemplos:

- não mostrar endereço exato publicamente;
- não mostrar telefone sem necessidade;
- não mostrar localização precisa de forma desnecessária;
- não divulgar dados de pets além do necessário para o serviço;
- informar claramente quando uma informação será usada para busca, agendamento ou contato.

---

## 10. Regras de publicação e aprovação em loja

O projeto deve ser desenvolvido desde o início pensando na aprovação da Play Store.

Isso significa que o aplicativo deve:

- funcionar de forma estável;
- não ter telas quebradas;
- não ter funcionalidades falsas ou incompletas apresentadas como prontas;
- declarar corretamente os dados coletados;
- ter política de privacidade pública;
- permitir exclusão de conta;
- solicitar permissões somente quando necessário;
- explicar ao usuário por que uma permissão é necessária;
- fornecer conta de teste para revisão da loja;
- evitar promessas não comprovadas;
- evitar conteúdo ofensivo ou inseguro;
- ter suporte e contato do responsável.

A documentação técnica do projeto deve manter uma checklist de publicação para reduzir risco de rejeição.

Nenhuma documentação garante aprovação automática, pois as lojas podem alterar regras e avaliar casos específicos. O objetivo é reduzir riscos e manter o app alinhado às exigências conhecidas.

---

## 11. Premissas importantes

Este escopo assume que:

- o aplicativo será usado inicialmente no Reino Unido;
- a Fase 1 não terá pagamentos;
- a Fase 1 não exigirá documentação dos prestadores;
- a Fase 1 não terá home boarding comercial;
- o chat será somente texto;
- a busca será por proximidade;
- o app será publicado primeiro na Play Store;
- o app será testado localmente antes de qualquer hospedagem pública do front;
- o backend será o centro das regras de negócio;
- o banco usará recursos geográficos para busca por distância.

---

## 12. Roadmap sugerido

### Fase 0 — Planejamento e documentação

- validar escopo;
- definir entidades principais;
- definir fluxos;
- definir design base;
- definir regras de publicação;
- preparar documentação para os agentes de desenvolvimento.

### Fase 1 — Marketplace sem pagamento

- app Android;
- backend;
- banco;
- painel administrativo;
- busca por proximidade;
- agendamento;
- chat texto;
- avaliações;
- denúncias;
- preparação para Play Store.

### Fase 2 — Pagamentos

- Stripe Connect;
- pagamento por cartão;
- Apple Pay/Google Pay se aplicável;
- comissão;
- repasse;
- reembolso;
- painel financeiro;
- termos de pagamento.

### Fase 3 — Expansão

- publicação iOS;
- serviços adicionais;
- documentos/licenças se necessário;
- verificação avançada de prestadores;
- mídia no chat, se aprovada;
- recursos premium.

---

## 13. Mensagem final para alinhamento

A Fase 1 será uma versão funcional e publicável do marketplace, mas sem pagamento e sem prometer verificação formal dos prestadores.

O produto será preparado para crescer com segurança, mantendo clareza sobre o que entrega agora e o que ficará para fases futuras.


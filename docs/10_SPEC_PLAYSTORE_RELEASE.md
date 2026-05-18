# SPEC_PLAYSTORE_RELEASE — Publicação Android

**Versão:** 1.1  
**Prioridade:** Google Play Store  
**Fase:** preparação desde o início

---

## 1. Objetivo

Garantir que o app seja desenvolvido desde o primeiro momento com os requisitos necessários para submissão à Google Play Store, evitando recusa por problemas previsíveis de privacidade, dados, permissões, acesso, qualidade ou informações incompletas.

---

## 2. Checklist técnico Android

- Package name definitivo.
- Nome do app em inglês.
- Ícone adaptativo.
- Splash screen.
- VersionCode incremental.
- VersionName semântico.
- Build AAB via EAS.
- Assinatura configurada.
- Sem logs sensíveis.
- Sem secrets no app.
- Sem chaves privadas no repositório.
- App não deve crashar em fluxo principal.
- App deve funcionar em dispositivos/telas comuns.

---

## 3. Checklist de conteúdo

- Short description.
- Full description.
- Screenshots reais.
- Feature graphic.
- Categoria correta.
- E-mail de suporte.
- Política de privacidade pública.
- Países de distribuição definidos.
- Público-alvo definido.
- Classificação indicativa respondida.
- Data Safety preenchido.
- Account deletion preenchido.
- App access configurado se houver login.

---

## 4. App Access para revisão

Como o app terá login, a Play Console pode exigir instruções de acesso para revisores.

Preparar:

- conta de teste tutor;
- conta de teste prestador;
- conta de teste admin, se necessário para validar painel ou fluxo;
- instruções em inglês;
- ambiente estável;
- dados seedados;
- nenhum OTP impossível para revisor.

Exemplo:

```txt
Reviewer access:
Pet owner account:
Email: reviewer.owner@example.com
Password: ********

Provider account:
Email: reviewer.provider@example.com
Password: ********

Test notes:
No real payment is processed in this app. Use the sample provider profile to create a booking request.
```

---

## 5. Data Safety

Mapear antes da publicação:

Dados prováveis:

- e-mail;
- nome de exibição;
- telefone, se usado;
- endereço/região;
- localização aproximada;
- mensagens de chat;
- conteúdo gerado pelo usuário;
- avaliações;
- denúncias;
- identificadores de usuário;
- logs técnicos.

Para cada dado:

- finalidade;
- coleta obrigatória/opcional;
- compartilhamento ou não;
- criptografia em trânsito;
- possibilidade de exclusão;
- retenção.

---

## 6. Permissões

Na Fase 1, evitar ao máximo:

- câmera;
- microfone;
- arquivos;
- contatos;
- localização em background.

Possíveis:

- notificações;
- localização aproximada, apenas se realmente usada.

Se não for necessário, usar endereço digitado/geocodificado e não pedir permissão de localização.

---

## 7. Política de privacidade

Obrigatória porque o app coleta dados de conta, localização/região, pets, mensagens e avaliações.

Deve explicar:

- quem opera o app;
- quais dados são coletados;
- por que são coletados;
- como são usados;
- com quem podem ser compartilhados;
- retenção;
- exclusão de conta;
- contato;
- direitos do usuário no Reino Unido;
- segurança;
- limitações do marketplace.

---

## 8. Exclusão de conta

O app deve ter fluxo interno para exclusão da conta.

Também preparar link web ou canal externo para solicitar exclusão, conforme exigências atuais da Play Store.

Regras:

- botão em Settings;
- confirmação clara;
- explicar retenção mínima;
- deslogar após exclusão;
- bloquear login em conta deletada;
- registrar solicitação.

---

## 9. Qualidade mínima antes de enviar

Não enviar se houver:

- crash em login/cadastro;
- tela vazia sem explicação;
- botão principal sem ação;
- permissão sem justificativa;
- política de privacidade ausente;
- Data Safety inconsistente com app;
- conta de teste inválida;
- conteúdo placeholder;
- texto em português no app final;
- promessa de pagamento/seguro/verificação não implementada.

---

## 10. Etapas recomendadas de release

1. Build local.
2. Teste em emulador.
3. Teste em dispositivo Android real.
4. Build development EAS.
5. Build preview/internal.
6. Teste interno fechado.
7. Corrigir crashes.
8. Preencher Play Console.
9. Submeter para Internal Testing.
10. Validar review.
11. Preparar Closed Testing, se necessário.
12. Preparar produção.

---

## 11. Referências oficiais

- Google Play User Data policy: https://support.google.com/googleplay/android-developer/answer/10144311
- Google Play Data Safety: https://support.google.com/googleplay/android-developer/answer/10787469
- Google Play account deletion: https://support.google.com/googleplay/android-developer/answer/13327111
- Android Core App Quality: https://developer.android.com/docs/quality-guidelines/core-app-quality

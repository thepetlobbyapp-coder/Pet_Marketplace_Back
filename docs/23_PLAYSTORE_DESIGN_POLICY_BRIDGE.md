# 23 — Ponte entre Design, UX e Play Store

Este documento ajuda a garantir que o design não seja apenas bonito, mas também publicável e compreensível para a Play Store.

## Princípios

1. O app precisa parecer completo, estável e útil.
2. O app não deve prometer funcionalidades que não existem.
3. O app deve explicar por que solicita dados ou permissões.
4. O app deve permitir suporte, denúncia e exclusão de conta.
5. O app deve evitar confusão entre marketplace, pagamento e serviço garantido.

## Telas obrigatórias para MVP publicável

### Antes do login

- Splash/launch screen.
- Tela inicial com proposta clara.
- Login.
- Cadastro.
- Recuperação de senha.
- Links para Privacy Policy e Terms.

### Onboarding tutor

- Criar perfil.
- Cadastrar pet.
- Cadastrar endereço.
- Explicar uso da localização/endereço.
- Ir para busca.

### Onboarding prestador

- Criar perfil.
- Informar serviços oferecidos.
- Definir área de atendimento.
- Definir disponibilidade básica.
- Enviar para revisão admin.
- Mostrar status de aprovação.

### Fluxo principal

- Busca por prestadores.
- Filtros por distância/serviço.
- Perfil do prestador.
- Solicitar agendamento.
- Status do agendamento.
- Chat texto após aceite.
- Concluir/cancelar.
- Avaliar.

### Segurança e suporte

- Denunciar usuário ou conversa.
- Bloquear ou suspender via admin.
- Excluir conta.
- Central de ajuda básica.
- Estado de erro amigável.

## Permissões

A permissão de localização só deve ser pedida no momento em que fizer sentido.

Preferência da Fase 1:

- usar endereço digitado/geocodificado;
- não exigir localização em tempo real;
- pedir permissão apenas se houver botão “Use my current location”.

## Estados de tela exigidos

Cada tela de lista deve ter:

- loading;
- vazio;
- erro;
- sucesso;
- sem internet, quando aplicável;
- ação de tentar novamente.

## Acessibilidade

- Botões com área mínima confortável.
- Contraste adequado.
- Textos legíveis.
- Labels em campos.
- Feedback para erro.
- Não depender apenas de cor.
- Suporte a tamanho de fonte aumentado quando possível.

## Store listing: cuidado com promessas

Evitar:

```txt
Find verified, licensed and insured pet carers.
```

Preferir:

```txt
Find local pet care providers, request bookings and chat in the app.
```

Evitar:

```txt
Safe pet care guaranteed.
```

Preferir:

```txt
Review profiles, ratings and booking details before choosing a provider.
```

## Screenshots sugeridas para Play Store

1. Buscar prestadores próximos.
2. Ver perfil do prestador.
3. Solicitar agendamento.
4. Chat texto.
5. Cadastrar pet.
6. Gerenciar agendamentos.

## Conta demo para revisão

Deve existir:

- uma conta tutor;
- uma conta prestador aprovado;
- uma conta admin, se o admin fizer parte da submissão ou for necessário demonstrar fluxo.

Documento relacionado:

- `10_SPEC_PLAYSTORE_RELEASE.md`
- `11_SPEC_PRIVACY_DATA_SAFETY.md`


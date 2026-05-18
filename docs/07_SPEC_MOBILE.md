# SPEC_MOBILE — App Mobile

**Versão:** 1.1  
**Stack:** React Native + Expo + TypeScript  
**Prioridade:** Android / Play Store primeiro  
**Não usar:** Flutter

---

## 1. Objetivo

Construir app mobile para tutores e prestadores de pet care no Reino Unido, com interface em inglês britânico, respeitando desde o início qualidade, privacidade, permissões e critérios esperados pela Google Play Store.

---

## 2. Estrutura sugerida

```txt
/apps/mobile
  /app ou /src
    /screens
    /features
      /auth
      /tutor
      /pets
      /provider
      /search
      /bookings
      /chat
      /reviews
      /reports
      /settings
    /components
    /design
    /i18n
    /lib
    /api
    /navigation
    /hooks
    /types
```

---

## 3. Bibliotecas sugeridas

- Expo;
- TypeScript;
- Expo Router ou React Navigation;
- TanStack Query;
- Zod para validação compartilhada;
- i18next ou solução simples de i18n;
- React Hook Form;
- Expo SecureStore para dados sensíveis locais, se necessário;
- Sentry, quando viável;
- Expo Notifications, quando ativar push;
- mapa/geocoding conforme decisão final.

---

## 4. Regras de idioma

- Todo texto visível ao usuário deve estar em `en-GB`.
- Nenhum texto deve ser hardcoded em componente.
- Usar chaves de tradução.
- Documentação interna pode ser pt-BR.

Exemplo:

```txt
booking.request.sendButton = "Send booking request"
booking.status.requested = "Requested"
settings.account.delete = "Delete account"
```

---

## 5. Navegação principal

### Tutor

- Home/Search
- Provider Profile
- Booking Request
- My Bookings
- Chat
- Pets
- Profile/Settings
- Reports/Support

### Prestador

- Dashboard
- Booking Requests
- Availability
- Services
- Chat
- Reviews
- Profile/Settings
- Reports/Support

### Comum

- Login
- Sign up
- Password reset
- Terms/Privacy
- Delete account

---

## 6. Permissões Android

Evitar permissões desnecessárias.

Possíveis permissões:

- localização aproximada, se o produto decidir usar localização atual;
- notificações push;
- internet.

Na Fase 1, preferir busca por endereço/região cadastrada em vez de exigir localização em tempo real.

Regras:

- pedir permissão apenas no momento de uso;
- explicar motivo em inglês;
- app deve funcionar com funcionalidade reduzida se usuário negar localização;
- documentar toda permissão na Play Console.

---

## 7. Telas essenciais

### 7.1 Onboarding

Objetivo:

- explicar o produto;
- não prometer verificação/segurança absoluta;
- deixar claro que é marketplace de conexão.

### 7.2 Busca

Card do prestador deve mostrar:

- nome;
- serviços;
- preço informativo;
- distância aproximada;
- avaliação;
- disponibilidade resumida.

Não mostrar:

- endereço completo;
- coordenadas;
- dados pessoais sensíveis.

### 7.3 Perfil do prestador

Mostrar:

- bio;
- serviços;
- preços;
- região aproximada;
- avaliações;
- botão de solicitação.

Não mostrar:

- selo de verificado;
- licença;
- documento;
- promessa de seguro.

### 7.4 Agendamento

Campos:

- serviço;
- pet;
- data/hora;
- observação opcional;
- confirmação.

Mensagem clara:

- “No payment is processed in the app at this stage.” quando necessário.

### 7.5 Chat

- somente texto;
- estado vazio;
- loading;
- erro;
- denúncia;
- bloqueio de envio se booking/user inválido.

---

## 8. Estados obrigatórios

Cada tela deve tratar:

- loading;
- empty state;
- erro de rede;
- erro de permissão;
- erro de validação;
- retry;
- usuário bloqueado;
- sessão expirada.

---

## 9. Offline e conectividade

Fase 1:

- não precisa offline-first;
- deve lidar bem com perda de conexão;
- não duplicar bookings em retry;
- usar idempotência no backend quando necessário.

---

## 10. Build Android

Preparar:

- `app.json/app.config.ts` correto;
- nome do app em inglês;
- ícone adaptativo;
- splash screen;
- package name definitivo;
- versionCode/versionName;
- EAS Build;
- variante development/internal testing.

---

## 11. Critérios de aceite mobile

- App roda localmente.
- App usa textos em en-GB.
- Fluxos principais funcionam sem crash.
- Nenhum texto sensível promete verificação/licença/seguro.
- Permissões são mínimas e justificadas.
- Usuário consegue excluir conta.
- Usuário consegue reportar problema.
- Tutor consegue buscar e solicitar booking.
- Prestador consegue aceitar/recusar.
- Chat texto funciona.
- Build Android interno é gerável.

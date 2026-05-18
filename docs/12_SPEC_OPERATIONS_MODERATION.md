# SPEC_OPERATIONS_MODERATION — Operação, Suporte e Moderação

**Versão:** 1.1  
**Equipe inicial:** 1 pessoa  
**Fase:** 1

---

## 1. Objetivo

Definir como denúncias, bloqueios, avaliações e problemas operacionais serão tratados na Fase 1, considerando que a equipe inicial é pequena.

---

## 2. Princípios

- Toda denúncia deve ser registrada.
- Toda ação administrativa crítica deve gerar log.
- Usuário bloqueado não deve conseguir enviar mensagens ou criar bookings.
- A plataforma não promete atendimento 24/7 na Fase 1.
- Casos de segurança têm prioridade.
- Comentários e mensagens reportadas podem ser revisadas.

---

## 3. Categorias de denúncia

- Safety concern.
- Inappropriate behaviour.
- Harassment.
- Spam/scam.
- No-show.
- False information.
- Other.

---

## 4. Status de denúncia

```txt
open -> in_review -> action_taken -> closed
open -> in_review -> dismissed -> closed
```

---

## 5. Ações administrativas

Possíveis ações:

- adicionar nota interna;
- ocultar avaliação;
- bloquear usuário;
- desbloquear usuário;
- desativar perfil de prestador;
- reativar perfil;
- fechar denúncia sem ação;
- marcar como resolvida.

Toda ação deve registrar:

- admin responsável;
- data/hora;
- motivo;
- entidade afetada.

---

## 6. Critérios de bloqueio

Bloqueio imediato pode ocorrer quando houver:

- ameaça ou assédio claro;
- tentativa de golpe;
- spam repetido;
- comportamento inseguro reportado com indício suficiente;
- uso abusivo do app;
- violação clara dos termos.

Bloqueio manual com revisão:

- múltiplas denúncias;
- avaliações suspeitas;
- no-show recorrente;
- mensagens impróprias.

---

## 7. SLA interno sugerido

Como a equipe é uma pessoa só, não prometer SLA público rígido.

SLA interno operacional:

- risco de segurança: revisar assim que possível, prioridade máxima;
- denúncia comum: revisar em até 2 dias úteis quando o app estiver em operação real;
- suporte geral: revisar em até 3–5 dias úteis.

No app, usar linguagem genérica:

```txt
We will review your report as soon as possible.
```

Evitar:

```txt
We will respond within 24 hours.
```

---

## 8. Escalonamento

Casos graves:

- ameaça física;
- violência;
- maus-tratos a animal;
- roubo/fraude;
- risco imediato.

A plataforma pode orientar o usuário a contatar autoridades/serviços locais quando houver risco real. A plataforma não substitui polícia, emergência, veterinário ou autoridade local.

---

## 9. Moderação de avaliações

Avaliação pode ser ocultada quando:

- contém assédio;
- contém dados pessoais;
- contém linguagem discriminatória;
- é spam;
- é claramente fora do contexto;
- viola termos.

Não ocultar avaliação apenas por ser negativa.

---

## 10. Métricas operacionais

- denúncias abertas;
- tempo médio de revisão;
- usuários bloqueados;
- prestadores desativados;
- bookings cancelados;
- no-show reportado;
- avaliações reportadas.

---

## 11. Critérios de aceite

- Usuário consegue denunciar.
- Admin consegue ver denúncia.
- Admin consegue mudar status.
- Admin consegue bloquear usuário.
- Usuário bloqueado perde ações críticas.
- Ações admin geram audit log.

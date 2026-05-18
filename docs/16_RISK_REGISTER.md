# RISK_REGISTER — Riscos e Mitigações

**Versão:** 1.1  
**Projeto:** Pet Care Marketplace UK

---

## 1. Escala

Probabilidade:

- Baixa;
- Média;
- Alta.

Impacto:

- Baixo;
- Médio;
- Alto;
- Crítico.

---

## 2. Riscos de produto

| Risco | Prob. | Impacto | Mitigação |
|---|---:|---:|---|
| Cliente esperar pagamento na Fase 1 | Média | Alto | Documentar claramente fora de escopo |
| Cliente esperar prestadores verificados | Média | Alto | Evitar termos “verified/licensed” |
| Usuários confundirem preço informativo com pagamento | Média | Médio | Exibir aviso de que não há pagamento no app |
| Escopo crescer antes do MVP | Alta | Alto | Fases rígidas e backlog futuro |

---

## 3. Riscos técnicos

| Risco | Prob. | Impacto | Mitigação |
|---|---:|---:|---|
| Busca geográfica lenta | Média | Alto | PostGIS + índice GIST + paginação |
| Exposição de localização precisa | Média | Crítico | Retornar distância aproximada e esconder endereço |
| Backend virar pass-through do Supabase | Média | Alto | Backend como autoridade de regra |
| Chat realtime complicar MVP | Média | Médio | Começar simples, texto apenas |
| Duplicidade de booking por retry | Média | Médio | Idempotência/validação de conflito |

---

## 4. Riscos de Play Store

| Risco | Prob. | Impacto | Mitigação |
|---|---:|---:|---|
| Data Safety inconsistente | Média | Alto | Mapear dados antes da submissão |
| Política de privacidade incompleta | Média | Alto | Criar política antes do teste fechado |
| Conta de teste inválida para review | Média | Alto | Criar reviewer accounts e seeds |
| Permissão desnecessária | Média | Médio | Evitar câmera, microfone, localização background |
| App parecer incompleto | Média | Alto | Remover placeholders e botões sem função |

---

## 5. Riscos de compliance UK

| Risco | Prob. | Impacto | Mitigação |
|---|---:|---:|---|
| Coleta excessiva de dados | Média | Alto | Data minimisation desde o schema |
| Falta de exclusão de conta | Média | Alto | Implementar fluxo no app |
| Promessa de licença/verificação | Média | Alto | Não usar termos indevidos |
| Home boarding regulado entrar sem preparo | Média | Alto | Excluir explicitamente da Fase 1 |

---

## 6. Riscos operacionais

| Risco | Prob. | Impacto | Mitigação |
|---|---:|---:|---|
| Denúncias sem resposta | Média | Alto | Painel admin e status de denúncia |
| Usuário abusivo continuar ativo | Média | Alto | Bloqueio admin e audit log |
| Avaliação injusta/removida indevidamente | Média | Médio | Política de moderação clara |
| Equipe de uma pessoa sobrecarregada | Alta | Médio | Não prometer SLA público rígido |

---

## 7. Riscos futuros de pagamento

| Risco | Prob. | Impacto | Mitigação |
|---|---:|---:|---|
| Modelagem atual impedir Stripe Connect | Média | Alto | Separar booking de payment desde já |
| Uso indevido do termo escrow | Média | Alto | Evitar termo até validação jurídica |
| Wise não atender marketplace completo | Média | Médio | Tratar Wise apenas como opção futura |
| App usar IAP incorretamente | Baixa | Alto | Serviços físicos podem usar gateway externo, mas documentar |

---

## 8. Riscos de design

| Risco | Prob. | Impacto | Mitigação |
|---|---:|---:|---|
| Interface parecer protótipo | Média | Médio | Design system e componentes reutilizáveis |
| Texto em português no app final | Média | Médio | i18n obrigatório |
| Baixa acessibilidade | Média | Médio | Contraste, labels e touch targets |
| Fluxo confuso para prestador/tutor | Média | Alto | Testes manuais dos fluxos críticos |

---

## 9. Riscos que aceitamos na Fase 1

- Sem pagamento.
- Sem verificação documental.
- Sem vídeo/foto no chat.
- Sem atendimento 24/7.
- Sem home boarding comercial.
- Sem garantia de qualidade do serviço.

Esses riscos são aceitos porque estão documentados como fora de escopo ou limitações do MVP.

# Refator Tom Claudia — Conversacional

## Escopo
Substituir o bot de menu numerado por uma assistente conversacional natural, mantendo toda a infraestrutura de guards/idempotência intacta.

## Arquivos a alterar

1. **`supabase/functions/_shared/prompts.ts`**
   - Substitui M0 (CTWA, orgânico, reabertura 7d, resposta campanha) pelos 4 novos textos com 💙/😊.
   - Substitui M1/M2/M3 por área: `saude`, `inventario`, `familia`.
   - Adiciona template `foraEscopo` (substitui "Outros").
   - Substitui followups 4h / 24h / 72h.
   - Confirma handoff impessoal já vigente.
   - Remove qualquer string com "responda com o número", opções numeradas e travessão `—`.

2. **`supabase/functions/whatsapp-inbound/index.ts`**
   - Reescreve o system prompt do Claude Haiku:
     - Identifica `area ∈ {familia, inventario, saude, fora_escopo}` pela fala natural.
     - Identifica `etapa_proxima ∈ {M0, M1, M2, M3, finalizado}` pelo histórico.
     - Extrai `dados_capturados` específicos por área (medicamento/negativa, herdeiros/consenso/bens, consenso/bens/filhos).
     - Gera `proxima_mensagem` natural, empática, UMA pergunta por vez.
     - Proibições explícitas: travessão, menu numerado, listas formulário, opinião jurídica, prazo, estimativa de indenização.
     - Emojis permitidos: somente 💙 e 😊.
     - Saída JSON estrita: `{ area, etapa_proxima, dados_capturados, proxima_mensagem }`.
   - Override numérico oculto: "1"=Família, "2"=Inventário, "3"=Saúde. Remove opção "4".
   - Rota `fora_escopo` → `status_sdr='aguardando_triagem'`, `etapa_qualificacao='finalizado'`, envia template de encaminhamento.

3. **`supabase/functions/on-new-lead/index.ts`** e **`supabase/functions/cron-followup/index.ts`**
   - Trocam referências aos antigos templates pelos novos exportados de `prompts.ts` (M0 por origem, followups 4h/24h/72h).

4. **`supabase/functions/_shared/textos-campanha.ts`** (se aplicável)
   - Remove travessões remanescentes para passar no grep.

## Não mexer (preservar)
Echo guard, anti-repetição Jaccard, cross-checks (`numeros_bloqueados_bot`, `contact_submissions`, `leads_geral`, `processos`), `bot_pausado`, helper `humanoAtivo`, detecção CTWA via `externalAdReply`, registro `fromMe` celular, idempotência por `messageId`, constraints de `status_sdr`.

## Verificação pós-deploy
Rodar nos arquivos `supabase/functions/whatsapp-inbound/index.ts` e `supabase/functions/_shared/prompts.ts`:

```bash
rg -c "responda com o número" supabase/functions/whatsapp-inbound/index.ts supabase/functions/_shared/prompts.ts
rg -c "1 - Família|1 - Inventário|2 - " supabase/functions/_shared/prompts.ts
rg -c "—" supabase/functions/_shared/prompts.ts
```

Esperado: 0 / 0 / 0. Devolvo os 3 contadores + print do bloco `mensagemM0CTWA` / `mensagemM0Organico` atualizado no `prompts.ts`.

## Detalhes técnicos
- Templates exportados como funções `({ primeiroNome }) => string` para interpolar nome.
- `fora_escopo` não chama Haiku para próxima pergunta — responde direto com template fixo e finaliza.
- Override numérico aplicado ANTES do Haiku, só quando `etapa_qualificacao='M0'` e mensagem do lead é exatamente "1"/"2"/"3".
- System prompt do Haiku ganha bloco "EXEMPLOS BONS / EXEMPLOS RUINS" curtos para fixar tom.

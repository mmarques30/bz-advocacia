# Plano — Refator tom Claudia (ajustes finais)

A maior parte do refator já está aplicada no repo (M0 conversacional, M1/M2/M3 por área, fora_escopo, override numérico 1/2/3 sem "4", system prompt do Haiku, higienização de travessão/emoji no `whatsapp-inbound`). Restam apenas ajustes finos pra bater 100% com o documento aprovado.

## Mudanças propostas

### 1) `supabase/functions/_shared/prompts.ts`
- **M0 CTWA**: trocar "do escritório Borges & Zembruski Advocacia" por "do Borges & Zembruski".
- **M0 Orgânico**: idem + colapsar em uma linha só com a frase "Conta um pouquinho como posso te ajudar hoje?" (igual ao doc).
- Reabertura, Recuperação e Handoff já estão idênticos ao spec.
- Comentários internos (`//`) com travessão continuam — só limpamos strings de mensagem.

### 2) `supabase/functions/cron-followup/index.ts`
- Followup 24h: trocar "Podemos seguir e realizar seu atendimento?" por "Podemos seguir?" (linha 84).
- Followup 4h e 72h já batem com o doc.

### 3) `supabase/functions/_shared/textos-campanha.ts`
- Substituir os 3 travessões nas mensagens de campanha (linhas 12, 34, 46, 56) por vírgula + "direciono...":
  - "é só me responder por aqui, direciono pra nossa advogada..."
  - "uma questão de saúde (plano, medicamento ou tratamento). Espero..."

### 4) `supabase/functions/assumir-conversa/index.ts`
- Já está com o copy impessoal correto ("...logo te responde por aqui. ✱"). Mantém o ✱ porque é exatamente o exemplo do doc (item e).

### 5) Não tocar
- Echo guard, anti-repetição, cross-checks, bot_pausado, humanoAtivo, CTWA externalAdReply, fromMe celular, idempotência por messageId, constraints de status_sdr.
- Override numérico 1/2/3 já implementado em `whatsapp-inbound` (sem "4").
- Higienização defensiva (`higienizarTomClaudia`) já troca travessão por vírgula e remove 🤓 ✱ ✨ 🙏 etc das mensagens geradas pelo Haiku.

## Verificação pós-deploy (greps em `supabase/functions/`)
1. `rg "responda com o número" supabase/functions/` → 0
2. `rg "1 - Família|1 - Inventário|1 - Saúde" supabase/functions/` → 0
3. `rg "—" supabase/functions/_shared/prompts.ts supabase/functions/_shared/textos-campanha.ts supabase/functions/cron-followup supabase/functions/whatsapp-inbound` filtrando só strings de mensagem (não comentários `//`) → 0
4. Print do template M0 CTWA + Orgânico atualizado.

Pronto pra rodar em build mode.

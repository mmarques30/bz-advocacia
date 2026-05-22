## Causa raiz da regressão (Prioridade 1)

A Z-API faz **eco dos próprios envios do bot** como webhook com `fromMe=true` e `fromApi=false` (confirmado em `eventos_sdr.raw_payload_debug`). Nosso handler `if (payload.fromMe)` em `whatsapp-inbound/index.ts` (linhas 202-299) trata todo `fromMe=true` como "humano da B&Z assumiu via celular" e seta `bot_pausado=true` + `status_sdr=assumido_humano`.

Sequência real do que está acontecendo com cada lead novo:
1. Lead manda "Oi" → cria `leads_geral` + retorna 200 (linha 395).
2. Trigger dispara `on-new-lead` → envia M0 + LGPD via Z-API.
3. Z-API faz **echo** das mensagens de M0 e LGPD de volta no webhook com `fromMe=true`.
4. `whatsapp-inbound` recebe o echo, não distingue do humano, marca `bot_pausado=true` + `assumido_humano`.
5. Lead responde M1 → cai em `msg_recebida_bot_pausado` (45 ocorrências nas últimas 24h) → bot nunca mais responde.

Evidência: 0 eventos `msg_processada` em 24h, 0 `claude_falhou`, 21 `humano_assumiu_via_celular` em telefones que ninguém assumiu de fato, todos leads recentes com `bot_pausado=true` e `etapa_qualificacao=M0`.

**Bug bônus identificado:** lead `sdr_wa_1779459384333_331487` tem `phone_number=55198414671331487` (17 dígitos). O caminho de recuperação `participantPhone` (linhas 108-130) aceita 10-15 dígitos sem validar que seja telefone BR real; em alguns payloads ele captura um ID concatenado.

---

## Plano de execução

### Prioridade 1 — Ignorar echo do próprio bot (CRÍTICO)

Em `whatsapp-inbound/index.ts`, antes do bloco `if (payload.fromMe)`:

1. Se `fromApi === true` → ignora (é eco confirmado da API).
2. Senão, busca em `mensagens_sdr` se existe mensagem com mesmo `conteudo` (origem `bot` ou `humano`) inserida nos últimos 90s para o lead daquele telefone. Se sim → ignora como echo, registra evento `webhook_echo_ignorado`.
3. Só então segue o fluxo "humano assumiu via celular".

Cleanup de estado dos leads quebrados (UPDATE SQL):
- Leads `sdr_wa_*` criados nas últimas 48h com `etapa_qualificacao='M0'` e `status_sdr='assumido_humano'` sem mensagem real de humano em `mensagens_sdr` → resetar para `status_sdr='em_atendimento_bot'`, `bot_pausado=false`, `humano_responsavel=NULL`.

Bug do telefone de 17 dígitos: apertar regex de `participantPhone` para `/^55\d{10,11}$/` (DDI Brasil + DDD + número) e ignorar se não bater. Corrigir o lead afetado (deletar em cascata).

Smoke test pós-deploy: enviar mensagem real, confirmar que M0 sai, M1 também sai, e `eventos_sdr.msg_processada` aparece.

### Prioridade 2 — Remover LGPD da M0

Em `on-new-lead/index.ts` (linhas ~89-90): trocar `const mensagens = [texto, AVISO_LGPD]` por `const mensagens = [texto]`. Remove o segundo envio + a inserção correspondente em `mensagens_sdr`. Manter `AVISO_LGPD` exportado em `_shared/prompts.ts` (não é usado em outro lugar mas não custa).

### Prioridade 3 — Histórico completo na ConversaBot

Verificado: a query em `src/components/leads/ConversaBot.tsx` (linhas 51-63) **já** carrega tudo sem filtro de origem, ordenado por `enviada_em ASC`, e o realtime (linhas 66-86) escuta INSERT sem filtro de origem. Já está correto — vou só adicionar tratamento de origens desconhecidas (caso `metadata.via='celular_fromMe'`, mostrar como "Você (celular)"), e confirmar visualmente após deploy.

### Prioridade 4 — Painel lateral de dados do cliente

Em `src/pages/Atendimento.tsx`, transformar o grid de `[320px_1fr]` para `[320px_1fr_320px]` adicionando `LeadInfoPanel`. Novo componente `src/components/atendimento/LeadInfoPanel.tsx` que mostra:
- Header: nome, telefone, área (`tipo_servico` + `area_normalizada`).
- Bloco "Origem": `origem_sdr`, `platform`, `ad_name` (se houver).
- Bloco "Qualificação": `score`, `status_sdr`, `etapa_qualificacao`, estágio do CRM (de `contact_submissions.estagio`).
- Bloco "Respostas M1/M2/M3": query em `qualificacoes_sdr` por `lead_id`.
- Bloco "Ações": botões "Assumir conversa", "Marcar cliente", "Marcar perdido" (ligar nos hooks já existentes ou criar mutations diretas).

### Prioridade 5 — Classificar manualmente no atendimento

No `LeadInfoPanel`, adicionar:
- Dropdown área (`area_normalizada`) — opções vindas de `servicos_sdr` ou hardcoded com as áreas conhecidas.
- Dropdown estágio CRM (novo / contato_inicial / em_analise / proposta_enviada / fechado / perdido).
- Botões "Marcar cliente" (estágio→`fechado` + status_sdr→`cliente`) e "Marcar perdido" (estágio→`perdido` + status_sdr→`perdido`).
- Cada mudança escreve em `leads_geral` E `contact_submissions` (encontrar o id via `lead_geral_id`), invalida queries `atendimento-conversas` e `atendimento-lead`.

### Prioridade 6 — Status do atendimento em tempo real

Garantir que a regra de upgrade automático já existente em `_shared/db.ts` `espelharContactSubmission` esteja sendo chamada toda vez que humano responde. Verificar `enviar-msg-humano/index.ts` para confirmar (provavelmente já faz). Adicionar no `ChatPanel` um realtime listener em `leads_geral` para invalidar o cache do lead quando `status_sdr` mudar, garantindo que o badge de status no header e na lista atualize sem refresh.

### Prioridade 7 — Filtros na caixa de atendimento

Em `src/components/atendimento/ConversasList.tsx`:
- Novo dropdown "Tipo": Todos / Bot (status_sdr ∈ `novo`,`em_atendimento_bot`) / Humano (`assumido_humano`,`sql_aguardando_humano`).
- Novo dropdown "Status": Todos / Pendente / Qualificado / Em andamento / Fechado.
- Novo dropdown "Ordenação": Mais recentes (atual) / Prazo (asc por `ultima_mensagem_em`).
- Aplicar filtros na query e na ordenação client-side conforme o caso.

---

## Ordem de deploy

1. Edge functions (`whatsapp-inbound`, `on-new-lead`) → smoke test bot.
2. Cleanup SQL dos leads travados.
3. Frontend (Prioridades 3-7) em sequência, cada bloco isolado.

Confirmo cada item com print/log conforme avanço.
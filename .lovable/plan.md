## Problema confirmado

Verifiquei no banco: a Anibel mandou 7 mensagens hoje entre 15:44 e 16:24, mas o painel não tem nenhuma resposta humana registrada porque a Z-API parou de entregar webhooks `fromMe=true` (com `fromApi=false`) ao `whatsapp-inbound`. Em 24h chegam só ecos `fromApi=true` (mensagens do próprio bot). Último `humano_assumiu_via_celular` é de 22/maio. Resultado: tudo que advogada digita no celular some do painel.

A solução escolhida é **pull**: nossa edge function busca o histórico diretamente na API da Z-API e enche o gap.

## O que vou construir

### 1. Nova edge function `whatsapp-sync-chat` (`verify_jwt = true`)

Entrada: `{ lead_id: string, limit?: number }` (default 30).

Lógica:
1. Resolve `lead.telefone_digits`.
2. Chama Z-API: `GET https://api.z-api.io/instances/{ZAPI_INSTANCE_ID}/token/{ZAPI_TOKEN}/chat-messages/{phone}?amount={limit}` com header `Client-Token: ZAPI_CLIENT_TOKEN`.
3. Para cada mensagem retornada:
   - Ignora se `messageId` já existe em `mensagens_sdr.metadata->>'messageId'` (chave de dedup).
   - Ignora se `text/body` vazio (mídia tratada em iteração futura).
   - Mapeia `origem`:
     - `fromMe=true` → `humano` (com `metadata.via='celular_sync'`, `canal='whatsapp_celular'`)
     - `fromMe=false` → `lead` (backfill caso o inbound também tenha perdido alguma)
   - Insere com `enviada_em = moment` da Z-API (campo `moment` em ms).
4. Se ao menos uma humana foi inserida e o lead não está pausado, marca `bot_pausado=true`, `status_sdr='assumido_humano'`, registra evento `humano_assumiu_via_sync`.
5. Retorna `{ inserted_humano, inserted_lead, total_fetched }`.

CORS padrão `npm:@supabase/supabase-js@2/cors`. Validação Zod do body. Usa `SUPABASE_SERVICE_ROLE_KEY` (admin) para escrever.

### 2. Chamada automática no painel

Em `src/components/atendimento/ChatPanel.tsx`:
- Adicionar `useEffect` que chama `supabase.functions.invoke('whatsapp-sync-chat', { body: { lead_id: leadId } })` quando `leadId` muda **e** a cada 30s enquanto a aba estiver aberta (interval limpo no unmount).
- Após sucesso, invalidar `["mensagens-sdr", leadId]` (o realtime já cobre, mas garantimos refresh imediato).
- Falhas silenciosas (apenas console.warn) — não bloqueia UI.

### 3. Cron de varredura (rede de segurança)

Via `supabase--insert` (pg_cron + pg_net, não migration — contém keys):
- Cron `whatsapp-sync-chat-ativas` a cada 5 min.
- Faz `POST` para uma nova função `whatsapp-sync-chat-batch` (`verify_jwt = false`, protegida por `SDR_INBOUND_SECRET` na query).
- A batch seleciona leads com `ultima_mensagem_em > now() - interval '48 hours'` (limite 50) e chama a lógica de sync para cada um.

### 4. Backfill imediato da Anibel + leads ativos

Após deploy, executo manualmente a `whatsapp-sync-chat-batch` uma vez para popular o gap das últimas 48h.

## Detalhes técnicos

**Dedup robusto:** uso `metadata->>'messageId'` indexado via consulta `.eq` (Z-API garante `messageId` único). Para mensagens antigas sem messageId no metadata, fallback é `(lead_id, origem, conteudo, enviada_em ±2s)`.

**Timezone:** Z-API `moment` vem em ms epoch UTC — converto com `new Date(moment).toISOString()`.

**Mídia:** Z-API retorna `image`, `audio`, `document` etc. Para este MVP, registro placeholder `[mídia: <tipo>]` em `conteudo` com `metadata.media_url` preservada — assim a conversa fica completa visualmente. (Renderização rica de mídia fica fora deste escopo.)

**Segurança:** `whatsapp-sync-chat` exige JWT do usuário do painel. `whatsapp-sync-chat-batch` exige `?t=SDR_INBOUND_SECRET`.

**Não toco** no `whatsapp-inbound` nem na lógica de bot existente. Não mexo em `whatsapp_templates`.

## Arquivos

- novo: `supabase/functions/whatsapp-sync-chat/index.ts`
- novo: `supabase/functions/whatsapp-sync-chat-batch/index.ts`
- editado: `src/components/atendimento/ChatPanel.tsx` (efeito de sync on-mount + interval)
- 1 `supabase--insert` para criar o cron job

## Verificação pós-deploy

1. Abrir conversa da Anibel no painel → em ≤2s aparecer as respostas humanas que estavam faltando.
2. `SELECT origem, count(*) FROM mensagens_sdr WHERE origem='humano' AND created_at > now() - interval '10 minutes'` > 0.
3. Aguardar 5 min e confirmar que o cron rodou (evento `whatsapp_sync_batch_executado` em `eventos_sdr`).

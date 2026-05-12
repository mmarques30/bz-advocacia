# CLAUDE.md — SDR B&Z (V3)

> Lido automaticamente pelo Claude Code ao abrir o repo.

## Projeto

Bot SDR de WhatsApp da **Borges & Zembruski Advocacia** (cliente IAplicada).

**Comportamento esperado:**
- Bot é o **primeiro a responder** todas as mensagens novas no WhatsApp da B&Z.
- Cria automaticamente o lead em `leads_geral` se o telefone for desconhecido.
- Classifica a demanda e roteia entre 4 fluxos:
  - **saude** → 2 perguntas + envia link de pagamento + handoff.
  - **inventario** → 2-3 perguntas + handoff direto.
  - **qualificacao_geral** → M1, M2, M3 da área + handoff.
  - **fora_escopo** → "um advogado vai entrar em contato".
- **NÃO atende** em: grupos, clientes existentes (telefone em `processos`), leads com `bot_pausado=true`, ou leads em status diferente de `novo`/`em_atendimento_bot`.

## Stack
- Claude Code (desenvolvimento)
- GitHub `mmarques30/bz-advocacia` (versionamento)
- Supabase `nvkxblrwblhvggndlfax` (DB + Edge Functions)
- Lovable (painel CRM existente)
- Z-API (gateway WhatsApp)
- Claude Haiku (classificador)

## Schema

**Tabela principal:** `public.leads_geral` (já existia, com colunas adicionadas pela migration V3).

**Tabelas novas (criadas pela migration V3):**
- `mensagens_sdr` — histórico de conversas do bot
- `qualificacoes_sdr` — respostas estruturadas das M1/M2/M3
- `advogados_sdr` — quem recebe os handoffs
- `eventos_sdr` — auditoria/debug
- `servicos_sdr` — lista das áreas atendidas (seed inclusa)
- `vw_clientes_ativos` — view que cruza leads_geral × processos

**Tabelas intocadas:** `whatsapp_templates` (modelos manuais), e tudo mais do CRM atual.

## Edge Functions (no `supabase/functions/`)

| Função | Quando dispara | Verify JWT |
|---|---|---|
| `whatsapp-inbound` | Webhook Z-API ao receber mensagem | OFF |
| `on-new-lead` | Database Webhook ao inserir em `leads_geral` | ON |
| `assumir-conversa` | Painel Lovable chama | ON |
| `enviar-msg-humano` | Painel Lovable chama | ON |
| `cron-followup` | pg_cron a cada 6h | OFF |

## Comandos

```bash
supabase link --project-ref nvkxblrwblhvggndlfax
supabase secrets set --env-file ./.env
supabase functions deploy whatsapp-inbound --no-verify-jwt
supabase functions deploy on-new-lead
supabase functions deploy assumir-conversa
supabase functions deploy enviar-msg-humano
supabase functions deploy cron-followup --no-verify-jwt
supabase functions logs whatsapp-inbound --tail
```

## Convenções de mensagem (WhatsApp)
- Texto puro, bullets com `•`.
- Emojis permitidos: apenas `🤓` e `✱`.
- Acentuação correta.
- Tom direto e próximo. Nunca robótico. Nunca promete resultado jurídico.
- Máximo 3 perguntas de qualificação por lead.

## Regras críticas (não quebrar)
1. **`whatsapp_templates` é INTOCÁVEL** — vocês usam manualmente hoje.
2. **Bot só responde em conversa nova / qualificação** — nunca em cliente, grupo, conversa antiga ou bot pausado.
3. **Sempre marcar `bot_pausado = true`** quando humano assumir.
4. **Tabelas do CRM atual não são alteradas** — só `leads_geral` recebe colunas adicionais via `ADD COLUMN IF NOT EXISTS`.
5. **Link de pagamento de saúde** está em `servicos_sdr.link_pagamento` (genérico `https://borgesezembruski.com/` por enquanto). Depois trocar pelo link real.

## Decisões pendentes (perguntar à Mariana)
- Link de pagamento real (Asaas/Stripe/Mercado Pago) pra saúde.
- Texto LGPD definitivo.
- Mapa de advogados por área (cadastrar em `advogados_sdr`).
- Se a relação `processos.lead_id → leads_geral.id` é exatamente assim (a view `vw_clientes_ativos` assume isso; ajustar se for diferente).

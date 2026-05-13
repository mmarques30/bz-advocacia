# Plano — SDR Bot: Webhook por Shared Secret + Adaptação de Schema

Resolve dois problemas de uma vez:
1. Eliminar dependência do `service_role` no Vault (substituir por shared secret HMAC-style).
2. Adaptar as Edge Functions ao schema real de `leads_geral` (nomes Meta, não os do bot).

---

## Parte 1 — Trocar autenticação do trigger (service_role → shared secret)

### 1.1 Migration
- `create extension if not exists pgcrypto;` (se necessário — pg_net já está)
- Recriar `public.trg_on_new_lead_webhook()`:
  - Lê secret `sdr_webhook_secret` do `vault.decrypted_secrets` (não mais `sdr_service_role_key`).
  - Envia `X-Webhook-Secret: <valor>` em vez de `Authorization: Bearer ...`.
  - Mantém `SECURITY DEFINER` e `search_path = public, vault, net`.
  - Mantém payload `{type, table, record}`.
- `update vault.secrets set secret = <gerado> where name = 'sdr_service_role_key'` → renomear para `sdr_webhook_secret` (ou criar novo e deletar o antigo).
  - Valor: gerado via `gen_random_uuid()::text` direto no SQL (nunca passa pelo chat).
- Trigger continua `AFTER INSERT ON leads_geral`.

### 1.2 `supabase/config.toml`
- `[functions.on-new-lead]` → `verify_jwt = false` (passa a ser webhook público autenticado por header).

### 1.3 `supabase/functions/on-new-lead/index.ts`
- No início do handler:
  ```ts
  const expected = Deno.env.get("SDR_WEBHOOK_SECRET");
  const got = req.headers.get("x-webhook-secret");
  if (!expected || got !== expected) {
    return new Response("Unauthorized", { status: 401 });
  }
  ```
- Resto da lógica permanece igual.

### 1.4 Runtime secret
- Adicionar `SDR_WEBHOOK_SECRET` nos secrets do projeto (mesmo valor gerado e gravado no Vault). Vou solicitar via `add_secret` mostrando o valor gerado pela migration nos logs (ou gerar no client).
  - **Alternativa mais limpa:** gerar o UUID antes e gravá-lo nos dois lugares (Vault + runtime secret) na mesma migration/turn.

---

## Parte 2 — Adaptar Edge Functions ao schema real de `leads_geral`

Mapa de colunas (esperado pelo bot → real):
- `nome` → `full_name`
- `telefone` → `phone_number` (fallback `contato_whatsapp`)
- `created_at` → `created_time`
- `tipo_de_processo` → `tipo_servico`
- `origem` → `platform` (e `origem_sdr` quando bot cria)

### 2.1 `supabase/functions/_shared/db.ts`
- Atualizar `type Lead` para usar nomes reais + alias.
- Em `buscarLeadPorTelefone`: query por `phone_number = X OR contato_whatsapp = X`.
- Em `criarLead`: gerar `id = 'sdr_' || crypto.randomUUID()`, gravar em `full_name`/`phone_number`/`origem_sdr`/`platform='whatsapp'`, deixar `created_time = now()`.
- Em `historicoMensagens`, `ehClienteExistente`, `buscarServicosPorArea`, `buscarAdvogadoPorArea`: revisar referências a colunas.
- Adicionar getters: `lead.nome` retorna `full_name`, `lead.telefone` retorna `phone_number ?? contato_whatsapp`, `lead.tipo_de_processo` retorna `tipo_servico`. Ou refatorar consumidores — escolher a opção menos invasiva (provavelmente getters/normalização no `buscarLeadPorTelefone`).

### 2.2 Funções consumidoras
- `whatsapp-inbound/index.ts`, `on-new-lead/index.ts`, `cron-followup/index.ts`, `assumir-conversa/index.ts`, `enviar-msg-humano/index.ts`: garantir que usem o objeto `Lead` normalizado.
- `on-new-lead`: filtro `lead.origem_sdr === 'whatsapp_direto'` continua válido.
- `notificarAdvogado` em `whatsapp-inbound`: select usa `full_name, phone_number` em vez de `nome, telefone`.

### 2.3 UPDATEs em `leads_geral`
- Trocar qualquer `update({ nome, telefone, ... })` por `update({ full_name, phone_number, ... })`.

---

## Parte 3 — Verificação

- Deploy das 5 funções (auto via Lovable Cloud).
- `curl_edge_functions` em `on-new-lead` sem header → 401.
- `curl_edge_functions` em `on-new-lead` com header correto + payload fake → 200 e log do `lead_sem_telefone` (ou `skipped`).
- INSERT de teste em `leads_geral` (após confirmação da Mariana) para validar o trigger ponta-a-ponta.

---

## O que NÃO muda

- Schema de `leads_geral` (mantém colunas Meta, sem alias view).
- RLS das tabelas SDR.
- `verify_jwt` das outras 4 funções (`whatsapp-inbound=false`, `cron-followup=false`, `assumir-conversa=true`, `enviar-msg-humano=true`).
- Secrets já existentes (Z-API, Anthropic, etc.).

---

## Pendências do usuário após implementação

1. Configurar webhook da Z-API → `whatsapp-inbound`.
2. Cadastrar advogados em `advogados_sdr`.
3. (Opcional) Trocar `URL_PAGAMENTO_GENERICO` pelo link real de saúde.

---

## Resumo técnico das mudanças de arquivo

- `supabase/migrations/<novo>.sql` — recriar trigger + rotacionar secret no Vault
- `supabase/config.toml` — `on-new-lead` vira `verify_jwt = false`
- `supabase/functions/on-new-lead/index.ts` — checagem de `x-webhook-secret`
- `supabase/functions/_shared/db.ts` — normalização de schema (mapa Meta ↔ bot)
- Possíveis ajustes pontuais nas 4 outras edge functions se referenciarem campos legados
- Novo runtime secret: `SDR_WEBHOOK_SECRET`
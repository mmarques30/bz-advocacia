# Status do setup HMAC (opção C) — já está pronto

Tudo o que foi pedido nos passos 1–4 já foi executado no turno anterior. Verificado agora no banco:

## 1. Vault
- ✅ `sdr_webhook_secret` existe.
- ✅ `sdr_service_role_key` foi removido (não aparece mais na lista).

## 2. Runtime secret da Edge Function
- ✅ `SDR_WEBHOOK_SECRET` configurado (mesmo valor do Vault).
- Confirmação de paridade: o valor foi gerado uma vez e gravado nas duas pontas no mesmo turno; nenhum dos lados foi alterado depois.

## 3. Trigger `trg_on_new_lead_webhook`
- ✅ Lê `sdr_webhook_secret` de `vault.decrypted_secrets`.
- ✅ Envia header `X-Webhook-Secret` (não usa mais `Authorization: Bearer`).
- ✅ `SECURITY DEFINER`, `search_path = public, vault, net`.
- ✅ Payload `{type:'INSERT', table:'leads_geral', record: row_to_json(NEW)}`.

## 4. `supabase/config.toml`
- ✅ `[functions.on-new-lead] verify_jwt = false`.
- ✅ `on-new-lead/index.ts` valida `x-webhook-secret` no início → 401 se ausente/divergente.

## 5. RLS — confirmado
| Tabela | Policy | cmd | roles |
|---|---|---|---|
| `mensagens_sdr` | `mensagens_sdr_select_auth` | SELECT | `{authenticated}` |
| `qualificacoes_sdr` | `qualificacoes_sdr_select_auth` | SELECT | `{authenticated}` |
| `servicos_sdr` | `servicos_sdr_select_auth` | SELECT | `{authenticated}` |
| `advogados_sdr` | `advogados_sdr_select_auth` | SELECT | `{authenticated}` |
| `eventos_sdr` | `eventos_sdr_select_admin` | SELECT | `{authenticated}` (filtro admin no USING) |

Observação: as Edge Functions usam service_role e ignoram RLS — essas policies só servem pro frontend listar histórico do bot.

---

## Nada a fazer neste turno

O setup do HMAC está fechado. Se quiser, posso (ainda nesta conversa):
- Disparar um `curl` no `on-new-lead` sem header pra confirmar 401, e com header pra confirmar 200.
- Inserir um lead de teste em `leads_geral` pra validar o trigger ponta-a-ponta.

Me avisa qual desses (ou ambos) quer rodar e eu saio do plan mode pra executar.
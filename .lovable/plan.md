# Testes HMAC + ponta-a-ponta do bot SDR

## TESTE 1 — curl no `on-new-lead`

**1a) Sem header** (esperado: 401)
```bash
curl -i -X POST \
  -H "Content-Type: application/json" \
  -d '{"type":"INSERT","table":"leads_geral","record":{"id":"test1"}}' \
  https://nvkxblrwblhvggndlfax.functions.supabase.co/on-new-lead
```

**1b) Com header `X-Webhook-Secret`** lendo o valor do Vault via `supabase--read_query` em `vault.decrypted_secrets where name='sdr_webhook_secret'`, depois `curl` com o header. Esperado: 200.

Reporto os dois status codes.

## TESTE 2 — Insert real em `leads_geral`

**Passo A — cadastrar Time B&Z** (via `supabase--insert`):
```sql
insert into public.advogados_sdr (nome, email, telefone, areas)
values (
  'Time B&Z',
  'time@bnz.com.br',
  '5531990643023',
  '{saude,inventario,familia,civel,consumidor,trabalhista,previdenciario,geral}'
);
```

**Passo B — insert do lead fake** (via `supabase--insert`):
```sql
insert into public.leads_geral (
  id, full_name, phone_number, contato_whatsapp,
  tipo_servico, platform, lead_status, origem_sdr,
  created_time
) values (
  'sdr_test_' || gen_random_uuid()::text,
  'Teste Mariana',
  '5531990643023',
  '5531990643023',
  'Saúde',
  'teste_manual',
  'Pendente',
  'manual_test',
  now()
);
```

**Passo C — aguardar ~10s e verificar:**
- `supabase--read_query`:
  ```sql
  select origem, conteudo, enviada_em
  from mensagens_sdr
  where lead_id like 'sdr_test_%'
  order by enviada_em;
  ```
- `supabase--edge_function_logs` em `on-new-lead` para ver invocação + qualquer erro.
- `supabase--analytics_query` em `postgres_logs` para erros do trigger `trg_on_new_lead_webhook` no mesmo período.

## Entrega
Devolvo:
1. Status codes 1a e 1b.
2. Linhas de `mensagens_sdr` (ou vazio + diagnóstico).
3. Erros relevantes nos logs (edge + Postgres).

## Riscos / observações
- O `id` "test_fake" do TESTE 1b não existe — o `on-new-lead` vai tentar inserir mensagens com `lead_id` inválido e provavelmente quebrar no log (esperado, foco é o status code da validação HMAC).
- O insert real dispara Z-API → 2 mensagens reais para `5531990643023`. Confirmar que esse número é o seu antes de aprovar.

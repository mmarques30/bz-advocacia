## Patch whatsapp-inbound: dedup, auto-criação de lead e telefone com/sem 9

### Parte 1 — Migration: tabela de lock

Cria `public.mensagens_inbound_lock` para idempotência por `messageId` da Z-API:

```sql
create table if not exists public.mensagens_inbound_lock (
  message_id text primary key,
  created_at timestamptz not null default now()
);
create index if not exists idx_lock_created
  on public.mensagens_inbound_lock(created_at);

alter table public.mensagens_inbound_lock enable row level security;
-- sem policies: só service role escreve (Edge Function)
```

Observação: a limpeza periódica (delete onde `created_at < now() - interval '24h'`) fica como follow-up (cron). Pra esse patch, basta a tabela existir.

### Parte 2 — Idempotência no whatsapp-inbound

No `supabase/functions/whatsapp-inbound/index.ts`, logo após o `await req.json()` e o `getSupabaseAdmin()`, antes do `raw_payload_debug`:

```ts
const messageId = (payload as any).messageId as string | undefined;
if (messageId) {
  const { error: lockErr } = await supabase
    .from("mensagens_inbound_lock")
    .insert({ message_id: messageId });
  if (lockErr && (lockErr.code === "23505" || lockErr.message?.includes("duplicate"))) {
    await registrarEvento(supabase, null, "webhook_duplicado_ignorado", { messageId });
    return new Response(JSON.stringify({ ignored: "duplicate_messageId" }), { status: 200 });
  }
}
```

(Mantém o `raw_payload_debug` e o `webhook_recebido` logo em seguida.)

Nota: não vamos usar `EdgeRuntime.waitUntil` neste patch — só o lock já elimina o efeito da retry.

### Parte 3 — Auto-criar lead em telefone desconhecido

Substituir o bloco atual:

```ts
if (!lead) {
  await registrarEvento(supabase, null, "msg_de_telefone_desconhecido", { telefone, texto });
  return new Response(JSON.stringify({ ignored: "lead_nao_encontrado" }), { status: 200 });
}
```

por uma criação automática em `leads_geral`:

- **Nome**: `payload.senderName ?? payload.chatName ?? "Lead WhatsApp"`.
- **Plataforma/origem**: detectar Meta click-to-WhatsApp pelos campos comuns da Z-API (`payload.referral`, `payload.momentMetadata`, `payload.ctwaContext`, `payload.sourceId`). Como ainda não temos certeza do nome exato do campo no payload da Z-API, a função vai:
  1. logar `lead_auto_criado_payload_debug` com as chaves do payload pra a Mariana confirmar;
  2. usar heurística: se houver qualquer campo com `referral`/`ctwa`/`source_id`/`adId`, marcar `platform = 'facebook_ads'` (ou `instagram_ads` se o source contiver "instagram"); caso contrário `whatsapp_organico`.
- **id do lead**: `sdr_wa_<timestamp>_<últimos 6 do telefone>` (string, igual aos demais `sdr_*`).
- **Campos preenchidos**: `id`, `full_name`, `phone_number`, `contato_whatsapp` (telefone normalizado), `platform`, `origem_sdr`, `status_sdr = 'novo'`, `etapa_qualificacao = 'M0'`, `created_time = now()`.
- Após o insert, o trigger `trg_on_new_lead_webhook` chama `on-new-lead`, que envia M0 + LGPD. A função inbound então **registra a mensagem do lead** em `mensagens_sdr` e retorna 200 sem disparar Claude nessa primeira hit (evita corrida com a M0). Em hits subsequentes o fluxo normal segue.

Helper novo em `_shared/db.ts`:

```ts
export async function criarLeadWhatsApp(
  supabase, { nome, telefone, platform, origem }
): Promise<Lead>
```

### Parte 4 — Telefone com/sem 9

`_shared/zapi.ts` — nova função utilitária:

```ts
export function variacoesTelefone(telefone: string): string[] {
  const base = normalizarTelefone(telefone);  // sempre com 55
  const out = new Set<string>([base]);
  // 55 + DDD(2) + 8 dígitos => 12 → injeta 9
  if (base.length === 12) out.add(base.slice(0, 4) + "9" + base.slice(4));
  // 55 + DDD(2) + 9 + 8 dígitos => 13 → remove 9
  if (base.length === 13 && base[4] === "9") out.add(base.slice(0, 4) + base.slice(5));
  return [...out];
}
```

`_shared/db.ts` — `buscarLeadPorTelefone`:

- Substitui as variações atuais por `variacoesTelefone(telefone)` + as variações sem `55` e com `+`.
- Mantém o fallback `like` nos últimos 8 dígitos.

`normalizarTelefone` em si **não** muda (continua determinístico, exigência da Z-API). A "tolerância" 9/sem-9 é apenas no lookup do lead.

### Parte 5 — Validação após deploy

1. Reaplicar o smoke test de insert (`sdr_test_*`) e conferir em `eventos_sdr` se aparece `webhook_duplicado_ignorado` quando a Z-API faz retry, e que só existe **uma** linha de cada mensagem do bot em `mensagens_sdr`.
2. Pedir pra Mariana mandar mensagem de um número **fora da base** → conferir:
   - novo registro em `leads_geral` com `origem_sdr` esperado;
   - M0 + LGPD entregues via `on-new-lead`;
   - `eventos_sdr` mostra `lead_auto_criado_payload_debug` com as chaves reais → ajustar a detecção de `platform` se necessário.

### Arquivos tocados

- migration nova (tabela `mensagens_inbound_lock`)
- `supabase/functions/_shared/zapi.ts` (adiciona `variacoesTelefone`)
- `supabase/functions/_shared/db.ts` (atualiza `buscarLeadPorTelefone`, adiciona `criarLeadWhatsApp`)
- `supabase/functions/whatsapp-inbound/index.ts` (lock + auto-criação)

### Pergunta aberta

A heurística de `platform` em Parte 3 é provisória — depois do primeiro lead orgânico real, o `lead_auto_criado_payload_debug` vai mostrar o nome exato do campo da Z-API (provavelmente `referral` ou `ctwaContext`), e a gente fixa a detecção. Posso seguir com a heurística agora?

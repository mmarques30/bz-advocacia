# Patch whatsapp-inbound: rejeitar IDs anônimos do WhatsApp

## Contexto

Os logs `webhook_recebido` e `raw_payload_debug` mostram que a Z-API está mandando muitos eventos com `phone` no formato `<id>@lid` (chats anônimos / LIDs do WhatsApp Web). Hoje a função entra no fluxo, `normalizarTelefone()` apenas tira não-dígitos e prefixa `55`, gerando "telefones" com 15-17 dígitos que viram leads-fantasma.

Caso concreto encontrado: lead `sdr_wa_1779112325767_511859` (Fábio Paiva), `phone_number = 55128007339511859` (17 dígitos), `origem_sdr = humano_iniciou`. O sufixo `_511859` no id é exatamente os últimos 6 dígitos do telefone, então foi gerado pelo `criarLeadWhatsApp` a partir de um `phone` tipo `128007339511859@lid` que virou `55128007339511859`.

## Alterações

### 1. `supabase/functions/whatsapp-inbound/index.ts`

Adicionar **antes** da checagem de `isStatusReply` / `isGroup` (≈ linha 92), depois do `webhook_recebido` log:

```ts
// IDs anônimos do WhatsApp (LID / broadcast / newsletter) não são
// telefones reais. Se vier só um @lid sem participantPhone numérico,
// ignora — senão normalizarTelefone gera leads-fantasma de 15-17 dígitos.
const phoneRaw = (payload.phone ?? "").toString();
const participantPhone = ((payload as any).participantPhone ?? "").toString();
const participantLid = ((payload as any).participantLid ?? "").toString();

const phoneEhAnonimo =
  phoneRaw.includes("@lid") ||
  phoneRaw.includes("@broadcast") ||
  phoneRaw.includes("@newsletter");

if (phoneEhAnonimo) {
  // Tentativa de recuperação: se houver participantPhone real (dígitos,
  // sem @lid), usa esse como telefone — caso de chat anônimo de número
  // conhecido. Se não, ignora silenciosamente.
  const candidato = /^\d{10,15}$/.test(participantPhone.replace(/\D/g, ""))
    ? participantPhone.replace(/\D/g, "")
    : null;

  if (!candidato) {
    await registrarEvento(supabase, null, "webhook_anonimo_ignorado", {
      phone: phoneRaw,
      chatLid: (payload as any).chatLid ?? null,
      participantLid: participantLid || null,
      participantPhone: participantPhone || null,
      senderName: (payload as any).senderName ?? null,
      fromMe: !!payload.fromMe,
    });
    return new Response(
      JSON.stringify({ ignored: "anonimo_ou_broadcast" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  // Reescreve o payload.phone com o participantPhone válido pro restante do fluxo
  (payload as any).phone = candidato;
  await registrarEvento(supabase, null, "webhook_anonimo_recuperado_via_participant", {
    phone_original: phoneRaw,
    phone_recuperado: candidato,
  });
}
```

Pontos importantes:
- Bloqueia **antes** de qualquer `criarLeadWhatsApp` / lookup, então não gera lead-fantasma.
- Não bloqueia mensagens reais: o caso `phone numérico + participantLid` continua passando direto (pois `phoneRaw` é numérico, `phoneEhAnonimo = false`).
- Para o caso `phone @lid + participantPhone numérico` (mensagens em chat LID vindas de número conhecido), reescreve `payload.phone` e segue o fluxo normal.

### 2. Limpeza do lead inválido `sdr_wa_1779112325767_511859`

Migration `delete_lead_fantasma_lid`:

```sql
-- Lead criado por bug pré-patch: phone_number 55128007339511859 (17 dígitos)
-- veio de payload.phone tipo "128007339511859@lid".
DELETE FROM public.mensagens_sdr WHERE lead_id = 'sdr_wa_1779112325767_511859';
DELETE FROM public.eventos_sdr WHERE lead_id = 'sdr_wa_1779112325767_511859';
DELETE FROM public.contact_submissions WHERE lead_geral_id = 'sdr_wa_1779112325767_511859';
DELETE FROM public.leads_geral WHERE id = 'sdr_wa_1779112325767_511859';
```

### 3. Deploy + smoke test

- `supabase--deploy_edge_functions` em `whatsapp-inbound`.
- Smoke test via `supabase--curl_edge_functions` POST com body:
  ```json
  { "phone": "123456789@lid", "fromMe": false, "text": { "message": "oi" }, "messageId": "smoke-lid-1" }
  ```
  Esperado: HTTP 200 + `{"ignored":"anonimo_ou_broadcast"}`.
- Verificar: `SELECT count(*) FROM leads_geral WHERE id LIKE 'sdr_wa_%_456789'` = 0.
- Verificar: novo evento `webhook_anonimo_ignorado` em `eventos_sdr`.

### Fora de escopo

- Não mexer em `normalizarTelefone()` (afeta outros callers).
- Não mexer em `criarLeadWhatsApp` nem no fluxo de backlog.
- Sem mudanças no front-end nem em outras edge functions.

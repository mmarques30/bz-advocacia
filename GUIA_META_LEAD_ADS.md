# Guia — Conectar Meta Lead Ads ao Supabase

Passo a passo pra fazer o lead vindo do anúncio do Meta cair direto no Supabase, disparando a M0 do SDR.

> Tempo estimado: 30-45 minutos na primeira vez.

---

## Pré-requisitos

- Página do Facebook do escritório B&Z já com formulários de Lead Ads configurados.
- Acesso administrador da Página.
- Conta em [developers.facebook.com](https://developers.facebook.com).
- Edge Function `meta-lead-webhook` já deployada (passo 6 do README principal).

---

## Passo 1 — Criar um App no Facebook for Developers

1. Vá em [developers.facebook.com](https://developers.facebook.com) → **Meus Apps → Criar App**.
2. Caso de uso: escolha **Outro → Empresa**.
3. Nome do app: `SDR Advocacia B&Z` (ou o que preferir).
4. Anote o **App ID** e o **App Secret** (em **Configurações → Básico**). O App Secret vai virar a env `META_APP_SECRET`.

## Passo 2 — Adicionar produtos ao App

Dentro do App, vá em **Adicionar produto** e adicione:

- **Webhooks**
- **Marketing API** (opcional, ajuda em testes futuros)

## Passo 3 — Gerar um Page Access Token de longa duração

Esse é o token que sua Edge Function vai usar pra buscar os dados de cada lead.

1. Acesse o [Graph API Explorer](https://developers.facebook.com/tools/explorer/).
2. Selecione seu App no topo.
3. Em **User or Page**, escolha a **Página** do escritório.
4. Em **Permissions**, adicione:
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_metadata`
   - `leads_retrieval`
   - `pages_manage_ads`
5. Clique em **Generate Access Token** e autorize.
6. O token gerado é de curta duração (1-2h). Pra trocar por um **token longo** (60 dias), use [Access Token Tool](https://developers.facebook.com/tools/accesstoken) e clique em **Extend Access Token**.
7. Pra obter um **Page Access Token nunca expira**, faça:
   ```
   GET https://graph.facebook.com/v19.0/me/accounts?access_token={USER_TOKEN_LONGO}
   ```
   Na resposta, ache a Página do escritório e copie o campo `access_token` dela — esse é o seu **Page Access Token permanente**.

Esse valor vai pra env `META_PAGE_ACCESS_TOKEN` no Supabase.

## Passo 4 — Configurar o Webhook

1. No painel do App, abra **Webhooks** → **Adicionar Assinatura → Page**.
2. **Callback URL:**
   ```
   https://<PROJECT_REF>.functions.supabase.co/meta-lead-webhook
   ```
3. **Verify Token:** invente uma string aleatória, exemplo:
   ```
   bnz_sdr_aPCS9eJ2vK1qXh4f
   ```
   Esse valor vai pra env `META_VERIFY_TOKEN`.
4. Clique em **Verificar e salvar**. O Meta vai bater na sua Edge Function fazendo GET com `hub.challenge`. Se o `META_VERIFY_TOKEN` no Supabase bater com o que você colocou aqui, dá sucesso.
5. Depois de verificado, marque o tópico **leadgen** e clique em **Inscrever**.

## Passo 5 — Subscrever a Página ao app

Webhooks do Meta funcionam em dois níveis (App e Página). Você precisa fazer um POST manual pra subscrever a Página específica.

No Graph Explorer (com o User Token longo), rode:

```
POST https://graph.facebook.com/v19.0/{PAGE_ID}/subscribed_apps
?subscribed_fields=leadgen
&access_token={PAGE_ACCESS_TOKEN}
```

Onde `{PAGE_ID}` é o ID numérico da Página. Resposta `{ success: true }`.

## Passo 6 — Configurar os secrets no Supabase

```bash
supabase secrets set \
  META_VERIFY_TOKEN=bnz_sdr_aPCS9eJ2vK1qXh4f \
  META_PAGE_ACCESS_TOKEN=cole_aqui_o_token_permanente \
  META_APP_SECRET=cole_aqui_o_app_secret
```

Ou pela UI: **Project Settings → Edge Functions → Secrets**.

## Passo 7 — Deploy da função

Se ainda não fez:

```bash
supabase functions deploy meta-lead-webhook --no-verify-jwt
```

## Passo 8 — Testar

1. No painel do App em **Webhooks → leadgen**, clique em **Testar** e dispare um evento de teste. O Meta envia um payload fake.
2. Veja os logs:
   ```bash
   supabase functions logs meta-lead-webhook --tail
   ```
3. Se o teste passar, faça um teste real: abra o anúncio no celular ou use a [Lead Ads Testing Tool](https://developers.facebook.com/tools/lead-ads-testing) e preencha o form.
4. Em até 30 segundos o lead aparece no Supabase em `public.leads`, o on-new-lead dispara, e a M0 cai no WhatsApp.

---

## Mapeamento de campos do Form do Meta

A Edge Function tenta achar os campos por sinônimos comuns. Se o seu form do Meta tem nomes customizados, garanta que pelo menos um destes sinônimos seja usado:

| Campo no Supabase | Sinônimos aceitos no Meta Form |
|---|---|
| nome | `full_name`, `name`, `nome`, `nome_completo` |
| telefone | `phone_number`, `phone`, `telefone`, `whatsapp`, `celular`, `numero_de_telefone` |
| tipo_de_processo | `tipo_de_processo`, `tipo_processo`, `area`, `area_juridica`, `qual_a_sua_demanda`, `qual_o_tipo_de_caso`, `tipo_de_caso` |
| email (opcional) | `email` |

Se o seu form usa outros nomes, dá pra adicionar em `supabase/functions/_shared/meta.ts` (as constantes `SINONIMOS_*`) e redeployar.

---

## Troubleshooting

**Webhook não passa na verificação (passo 4.4)**
- Confira se o `META_VERIFY_TOKEN` está exatamente igual no Supabase Secrets e na UI do Meta.
- Veja os logs: `supabase functions logs meta-lead-webhook --tail` e dispare a verificação no Meta.

**Lead chega mas não cai no Supabase**
- Logs da função vão dizer onde parou.
- Causa comum: `META_PAGE_ACCESS_TOKEN` expirou. Gere novo (passo 3) e atualize o secret.
- Outra causa: form não tem campo de telefone — o normalizador exige nome + telefone.

**Lead cai duas vezes**
- A função deduplica por `telefone` dentro de 24h. Se você quiser garantia rígida, adicione coluna `leadgen_id text unique` em `leads` e altere o insert pra preencher esse campo.

**Página não recebe os eventos depois de tudo configurado**
- Provavelmente faltou o Passo 5 (subscrever a Página). Sem isso, o webhook só responde ao GET mas não recebe POSTs.

---

## Plano B — Polling via Graph API

Se o webhook do Meta der trabalho, dá pra usar polling. Crie uma Edge Function `meta-poll-leads` agendada via `pg_cron` (a cada 1-2 minutos) que chama:

```
GET https://graph.facebook.com/v19.0/{FORM_ID}/leads
  ?access_token={PAGE_ACCESS_TOKEN}
  &filtering=[{"field":"time_created","operator":"GREATER_THAN","value":{UNIX_TIMESTAMP_ULTIMA_BUSCA}}]
```

Funciona, mas tem latência de minutos em vez de segundos. Webhook é o caminho recomendado.

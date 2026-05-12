# SDR Advocacia — Stack code-first

**Claude Code + GitHub + Supabase + Lovable + Z-API**. Sem n8n, sem Zapier, sem Make.

---

## Papel de cada peça

| Peça | O que faz |
|---|---|
| **GitHub** | Casa do código. Toda Edge Function, migration e prompt fica versionado aqui. |
| **Claude Code** | Onde você edita. Abre o repo do GitHub, faz alterações, commita, push e roda `supabase functions deploy`. |
| **Supabase** | Banco (Postgres), Auth e runtime das Edge Functions. É quem executa o bot. |
| **Lovable** | Front do painel CRM (kanban + tela de conversa). Lê e escreve no Supabase. Não está neste repo. |
| **Z-API** | Envia e recebe WhatsApp. Conecta no Supabase via webhook. |
| **Claude Haiku** | Classifica as respostas do lead e gera a próxima mensagem. |

---

## Estrutura do repo

```
.
├── 01_migration.sql                ← rode no SQL Editor do Supabase
├── .env.example                    ← copie pra .env e preencha as chaves
├── .gitignore
├── CLAUDE.md                       ← contexto pro Claude Code (lido automaticamente)
├── GUIA_META_LEAD_ADS.md           ← passo a passo Meta → Supabase
├── prompt-tela-conversa-lovable.md ← cole no Lovable
├── README.md                       ← este arquivo
└── supabase/
    └── functions/
        ├── _shared/                ← clientes e prompts compartilhados
        ├── meta-lead-webhook/      ← recebe lead do Meta Lead Ads (form da LP)
        ├── on-new-lead/            ← dispara M0 quando lead entra no Supabase
        ├── whatsapp-inbound/       ← recebe respostas e classifica
        ├── assumir-conversa/       ← handoff humano
        ├── enviar-msg-humano/      ← envio manual pelo painel
        └── cron-followup/          ← reengajamento automático
```

---

## Setup (uma vez só)

### 1) Subir essa pasta como repo no GitHub

Crie um repo privado no GitHub chamado `sdr-advocacia` e dentro desta pasta rode:

```bash
git init
git add .
git commit -m "feat: SDR advocacia inicial"
git branch -M main
git remote add origin git@github.com:SEU_USUARIO/sdr-advocacia.git
git push -u origin main
```

### 2) Abrir o repo no Claude Code

Clone localmente e abra o Claude Code apontando pra essa pasta. O arquivo `CLAUDE.md` na raiz já está preparado pra dar contexto automático ao Claude Code (stack, convenções, comandos úteis e regras do projeto).

```bash
git clone git@github.com:SEU_USUARIO/sdr-advocacia.git
cd sdr-advocacia
claude
```

A partir daí, toda alteração nas Edge Functions, prompts ou migration acontece via Claude Code, e o fluxo é sempre:
*editar → testar → commitar → push → deploy*.

### 3) Rodar a migration no Supabase

- Abra o **SQL Editor** do projeto Supabase.
- Cole o conteúdo de `01_migration.sql`.
- Rode. A migration é aditiva (`IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`), não destrói nada do schema atual.

### 4) Instalar o Supabase CLI e vincular o projeto

```bash
brew install supabase/tap/supabase
supabase login
supabase link --project-ref SEU_PROJECT_REF
```

### 5) Configurar secrets das Edge Functions

Copie `.env.example` pra `.env`, preencha as chaves e suba:

```bash
cp .env.example .env
# edita .env com as chaves reais
supabase secrets set --env-file ./.env
```

Pode subir também pela UI: **Project Settings → Edge Functions → Secrets**.

### 6) Deploy das funções

```bash
supabase functions deploy meta-lead-webhook --no-verify-jwt
supabase functions deploy on-new-lead
supabase functions deploy whatsapp-inbound --no-verify-jwt
supabase functions deploy assumir-conversa
supabase functions deploy enviar-msg-humano
supabase functions deploy cron-followup --no-verify-jwt
```

`--no-verify-jwt` é necessário em `whatsapp-inbound` e `cron-followup` porque elas são chamadas por terceiros (Z-API e pg_cron), que não mandam JWT de usuário.

### 7) Configurar o Database Webhook (lead novo → M0)

No Supabase: **Database → Webhooks → Create a new hook**

- **Name:** `on_new_lead`
- **Table:** `leads`
- **Events:** `INSERT`
- **Type:** HTTP Request — POST
- **URL:** `https://<PROJECT_REF>.functions.supabase.co/on-new-lead`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`

### 7.5) Conectar o Meta Lead Ads ao Supabase

A LP é WordPress, o form é do Meta Lead Ads. A Edge Function `meta-lead-webhook` recebe o lead direto do Facebook, puxa os dados via Graph API e insere em `public.leads` — o que dispara o `on-new-lead` e a M0 sai automaticamente.

Passo a passo detalhado: veja **`GUIA_META_LEAD_ADS.md`**. Resumo:

1. Criar app em `developers.facebook.com`.
2. Gerar Page Access Token permanente com escopos `leads_retrieval`, `pages_show_list`, `pages_read_engagement`, `pages_manage_metadata`.
3. Adicionar produto Webhooks ao app e criar assinatura **Page → leadgen** apontando pra `https://<PROJECT_REF>.functions.supabase.co/meta-lead-webhook`.
4. Configurar os secrets `META_VERIFY_TOKEN`, `META_PAGE_ACCESS_TOKEN`, `META_APP_SECRET`.
5. Subscrever a Página ao app via Graph API.

### 8) Apontar o webhook da Z-API pra `whatsapp-inbound`

Na UI da Z-API, em **Webhooks → Webhook ao receber**, cole:

```
https://<PROJECT_REF>.functions.supabase.co/whatsapp-inbound
```

### 9) Agendar o `pg_cron` pra follow-up

No SQL Editor:

```sql
select cron.schedule(
  'sdr_followup_cron',
  '0 */6 * * *',
  $$
    select net.http_post(
      url := 'https://<PROJECT_REF>.functions.supabase.co/cron-followup',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
      )
    );
  $$
);
```

### 10) Cadastrar advogados

```sql
insert into public.advogados (nome, email, telefone, areas) values
  ('Dr. Trabalhista', 'trabalhista@escritorio.com', '5511999999999', '{trabalhista}'),
  ('Dra. Cível',      'civel@escritorio.com',      '5511988888888', '{civel,familia,sucessoes}'),
  ('Dr. Empresarial', 'empresarial@escritorio.com','5511977777777', '{empresarial,tributario,consultivo}');
```

### 11) Adicionar a tela de conversa no Lovable

Abra `prompt-tela-conversa-lovable.md` e cole o conteúdo no chat do Lovable como nova iteração do seu painel.

### 12) Habilitar Realtime na tabela `mensagens`

No Supabase: **Database → Replication → marque `mensagens`**. A tela de conversa precisa disso pra auto-atualizar.

---

## Fluxo de trabalho contínuo (depois do setup)

Sempre que precisar mudar algo (script de mensagem, regra de SQL, comportamento do bot):

1. No Claude Code, peça pra editar o arquivo certo (`_shared/prompts.ts` é o mais comum).
2. Claude Code edita e roda os checks.
3. Você commita e dá push:
   ```bash
   git add .
   git commit -m "chore: ajusta texto da M2 cível"
   git push
   ```
4. Deploy só da função afetada:
   ```bash
   supabase functions deploy whatsapp-inbound
   ```
5. Teste com um lead manual.

---

## Teste end-to-end

```sql
insert into public.leads (nome, telefone, tipo_de_processo, origem)
values ('Teste Mariana', '5511XXXXXXXXX', 'Trabalhista', 'teste_manual');
```

Em até 30 segundos a M0 cai no WhatsApp. Responda M1, M2, M3 no celular e o bot decide SQL ou MQL frio.

---

## Logs ao vivo

```bash
supabase functions logs on-new-lead --tail
supabase functions logs whatsapp-inbound --tail
```

---

## Custos esperados

| Serviço | Faixa | Observação |
|---|---|---|
| Supabase | Free → R$ 130/mês | Free atende MVP; Pro recomendado em produção |
| Z-API | R$ 100-150/mês | Por número conectado |
| Claude Haiku | ~R$ 0,01-0,05 por lead | Modelo barato e ótimo pra classificação |
| Lovable | Free → R$ 100/mês | Conforme uso |
| GitHub | Free | Repo privado é grátis |
| Claude Code | Plano da Anthropic | Conforme uso |

Pra 200 leads/mês: estimativa total **R$ 250-450/mês**.

---

## Checklist de validação pós-deploy

- [ ] Repo no GitHub criado e push feito
- [ ] Claude Code abrindo o repo sem erro
- [ ] Migration aplicada sem erro
- [ ] 6 Edge Functions deployadas
- [ ] Secrets configurados (Supabase + Z-API + Claude + Meta)
- [ ] Database Webhook ativo na tabela `leads`
- [ ] Webhook do Meta Lead Ads verificado e subscrito a `leadgen`
- [ ] Webhook da Z-API apontando pra `whatsapp-inbound`
- [ ] `pg_cron` agendado
- [ ] Pelo menos 1 advogado cadastrado por área atendida
- [ ] Tela de conversa adicionada no Lovable
- [ ] Realtime habilitado na tabela `mensagens`
- [ ] Teste end-to-end passou

---

## Suporte

12 meses inclusos conforme contrato (correção de bugs, ajustes menores, reativação de integrações). Novas funcionalidades são tratadas como evoluções.

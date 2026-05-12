# Prompt pro Claude Code — Subir o bot do SDR B&Z (sem Meta ainda)

Cole o conteúdo abaixo no **Claude Code** depois de abrir o repo. Ele vai fazer o que dá automaticamente, te pedir as informações que faltam (project ref, chaves) e te dar os cliques de UI que ele não consegue executar (Database Webhook do Supabase, webhook da Z-API).

---

## Antes de começar — você precisa ter em mãos

- `SUPABASE_PROJECT_REF` (encontra em **Project Settings → General** no Supabase, é um código tipo `abcdefghijklmnopqrst`)
- `SUPABASE_SERVICE_ROLE_KEY` (em **Project Settings → API → service_role**, mantenha em segredo)
- `ZAPI_INSTANCE_ID`, `ZAPI_TOKEN` e `ZAPI_CLIENT_TOKEN` (da Z-API; o token de instância **gere um novo** porque o anterior foi compartilhado em chat)
- `ANTHROPIC_API_KEY` (em [console.anthropic.com](https://console.anthropic.com))

Não precisa do Meta ainda. Conectamos depois.

---

## O prompt (cole isto no Claude Code)

```
Você vai me ajudar a subir o bot SDR do projeto B&Z Advocacia.

Leia o CLAUDE.md na raiz do repo antes de tudo. Ele tem stack, convenções e comandos.

Cenário: a integração Meta Lead Ads ainda NÃO vai acontecer nesta etapa. Os leads
vão chegar de duas formas que precisam funcionar igualmente:

1. Inserção manual via SQL editor do Supabase (pra teste).
2. Automação externa já existente que insere na tabela `leads` (não mexer nela).

Em qualquer um dos dois casos, o INSERT na tabela `leads` deve disparar o
Database Webhook que chama a Edge Function `on-new-lead`, que manda a M0 pela
Z-API. A partir daí, o ciclo M0 → M1 → M2 → M3 → SQL/MQL roda normal.

NÃO deploye a função `meta-lead-webhook` nesta etapa. Ela fica pra depois.

EXECUTE OS PASSOS NA SEGUINTE ORDEM, parando pra me perguntar o que precisar:

PASSO 1 — Validação local
- Liste os arquivos em supabase/functions/.
- Confira que as 5 funções do bot estão presentes:
  on-new-lead, whatsapp-inbound, assumir-conversa, enviar-msg-humano, cron-followup.
- Confira que os arquivos _shared/claude.ts, _shared/db.ts, _shared/prompts.ts, _shared/zapi.ts existem.
- Aponte qualquer arquivo faltando antes de prosseguir.

PASSO 2 — Configurar o .env
- Verifique se existe .env na raiz. Se não, copie .env.example pra .env.
- Me peça os valores: SUPABASE_PROJECT_REF, ZAPI_INSTANCE_ID, ZAPI_TOKEN,
  ZAPI_CLIENT_TOKEN, ANTHROPIC_API_KEY, NOME_ESCRITORIO (use "B&Z Advocacia"
  se eu não disser outra coisa), URL_PAINEL (me peça a URL do painel Lovable).
- Preencha o .env com esses valores.
- IMPORTANTE: não commite o .env (já está no .gitignore).

PASSO 3 — Vincular o projeto Supabase
- Rode: supabase login (se necessário) e supabase link --project-ref <REF>.
- Se der erro de credencial, me oriente a fazer login pelo navegador.

PASSO 4 — Subir os secrets pro Supabase
- Rode: supabase secrets set --env-file ./.env
- Confirme que apareceu mensagem de sucesso.

PASSO 5 — Deploy das 5 funções (sem meta-lead-webhook)
- Rode na sequência:
  supabase functions deploy on-new-lead
  supabase functions deploy whatsapp-inbound --no-verify-jwt
  supabase functions deploy assumir-conversa
  supabase functions deploy enviar-msg-humano
  supabase functions deploy cron-followup --no-verify-jwt
- Para cada uma, confirme sucesso antes de seguir.

PASSO 6 — Aplicar a migration
- Mostre o conteúdo de 01_migration.sql.
- Me oriente a copiar e rodar no SQL Editor do Supabase (Claude Code não tem
  acesso direto ao SQL editor — eu rodo manualmente). Espere eu confirmar
  "rodei" antes de seguir.

PASSO 7 — Cadastrar pelo menos um advogado de teste
- Mostre este SQL pra eu rodar no SQL Editor (substituindo telefone pelo meu
  WhatsApp real pra eu receber a notificação interna nos testes):

    insert into public.advogados (nome, email, telefone, areas) values
      ('Teste Trabalhista','trab@bnz.com.br','5511XXXXXXXXX','{trabalhista}'),
      ('Teste Cível','civel@bnz.com.br','5511XXXXXXXXX','{civel,familia,sucessoes}'),
      ('Teste Empresarial','emp@bnz.com.br','5511XXXXXXXXX','{empresarial,tributario,consultivo}');

- Espere eu confirmar "rodei".

PASSO 8 — Cliques de UI que eu preciso fazer (você lista, eu executo)
Você me dá um checklist exato, no formato "vá em X, clique em Y, preencha Z":

  a) Database Webhook no Supabase (Database > Webhooks > Create new hook)
     - Name: on_new_lead
     - Table: leads
     - Events: INSERT
     - Type: HTTP Request, POST
     - URL: https://<PROJECT_REF>.functions.supabase.co/on-new-lead
     - Headers: Content-Type: application/json,
                Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>

  b) Webhook da Z-API (UI da Z-API > Webhooks > Webhook ao receber)
     - URL: https://<PROJECT_REF>.functions.supabase.co/whatsapp-inbound

  c) Realtime na tabela mensagens (Database > Replication > marcar mensagens)

  d) pg_cron pro follow-up (SQL Editor):
     select cron.schedule(
       'sdr_followup_cron',
       '0 */6 * * *',
       $$ select net.http_post(
            url := 'https://<PROJECT_REF>.functions.supabase.co/cron-followup',
            headers := jsonb_build_object(
              'Content-Type','application/json',
              'Authorization','Bearer <SERVICE_ROLE_KEY>'
            )) $$
     );

Substitua <PROJECT_REF> e <SERVICE_ROLE_KEY> pelos valores reais ao me passar
as instruções. Espere eu confirmar "feito" entre cada item.

PASSO 9 — Teste end-to-end
Quando tudo estiver configurado:

  a) Me mostre este SQL pra eu rodar no SQL Editor, substituindo pelo meu
     número real:

       insert into public.leads (nome, telefone, tipo_de_processo, origem)
       values ('Teste Mariana', '5511XXXXXXXXX', 'Trabalhista', 'teste_manual');

  b) Em até 30 segundos a M0 deve cair no meu WhatsApp.
  c) Eu respondo "Trabalhista" → bot manda a M1.
  d) Eu respondo M1, M2 e M3 → bot decide SQL ou MQL.
  e) Se SQL, o advogado da área cadastrado no PASSO 7 deve receber a notificação
     interna no WhatsApp.

Durante o teste, abra os logs em paralelo num terminal pra debugar se algo falhar:
  supabase functions logs on-new-lead --tail
  supabase functions logs whatsapp-inbound --tail

PASSO 10 — Commit do .env.example (não do .env)
Quando tudo passar, faça:
  git add -A
  git status
  Confirme que .env NÃO está sendo commitado.
  git commit -m "chore: setup inicial do bot SDR (sem Meta ainda)"
  git push

REGRAS IMPORTANTES:
- Não invente valores. Sempre me pergunte se algo estiver faltando.
- Não commite .env. Confira o .gitignore antes de qualquer git add.
- Não deploye a meta-lead-webhook nesta etapa.
- Se algum supabase functions deploy falhar, leia o stderr e me mostre o erro
  literal. Não tente "consertar" sem me consultar.
- Mensagens pro lead seguem as convenções do CLAUDE.md (bullets •, só 🤓 e ✱).

Começa pelo PASSO 1.
```

---

## Depois desse setup

O bot já tá rodando com leads que entram via SQL manual ou via a sua automação externa.

Quando você quiser ligar o Meta Lead Ads:

1. Siga o `GUIA_META_LEAD_ADS.md`.
2. Cole no Claude Code: *"Agora vamos ligar o Meta. Adicione os secrets META_VERIFY_TOKEN, META_PAGE_ACCESS_TOKEN e META_APP_SECRET no .env e deploye a função meta-lead-webhook com --no-verify-jwt."*

Vai funcionar sem precisar mexer em mais nada — o webhook do Meta vai inserir na tabela `leads` igualzinho à inserção manual faz hoje.

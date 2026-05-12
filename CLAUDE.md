# CLAUDE.md — Contexto do projeto SDR Advocacia

> Este arquivo é lido automaticamente pelo Claude Code ao abrir o projeto.
> Mantém Claude alinhado com decisões, padrões e comandos sem precisar repetir contexto a cada sessão.

---

## O que é este projeto

Automação SDR para o escritório **B&Z Advocacia** (cliente IAplicada). Captura leads vindos de Lead Ads do Meta numa LP do WordPress, faz o primeiro atendimento via WhatsApp em até 2 minutos, qualifica em no máximo 3 perguntas e entrega lead quente pro advogado certo da área.

**Stack oficial (não trocar sem alinhar com Mariana):**
- **Claude Code** — desenvolvimento e deploy (este projeto)
- **Lovable** — frontend do painel CRM (não está neste repo)
- **Supabase** — Postgres + Auth + Edge Functions (Deno/TS)
- **Z-API** — gateway WhatsApp
- **Claude Haiku** — classificador de respostas dos leads
- **GitHub** — versionamento (vincular o repo pra Claude Code trabalhar nele)

**Sem n8n, sem Zapier, sem Make. Tudo via Edge Functions.**

---

## Estrutura

```
.
├── 01_migration.sql                ← SQL único, rodar no SQL Editor do Supabase
├── prompt-tela-conversa-lovable.md ← cole no Lovable pra adicionar a tela de conversa
├── .env.example                    ← copiar pra .env e preencher
├── .gitignore
├── README.md                       ← passo a passo de deploy
└── supabase/functions/
    ├── _shared/                    ← código compartilhado entre as funções
    │   ├── claude.ts               ← cliente Anthropic
    │   ├── db.ts                   ← cliente Supabase + helpers (buscarLead, registrarMensagem…)
    │   ├── prompts.ts              ← system prompt do classificador + templates de M0/SQL/MQL
    │   └── zapi.ts                 ← cliente Z-API (envio de texto, normalização de telefone)
    ├── meta-lead-webhook/index.ts  ← webhook do Meta Lead Ads → puxa dados via Graph → insere em leads
    ├── on-new-lead/index.ts        ← Database Webhook do Supabase → envia M0
    ├── whatsapp-inbound/index.ts   ← webhook da Z-API → classifica via Claude → manda M1/M2/M3/encerra
    ├── assumir-conversa/index.ts   ← painel chama quando advogado assume
    ├── enviar-msg-humano/index.ts  ← painel chama quando advogado digita mensagem
    └── cron-followup/index.ts      ← pg_cron a cada 6h → reengajamento
```

---

## Comandos úteis

```bash
# Vincular projeto (uma vez)
supabase login
supabase link --project-ref <PROJECT_REF>

# Configurar secrets (a partir do .env)
supabase secrets set --env-file ./.env

# Deploy de uma função
supabase functions deploy on-new-lead

# Deploy de função pública (sem JWT — usado por Z-API e pg_cron)
supabase functions deploy whatsapp-inbound --no-verify-jwt
supabase functions deploy cron-followup --no-verify-jwt

# Logs em tempo real de uma função
supabase functions logs whatsapp-inbound --tail

# Rodar localmente (precisa ter Deno e Docker)
supabase functions serve whatsapp-inbound --env-file ./.env
```

---

## Convenções do projeto

**Mensagens pro lead (WhatsApp):**
- Texto puro, sem markdown.
- Bullets com `•` (nunca `-` ou `*`).
- Parágrafos separados por linha em branco.
- Emojis permitidos: apenas `🤓` e `✱`.
- Acentuação e pontuação sempre corretas (português brasileiro).
- Tom direto e próximo, nunca robótico.

**Mensagens pro advogado (interno):**
- Sem restrição de emoji.
- Formato `Novo SQL na sua fila` + bullets `•` + link do painel.

**Nomes:**
- Banco: `snake_case` (`status_sdr`, `area_normalizada`).
- TypeScript: `camelCase` (`buscarLeadPorTelefone`).
- Arquivos de função: `kebab-case` (`whatsapp-inbound`).

**Status do lead (campo `status_sdr`):**
- `novo` — acabou de entrar
- `em_atendimento_bot` — bot conduzindo
- `mql_frio` — não qualificou
- `sql_aguardando_humano` — pronto pro advogado
- `assumido_humano` — advogado já entrou
- `agendado` — call marcada
- `perdido` — não respondeu / fora de escopo
- `cliente` — fechou

**Etapas de qualificação (`etapa_qualificacao`):**
- `M0` → ainda precisa identificar área (só quando form não trouxe `tipo_de_processo`)
- `M1`, `M2`, `M3` → próxima pergunta a fazer
- `finalizado` → fluxo concluído

---

## Regras importantes (não quebrar)

1. **Migration é aditiva.** Toda alteração de schema deve usar `IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`. Nunca dropar coluna existente do escritório sem confirmar com Mariana.
2. **Lead só pode receber no máximo 3 perguntas de qualificação (M1, M2, M3).** A M0 é só abertura/identificação de área e não conta.
3. **Tela de conversa NÃO insere mensagem diretamente na tabela `mensagens`.** Ela chama a Edge Function `enviar-msg-humano`, que faz o envio pela Z-API e registra. Inserção direta quebra a auditoria.
4. **Sempre marcar `bot_pausado = true` quando humano assumir.** Caso contrário, bot e advogado vão responder em paralelo.
5. **Idempotência da M0.** `on-new-lead` não pode enviar a M0 duas vezes pro mesmo lead. Já há checagem por `count` em `mensagens` antes de enviar.
6. **Não usar prompts hardcoded de fallback no whatsapp-inbound** sem dar a chance do Claude gerar a mensagem dinâmica. O fallback é só quando o `mensagem_para_enviar` vier vazio.
7. **Variáveis de ambiente** ficam no Supabase secrets, nunca em código. `.env` está no `.gitignore`.

---

## Como testar manualmente

```sql
-- 1) Cadastra um advogado de teste
insert into public.advogados (nome, email, telefone, areas)
values ('Teste', 'teste@escritorio.com', '5511999999999', '{trabalhista}');

-- 2) Insere um lead — isso dispara o Database Webhook → M0 sai automaticamente
insert into public.leads (nome, telefone, tipo_de_processo, origem)
values ('Lead Teste', '5511XXXXXXXXX', 'Trabalhista', 'manual_test');
```

Depois acompanhe pelos logs:

```bash
supabase functions logs on-new-lead --tail
supabase functions logs whatsapp-inbound --tail
```

---

## O que NÃO está aqui

- **O front (kanban + tela de conversa)** vive no Lovable, não neste repo.
- **A captura do lead do Meta → Supabase** é feita por uma automação no-code já configurada pela Mariana (fora deste repo).
- **Templates de e-mail** ainda não foram implementados; notificação atual é só por WhatsApp interno do advogado.

---

## Decisões pendentes (perguntar antes de implementar)

- Limiares numéricos exatos de SQL (valor de causa, porte da empresa, faturamento).
- Lista completa de áreas atendidas (afeta classificação `fora_escopo`).
- Texto de consentimento LGPD definitivo (a versão atual em `prompts.ts` é um modelo).
- Horário de atendimento do bot (24/7 ou comercial).

Entrega nesta sessão: Itens 1, 2, 3 (críticos) e Item 4 se não arriscar os anteriores. Deploy e smoke test após cada item.

## Item 1 — Mensagem duplicada no envio

**Frontend (`src/components/leads/ConversaBot.tsx`)**
- Guarda dura no início de `handleEnviar`: `if (enviando || !mensagem.trim()) return`.
- `onKey` (Ctrl+Enter): `e.preventDefault()` + `e.stopPropagation()` antes de chamar `handleEnviar`.
- Remover `queryClient.invalidateQueries(["mensagens-sdr", ...])` do `onSuccess` — deixar só o realtime propagar a inserção real (evita 2 origens de UI).
- Manter botão `disabled={enviando}` (já existe).

**Backend (`supabase/functions/enviar-msg-humano/index.ts`)**
- Idempotência: calcular `dedupeHash = sha256(advogado_id + lead_id + mensagem + floor(Date.now()/2000))`.
- Antes de enviar Z-API: `select id from mensagens_sdr where lead_id=? and metadata->>dedupe_hash=? and enviada_em > now()-interval '10 seconds'`.
- Se existe → retornar `{ ok: true, deduped: true }` sem reenviar.
- Caso contrário, enviar e gravar `metadata.dedupe_hash`.

**Smoke test**: enviar 1 mensagem; confirmar 1 row em `mensagens_sdr` e 1 chegada no celular. Clicar 2x rápido → ainda 1 row.

## Item 2 — Card do kanban não abre detalhe

**`LeadCard.tsx`** + `LeadsKanban.tsx`:
- Verificar handler `onClick` do `<Card>` propagando para `setSelectedLeadId`.
- Garantir `e.stopPropagation()` apenas nos botões internos (Primeiro Contato, AtenderAgora) — o Card mantém click livre.
- Provável regressão: o `<Button>` ghost sem `stopPropagation` no novo wrapper. Adicionar `e.stopPropagation()` em `handlePrimeiroContato` (já existe) e checar `LeadBotBadge` / `AtenderAgoraButton`.

**`LeadsTable.tsx`**: garantir `<TableRow onClick>` abre detalhe; botões/checkboxes com `stopPropagation`.

**Smoke test**: clicar em 3 cards distintos → todos abrem o `LeadDetailsDialog`.

## Item 3 — Identificar atendente pelo user logado

**Migration**
- `ALTER TABLE advogados_sdr ADD COLUMN user_id uuid UNIQUE REFERENCES auth.users(id);`
- Backfill: `UPDATE advogados_sdr a SET user_id = u.id FROM auth.users u WHERE a.email = u.email AND a.user_id IS NULL;`
- Policies INSERT/UPDATE para usuários autenticados se cadastrarem (auto-onboard).

**`src/lib/advogadoSdr.ts`**
- Prioridade: match por `user_id == auth.uid()` → `email` → fallback `geral` → qualquer ativo.
- Se nada bate, **auto-criar** registro com `user_id`, `email`, `nome` (do `profiles`), `areas={geral}`, `ativo=true` e retornar o novo id.

**`LeadDetailsDialog.tsx`**
- Bloco "Atendido por": avatar (inicial do nome) + nome do `humano_responsavel`, lendo de `advogados_sdr` via join (`user_id` → `profiles.nome_completo` ou `advogados_sdr.nome`).

**Smoke test**: assumir um lead novo → `humano_responsavel = auth.uid()` e bloco "Atendido por: <meu nome>" aparece.

## Item 4 — Painel /dashboard/atendimento (estilo WhatsApp Web)

Só executo se itens 1+2+3 estiverem estáveis.

**Migration**: `ALTER TABLE leads_geral ADD COLUMN ultima_leitura_humano timestamptz;`

**Rota e menu**
- `App.tsx`: rota `/dashboard/atendimento` → `pages/Atendimento.tsx`.
- `AppSidebar.tsx`: novo item "Atendimento" entre Leads e Marketing (ícone `MessagesSquare`).

**`pages/Atendimento.tsx`** — layout `grid-cols-[320px_1fr]`:

**Coluna esquerda — `ConversasList.tsx`**
- Query `leads_geral` onde `humano_responsavel = advogadoUserId` (admin vê todos), order by `ultima_mensagem_em desc`.
- Item: avatar (inicial), nome, prévia da última msg (subquery em `mensagens_sdr`), hora relativa, badge de não-lidas.
- Search por nome + filtros pills: `todos | aguardando minha resposta | meus leads | do bot`.
- Realtime `mensagens_sdr` invalida a lista.

**Coluna direita — `ChatAtivo.tsx`**
- Header: nome + badge área + botão "Ver ficha" → abre o `LeadDetailsDialog` existente (preservado, coexistem).
- Reaproveita `ConversaBot` em modo full-height.
- Estado vazio quando nenhum lead selecionado.

**Não-lidas (fase 1)**: ao selecionar lead, `update leads_geral set ultima_leitura_humano = now()`. Badge = count de `mensagens_sdr` onde `origem='lead' and enviada_em > ultima_leitura_humano`.

**Templates rápidos**: fase 2 (placeholder).

**Smoke test**: abrir `/dashboard/atendimento` → ver lista → clicar conversa → enviar mensagem → chega no celular. Confirmar `LeadDetailsDialog` ainda funciona no Kanban.

## Deploy
- Edge function `enviar-msg-humano` redeploy após Item 1.
- Migrations dos itens 3 e 4 aplicadas via tool de migração.
- Confirmação de cada item com print/log antes de avançar.
## Item 4 — Painel de Atendimento estilo WhatsApp Web

Submenu "Atendimento" abaixo de Leads em Gestão de Vendas, na rota `/dashboard/atendimento`. Toda infra de schema (`humano_responsavel`, `ultima_leitura_humano`) já está pronta.

## Layout

```text
+------------------------------------------------------+
| Conversas (320px)        |  Chat ativo               |
|--------------------------|---------------------------|
| [busca]                  |  [header: nome + tel]     |
| Filtro: Todas/Minhas     |---------------------------|
|--------------------------|                           |
| ▢ Alceu      ●3   2min   |   (timeline ConversaBot)  |
| ▢ Maria          15min   |                           |
| ▢ João       ●1    1h    |                           |
| ...                      |                           |
|                          |---------------------------|
|                          |  [textarea + Enviar]      |
+------------------------------------------------------+
```

Estado vazio (nenhuma conversa selecionada): mensagem central "Selecione uma conversa para começar".

## Arquivos a criar

- `src/pages/Atendimento.tsx` — página com `grid-cols-[320px_1fr]`, full-height (`h-[calc(100vh-...)]`).
- `src/components/atendimento/ConversasList.tsx` — lista de leads com `humano_responsavel` definido. Mostra nome, prévia da última mensagem, timestamp relativo, badge de não-lidas (count de `mensagens_sdr` onde `enviada_em > ultima_leitura_humano` AND `origem='lead'`). Busca por nome/telefone. Filtro: "Todas" / "Minhas" (default = Minhas).
- `src/components/atendimento/ChatPanel.tsx` — wrapper com header (avatar + nome + telefone + botão "Ver detalhes" que abre `LeadDetailsDialog`) + `ConversaBot` reaproveitado com `className="h-full"`.

## Arquivos a alterar

- `src/components/AppSidebar.tsx` — adicionar `{ title: "Atendimento", url: "/dashboard/atendimento" }` no submenu de Gestão de Vendas, logo abaixo de Leads.
- `src/App.tsx` — registrar `<Route path="/dashboard/atendimento">` dentro do `ProtectedRoute`.
- `src/components/leads/ConversaBot.tsx` — aceitar prop `fullHeight?: boolean` para usar `h-full` em vez de `h-[500px]` quando dentro do painel.

## Lógica de não-lidas

Ao selecionar uma conversa: `update leads_geral set ultima_leitura_humano = now() where id = ?`. Realtime no canal `mensagens_sdr` filtrado por `humano_responsavel = meu_advogado_id` invalida a lista para atualizar badges em tempo real.

## Coexistência com LeadDetailsDialog

O `LeadDetailsDialog` continua intocado e disponível. O painel `/atendimento` usa o `ConversaBot` diretamente (não abre o Dialog para conversar), mas o botão "Ver detalhes" no header do chat abre o mesmo dialog para acessar tabs de tarefas/documentos/processos. Pipeline (Kanban/Tabela) continua usando o Dialog como antes.

## Smoke tests

1. Entrar em `/dashboard/atendimento` → ver lista de conversas onde `humano_responsavel = meu user`.
2. Clicar em conversa → chat abre à direita, badge de não-lidas zera.
3. Enviar mensagem → chega no celular do lead, aparece na lista realtime.
4. Filtro "Todas" mostra conversas de outros atendentes (read-only se não for minha).
5. Clicar "Ver detalhes" → abre `LeadDetailsDialog` por cima.
6. Voltar pra `/dashboard/leads` → Kanban e tabela seguem funcionando, abrir card abre o Dialog normalmente.

Sem mudança de schema, sem mudança em RLS, sem mudança em Edge Function. Só frontend.

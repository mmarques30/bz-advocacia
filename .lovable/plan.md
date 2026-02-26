

# Corrigir leads manuais desaparecidos e reorganizar abas

## Diagnostico

Os 20 leads que a Juliana cadastrou hoje estao salvos no banco (tabela `contact_submissions`) -- confirmei 24 registros de 25/02/2026. O problema e que a pagina `/dashboard/leads` atualmente **so mostra dados do CSV do Google Sheets** (`useLeadsCsv`). Ela nao consulta `contact_submissions` em nenhum momento. Os leads manuais estao la, mas a interface ignora eles.

## Solucao

Reorganizar a pagina de Leads com **duas abas**:

### Aba 1: "Leads" (leads manuais - `contact_submissions`)
- Reutiliza os componentes ja existentes: `LeadsTable`, `LeadsHeader`, `LeadsKanban`, `NewLeadDialog`, `LeadsFilters`
- Consome o hook `useLeads` que le da tabela `contact_submissions`
- Inclui botao "Novo Lead", importacao, filtros por origem, estagio, prioridade
- Mostra os 20+ leads da Juliana imediatamente

### Aba 2: "Leads Anuncios" (leads do Google Sheets/CSV)
- Conteudo atual da pagina: `LeadsCsvTable`, `LeadsCsvSummary`, KanbanView com DnD
- Consome `useLeadsCsv` como ja faz hoje
- Mantem drag-and-drop com `leads_status_overrides`

## Arquivos alterados

### `src/pages/Leads.tsx`
- Adicionar `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent` do Radix
- **Tab "Leads"**: Renderizar `LeadsHeader` + `LeadsTable` / `LeadsKanban` + `NewLeadDialog` + `LeadDetailsDialog` (componentes que ja existem e consomem `contact_submissions`)
- **Tab "Leads Anuncios"**: Mover o conteudo atual (CSV table + kanban DnD) para dentro desta aba
- Importar `useLeads`, `LeadsTable`, `LeadsHeader`, `NewLeadDialog`, `LeadDetailsDialog`, `LeadsFilters`

### `src/components/AppSidebar.tsx`
- Nenhuma alteracao necessaria - a rota `/dashboard/leads` ja existe no menu

### Nenhuma alteracao no banco
- Os dados ja estao la. Nao precisa de migration.

## Fluxo apos a implementacao

```text
/dashboard/leads
├── Tab "Leads" (default)
│   ├── Header com botao Novo Lead + filtros de origem
│   ├── Tabela com 24 leads de contact_submissions
│   └── Toggle Kanban (estagios: novo, contato_inicial, em_analise, proposta_enviada, fechado, perdido)
│
└── Tab "Leads Anuncios"
    ├── Summary cards (CSV)
    ├── Tabela CSV com leads do Sheets
    └── Toggle Kanban com drag-and-drop
```


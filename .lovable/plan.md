

# Adicionar etapa "Perdido" no Kanban Anúncios + Unificar visual dos Kanbans

## Alterações

### 1. Kanban Leads Anúncios (`src/pages/Leads.tsx` - KanbanView)
- Adicionar coluna **PERDIDO** (border-t-red-500) após CONVERTIDO
- Atualizar `statusMap` e grid para 5 colunas (`lg:grid-cols-5`)
- Permitir drag-and-drop para/de "Perdido"

### 2. Kanban Leads Orgânicos (`src/components/leads/LeadsKanban.tsx`)
- Substituir o visual atual (simples com Badge) pelo mesmo layout do Kanban de Anúncios: cards com `border-t-4` colorido, header com contagem, fundo `bg-muted/30`
- Separar "Fechado" e "Perdido" em colunas distintas (6 colunas: Novo, Contato Inicial, Em Análise, Proposta, Fechado, Perdido)
- Remover merge de "perdido" → "fechado" no agrupamento
- Atualizar grid para `lg:grid-cols-6`

### Cores das colunas (Orgânicos)
| Coluna | Cor |
|--------|-----|
| Novo | blue-500 |
| Contato Inicial | cyan-500 |
| Em Análise | purple-500 |
| Proposta Enviada | yellow-500 |
| Fechado | emerald-500 |
| Perdido | red-500 |

### Arquivos alterados
- `src/pages/Leads.tsx` — KanbanView: +1 coluna PERDIDO, grid 5 cols
- `src/components/leads/LeadsKanban.tsx` — Novo visual com border-t colorido, 6 colunas separadas, sem merge perdido/fechado


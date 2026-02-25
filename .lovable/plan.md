

# Implementar Drag-and-Drop no Kanban com Persistencia no Banco

## Situacao Atual

Os leads vem do Google Sheets (CSV) e a tabela `leads_geral` esta vazia. Nao e possivel fazer `UPDATE` diretamente porque os leads nao existem no banco.

## Solucao

Criar uma tabela auxiliar `leads_status_overrides` que armazena apenas o status atualizado quando o usuario arrasta um card no Kanban. O sistema prioriza o status do override sobre o status do CSV.

### 1. Nova tabela no banco

```sql
CREATE TABLE leads_status_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_csv_id text UNIQUE NOT NULL,
  lead_status text NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);
ALTER TABLE leads_status_overrides ENABLE ROW LEVEL SECURITY;
-- Policies para usuarios autenticados
```

### 2. Alteracoes em `src/pages/Leads.tsx`

- Importar `@dnd-kit/core` (DndContext, DragEndEvent, DragOverlay, useDroppable, useDraggable)
- Adicionar drag-and-drop ao KanbanView:
  - Cada coluna vira um `DroppableColumn` (usando `useDroppable`)
  - Cada card vira um `DraggableCard` (usando `useDraggable`)
  - `DragOverlay` para feedback visual durante o arrasto
- No `handleDragEnd`: chamar mutation para salvar o novo status na tabela `leads_status_overrides`

### 3. Novo hook ou extensao de `useLeadsGeral`

- Criar mutation `upsertStatusOverride` que faz upsert na tabela `leads_status_overrides`
- Criar query para buscar todos os overrides
- No componente, ao montar os leads, fazer merge: se existe override para aquele `lead_csv_id`, usar o status do override

### 4. Fluxo completo

```text
Usuario arrasta card "Lead X" de "Novos" para "Enviados"
  → handleDragEnd detecta coluna destino = "ENVIADO"
  → upsert em leads_status_overrides: { lead_csv_id: "X", lead_status: "Enviado" }
  → Atualiza estado local (optimistic update)
  → Na proxima renderizacao, o lead aparece na coluna correta
```

### 5. Detalhes tecnicos

- As dependencias `@dnd-kit/core` e `@dnd-kit/utilities` ja estao instaladas
- Nao sera necessario `@dnd-kit/sortable` (nao ha reordenacao dentro da coluna, apenas mover entre colunas)
- O overlay mostra um "fantasma" do card durante o arrasto
- Feedback visual: coluna destino fica destacada quando o card esta sobre ela

### Arquivos alterados
- **Nova migration**: criar tabela `leads_status_overrides` com RLS
- **`src/pages/Leads.tsx`**: reescrever KanbanView com DnD + merge de overrides
- **Novo hook `src/hooks/useLeadStatusOverrides.ts`**: query + mutation para a tabela de overrides


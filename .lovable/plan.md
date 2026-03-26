

## Adicionar "Status de Tarefas" às Listas do Sistema

### Alterações

**1. `src/hooks/useOpcoesSistema.ts`**
- Adicionar `'status_tarefa'` ao type `GrupoOpcao`

**2. `src/pages/configuracoes/ListasSuspensas.tsx`**
- Adicionar `{ key: 'status_tarefa', label: 'Status de Tarefas' }` ao array `GRUPOS`
- Ajustar `grid-cols-4` → `grid-cols-5` no TabsList

**3. RLS da tabela `opcoes_sistema`**
- Adicionar políticas para moderators (INSERT, UPDATE, DELETE) usando `has_role(auth.uid(), 'moderator')` — atualmente apenas admins podem modificar

**4. Seed dos status padrão**
- Inserir os 4 status atuais (`pendente`, `em_andamento`, `concluido`, `cancelado`) na tabela `opcoes_sistema` com `grupo = 'status_tarefa'` via migration

**5. `src/components/demandas/DemandasFilters.tsx`**
- Buscar status de `useOpcoesSistema('status_tarefa', true)` com fallback para os 4 fixos
- Renderizar dinamicamente os `SelectItem` de status

**6. `src/components/demandas/DemandaDetailsDialog.tsx`**
- Mesmo padrão: buscar status dinâmicos e renderizar no select de edição de status

**7. `src/components/demandas/DemandasKanban.tsx`**
- Se usa colunas fixas de status, tornar dinâmico com os mesmos dados

### Arquivos editados
- Migration: RLS para moderators + seed dos status padrão
- `src/hooks/useOpcoesSistema.ts`
- `src/pages/configuracoes/ListasSuspensas.tsx`
- `src/components/demandas/DemandasFilters.tsx`
- `src/components/demandas/DemandaDetailsDialog.tsx`
- `src/components/demandas/DemandasKanban.tsx` (se aplicável)


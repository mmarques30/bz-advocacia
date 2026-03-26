

## Visibilidade de clientes sem processos vinculados

### 1. `src/hooks/useDashboardPrincipal.ts`
- Adicionar query para contar clientes sem processo: clientes com `estagio = 'fechado'` cujo `id` não aparece em `processos.lead_id`
- Adicionar campo `clientesSemProcesso: number` ao `DashboardPrincipalData`
- Implementação: buscar todos os IDs de clientes ativos, buscar todos os `lead_id` distintos de processos, calcular a diferença

### 2. `src/pages/Dashboard.tsx`
- No KPI "Clientes ativos", alterar o `context` para incluir contagem de clientes sem processo
- Tornar o subtexto clicável com `useNavigate` para `/dashboard/clientes?semProcesso=true`

### 3. `src/components/dashboard/DashboardKPIStrip.tsx`
- Alterar o campo `context` para aceitar `ReactNode` (em vez de apenas string) ou adicionar campo `contextLink?: string`
- Quando `contextLink` presente, renderizar o contexto como link clicável

### 4. `src/components/clientes/ClientesFilters.tsx`
- Adicionar `semProcesso: boolean` ao `ClientesFiltersType`
- Adicionar checkbox "Sem processo vinculado" na seção "Dados Cadastrais"
- Incluir no `handleClearFilters`

### 5. `src/pages/Clientes.tsx`
- Adicionar `semProcesso: false` ao estado inicial
- Ler query param `?semProcesso=true` da URL para inicializar o filtro
- Buscar IDs de clientes com processos via query separada (`processos` → `lead_id` distintos)
- No `filteredLeads`, quando `semProcesso === true`, filtrar leads cujo `id` não está no set de `lead_id`s
- Incluir no `activeFiltersCount`

### 6. `src/components/leads/LeadDetailsDialog.tsx`
- Para clientes (`isCliente === true`), buscar contagem de processos via query rápida `processos.select('id', { count: 'exact', head: true }).eq('lead_id', lead.id)`
- Quando count === 0, exibir alerta âmbar antes das tabs:
  - Ícone `AlertTriangle` + texto "Este cliente não possui processos ativos. Considere atualizar o status para Concluído."
  - Botão "Marcar como Concluído" que atualiza `contact_submissions.status_cliente` para `'inativo'`
  - Toast de confirmação após salvar

### Arquivos editados
- `src/hooks/useDashboardPrincipal.ts` — novo campo `clientesSemProcesso`
- `src/pages/Dashboard.tsx` — subtexto clicável no KPI
- `src/components/dashboard/DashboardKPIStrip.tsx` — suporte a link no contexto
- `src/components/clientes/ClientesFilters.tsx` — checkbox "Sem processo vinculado"
- `src/pages/Clientes.tsx` — lógica de filtro + leitura de query param
- `src/components/leads/LeadDetailsDialog.tsx` — alerta âmbar + ação rápida

Nenhuma alteração de banco necessária.


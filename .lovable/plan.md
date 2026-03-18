

## Ajuste: Adicionar filtro "Semana" ao painel de Produtividade

### Mudanças

#### 1. `src/hooks/useProdutividadeEquipe.ts`
- Adicionar `'esta_semana'` ao tipo `PeriodoFiltro`
- Na função `getDateRange`, adicionar caso para `'esta_semana'` usando `startOfWeek(now, { weekStartsOn: 1 })` (segunda-feira) até `endOfWeek(now, { weekStartsOn: 1 })` (domingo)

#### 2. `src/components/demandas/ProdutividadeDashboard.tsx`
- Adicionar `esta_semana: "Esta Semana"` ao objeto `PERIODO_LABELS`, posicionado entre as opções existentes (antes de `este_mes`)

### Arquivos alterados
- `src/hooks/useProdutividadeEquipe.ts` — tipo + lógica de range
- `src/components/demandas/ProdutividadeDashboard.tsx` — label no dropdown


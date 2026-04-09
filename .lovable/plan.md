

## Adicionar filtro de ordenação em Tarefas (mais antigo → mais recente)

### Alterações

**1. `src/types/demandas.ts`** — Adicionar campo `ordenacao` ao tipo `DemandasFilters`
- Novo campo opcional: `ordenacao?: 'recente' | 'antigo'`

**2. `src/components/demandas/DemandasFilters.tsx`** — Adicionar Select de ordenação
- Novo Select na grid (mudar para `md:grid-cols-7` ou colocar na mesma linha)
- Opções: "Mais recente" (padrão) e "Mais antigo"
- Chama `onFilterChange('ordenacao', value)`

**3. `src/hooks/useDemandas.ts`** — Respeitar filtro de ordenação na query
- Linha 20: trocar `ascending: false` fixo por `ascending: filters?.ordenacao === 'antigo'`
- Quando `ordenacao` é `'antigo'` → `ascending: true`, senão `ascending: false`

### Arquivos editados
- `src/types/demandas.ts`
- `src/components/demandas/DemandasFilters.tsx`
- `src/hooks/useDemandas.ts`


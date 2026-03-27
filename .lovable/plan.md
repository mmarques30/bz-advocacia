

## Remover props redundantes do DashboardStatusProcessosCard

### Alterações

**`src/components/dashboard/DashboardStatusProcessosCard.tsx`**
- Remover `processosSemMov` e `totalSemMov` da interface `Props`
- Remover `onProcessoClick` (não utilizado internamente)
- Manter apenas `statusProcessos` e `loading`

**`src/pages/Dashboard.tsx`**
- Remover as props `processosSemMov={[]}`, `totalSemMov={0}` e `onProcessoClick` da chamada do componente

### Arquivos editados
- `src/components/dashboard/DashboardStatusProcessosCard.tsx`
- `src/pages/Dashboard.tsx`


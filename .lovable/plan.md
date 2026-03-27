

## Adicionar gráfico "Evolução de Processos" ao Dashboard

### Resumo
Criar um card com gráfico de barras empilhadas + linha sobreposta (ComposedChart) mostrando processos abertos, concluídos e total acumulado nos últimos 6 meses. Posicionado numa nova Linha 4 abaixo da Linha 3 existente.

### Alterações

**1. Novo componente `src/components/dashboard/DashboardEvolucaoProcessosCard.tsx`**
- Card com header "Evolução de Processos" e destaque no canto direito: total abertos nos últimos 30 dias com variação % em relação aos 30 dias anteriores (verde/vermelho)
- ComposedChart (mesmo padrão do "Volume de Trabalho Mensal" em ProdutividadeDashboard):
  - Bar stackId="a": "Abertos" (processos criados no mês) — `hsl(var(--chart-1))`
  - Bar stackId="a": "Concluídos" (status concluido no mês) — `hsl(var(--chart-2))`
  - Line: "Total acumulado" (ativos no final do mês) — `hsl(var(--chart-5))`
- Eixo X: meses abreviados (jan, fev, mar...), últimos 6 meses
- Props: `data`, `loading`, `abertos30d`, `variacao`

**2. Novo hook `src/hooks/useProcessosEvolucao.ts`**
- React Query com `queryKey: ['processos-evolucao']` e `staleTime: 5 * 60 * 1000`
- Query à tabela `processos`:
  - Busca todos os processos com `created_at` e `status`
  - Agrupa por mês dos últimos 6 meses:
    - **Abertos**: count de `created_at` naquele mês
    - **Concluídos**: count de processos com `status = 'concluido'` e `data_ultima_atualizacao` naquele mês
    - **Total acumulado**: count de processos com `status != 'concluido' AND status != 'arquivado'` criados até o final daquele mês (cumulativo)
  - Calcula abertos nos últimos 30 dias e nos 30 dias anteriores para variação %

**3. `src/pages/Dashboard.tsx`**
- Importar o novo card e hook
- Adicionar Linha 4 após a Linha 3 (linha ~178):
  ```tsx
  <div className="grid gap-5 lg:grid-cols-1">
    <DashboardEvolucaoProcessosCard ... />
  </div>
  ```
  O card ocupa largura total (1 coluna) para dar espaço ao gráfico.

### Padrão visual
Reutiliza exatamente o mesmo padrão do ComposedChart em `ProdutividadeDashboard.tsx` (linhas 216-229): CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar com stackId, Line com strokeWidth=2.

### Arquivos criados/editados
- `src/components/dashboard/DashboardEvolucaoProcessosCard.tsx` (novo)
- `src/hooks/useProcessosEvolucao.ts` (novo)
- `src/pages/Dashboard.tsx` (editado — nova linha de grid)

Nenhuma alteração de banco necessária — os dados já existem na tabela `processos`.


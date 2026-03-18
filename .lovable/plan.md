

## Corrigir cores do Painel B&Z para usar paleta da marca

### Problema
O dashboard usa cores azuis genéricas (`hsl(210,...)`) que não pertencem à identidade visual B&Z. A marca usa bronze/terra cota (`--primary`), cinza (`--secondary`) e escuro (`--bz-dark`).

### Alterações

#### 1. `src/pages/Dashboard.tsx`
- KPI "Processos Ativos": trocar `bg-[hsl(210,70%,50%)]` por `bg-primary` (bronze)

#### 2. `src/components/dashboard/DashboardRightPanel.tsx`
- Bloco "Em andamento": trocar fundo `bg-[hsl(210,80%,95%)]` por `bg-primary/10` e textos `hsl(210,...)` por `text-primary`

Todos os demais elementos (vermelho, âmbar, verde, cinza) já estão corretos e alinhados com a identidade visual.


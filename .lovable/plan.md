

## Adicionar cards "Status dos Processos" e "Sem Movimentação" ao Dashboard

### Contexto
Os dados já são buscados pelo hook `useDashboardPrincipal` (`statusProcessos`, `processosSemMovimentacao`, `totalSemMovimentacao`). O componente `DashboardRightPanel` existe mas não é usado — ele agrupa 3 cards (incluindo "Carga por Advogada" que duplica a funcionalidade do `DashboardDistribuicaoCard`).

### Abordagem
Extrair os dois cards faltantes ("Status dos Processos" e "Sem Movimentação") como componentes independentes e adicioná-los ao layout do Dashboard numa terceira linha.

### Alterações

**1. `src/components/dashboard/DashboardStatusProcessosCard.tsx`** (já existe — verificar se é reutilizável ou criar novo)
- Card com grid 3 colunas: Em Andamento / Concluídos / Arquivados
- Mesmo visual do `DashboardRightPanel` (badges coloridos com contagem)

**2. `src/components/dashboard/DashboardSemMovimentacaoCard.tsx`** (novo)
- Card com alerta âmbar mostrando total de processos sem registro há 30+ dias
- Lista dos processos com número e dias sem atualização
- Botão "Ver todos" que navega para `/dashboard/processos`

**3. `src/pages/Dashboard.tsx`**
- Adicionar terceira linha com grid 2 colunas:
  - `DashboardStatusProcessosCard` com dados de `data.statusProcessos`
  - `DashboardSemMovimentacaoCard` com dados de `data.processosSemMovimentacao` e `data.totalSemMovimentacao`

### Arquivos editados
- `src/components/dashboard/DashboardStatusProcessosCard.tsx` (reutilizar ou reescrever)
- `src/components/dashboard/DashboardSemMovimentacaoCard.tsx` (novo)
- `src/pages/Dashboard.tsx`

Nenhuma alteração de banco necessária — os dados já são buscados pelo hook existente.


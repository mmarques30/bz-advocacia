

## Redesenho Completo do Módulo Financeiro

Reorganizar a interface do módulo financeiro com 6 abas, seletor global de ano, gráficos novos e aba de distribuição por sócias — conforme o mockup fornecido.

---

### Estrutura geral

O arquivo `Financeiro.tsx` será reescrito com:
- Seletor de ano global acima das tabs (2024/2025/2026/Todos), inicializando com ano corrente
- Label "Jan – Dez {ano}" ao lado do seletor
- 6 abas: Visão Geral | Faturamento | Despesas | Acordos e parcelas | Distribuição sócias | Histórico
- O ano selecionado é passado como prop para todos os componentes filhos

### Novos componentes a criar

| Componente | Descrição |
|---|---|
| `VisaoGeralTab.tsx` | Monta a aba completa com KPIs, gráficos, cards de sócias, parcelas e resultado |
| `VisaoGeralKPIs.tsx` | Strip com 5 KPIs: Receitas no ano, Despesas PJ, Resultado líquido, Inadimplência, Ticket médio — com subtextos contextuais |
| `ReceitasDespesasChart.tsx` | Barras agrupadas mensais (receitas verde, despesas vermelha, resultado azul translúcido) |
| `DespesasPorCategoriaChart.tsx` | Barras horizontais com categorias e valores absolutos, cores distintas por categoria |
| `DistribuicaoSociasCards.tsx` | Dois cards lado a lado: Eliziane e Juliana com recebido/despesas PF/líquido |
| `ParcelasProximasWidget.tsx` | Lista de parcelas com toggle Todas/Eliziane/Juliana/Escritório, status colorido e botão Editar |
| `ResultadoPeriodoCard.tsx` | Card com Receitas/Despesas/Lucro + gráfico de linha mensal + melhor mês |
| `DistribuicaoSociasTab.tsx` | Aba completa: cards por sócia com tabelas de receitas e despesas PF, resumo e equalização |
| `AcordosParcelasTab.tsx` | Wrapper que embute a funcionalidade de `FinanceiroAcordos.tsx` como aba inline |

### Hooks novos/ajustados

| Hook | Descrição |
|---|---|
| `useVisaoGeralKPIs(ano)` | Busca receitas, despesas PJ, resultado, inadimplência e ticket médio para o ano |
| `useReceitasDespesasMensal(ano)` | Retorna dados mensais agrupados para o gráfico de barras |
| `useDespesasPorCategoriaVisao(ano)` | Agrupa despesas PJ por subcategoria para barras horizontais |
| `useDistribuicaoSocia(ano, conta)` | Total recebido + despesas PF + líquido por sócia |
| `useParcelasProximas(ano, conta?)` | Parcelas pendentes/atrasadas ordenadas por vencimento |
| `useResultadoMensal(ano)` | Resultado receita-despesa por mês para gráfico de linha |

### Alterações em arquivos existentes

**`Financeiro.tsx`** — Reescrita completa da estrutura de tabs e filtros:
- Remove `TransacoesFilters` individual, `FaturamentoFilters`, `DespesasGlobalFilters` do nível global
- Adiciona estado `anoSelecionado` com Select simples
- 6 TabsTrigger + 6 TabsContent
- Aba "Acordos e parcelas" renderiza o conteúdo de `FinanceiroAcordos.tsx` inline
- Abas Faturamento e Despesas mantêm sub-abas existentes (Lançamentos/Projeção)
- Aba Histórico mantém `HistoricoTable`

**`AppSidebar.tsx`** — Remover rota separada de Acordos do sidebar (agora é aba interna)

### Aba Visão Geral — layout

```text
┌─────────────────────────────────────────────────┐
│  KPI: Receitas | Despesas PJ | Resultado |      │
│       Inadimplência | Ticket Médio              │
├──────────────────────┬──────────────────────────┤
│  Gráfico barras      │  Despesas por categoria  │
│  Receitas/Desp/Res.  │  (barras horizontais)    │
├────────┬──────┬──────┴──────────────────────────┤
│ Dist.  │Parc. │  Resultado do período           │
│ sócias │a rec.│  Receitas/Despesas + linha      │
└────────┴──────┴─────────────────────────────────┘
```

### Aba Distribuição Sócias

- Card Eliziane: tabela receitas + tabela despesas PF + resumo
- Card Juliana: mesma estrutura
- Seção "Equalização": calcula diferença entre líquidos e mostra valor a transferir

### Aba Acordos e Parcelas

- Embute `AcordosHeader`, `AcordosTable`, dialogs existentes
- Filtros adicionais de status e conta nas parcelas
- Edição inline de valor na listagem

### Conexão com clientes (Faturamento)

- Na `FaturamentoTable`, ao lado da descrição de cada receita, adicionar link clicável que busca cliente por nome em `contact_submissions` e redireciona para `/dashboard/leads?id={id}`

### Arquivos modificados/criados

| Ação | Arquivo |
|---|---|
| Reescrever | `src/pages/Financeiro.tsx` |
| Criar | `src/components/financeiro/visao-geral/VisaoGeralTab.tsx` |
| Criar | `src/components/financeiro/visao-geral/VisaoGeralKPIs.tsx` |
| Criar | `src/components/financeiro/visao-geral/ReceitasDespesasChart.tsx` |
| Criar | `src/components/financeiro/visao-geral/DespesasPorCategoriaChart.tsx` |
| Criar | `src/components/financeiro/visao-geral/DistribuicaoSociasCards.tsx` |
| Criar | `src/components/financeiro/visao-geral/ParcelasProximasWidget.tsx` |
| Criar | `src/components/financeiro/visao-geral/ResultadoPeriodoCard.tsx` |
| Criar | `src/components/financeiro/distribuicao/DistribuicaoSociasTab.tsx` |
| Criar | `src/components/financeiro/acordos/AcordosParcelasTab.tsx` |
| Criar | `src/hooks/useVisaoGeralFinanceiro.ts` (hooks consolidados) |
| Editar | `src/components/financeiro/FaturamentoTable.tsx` (link para cliente) |
| Editar | `src/components/AppSidebar.tsx` (remover Contratos/Acordos do sidebar) |

Nenhuma alteração de schema ou migration necessária — apenas reorganização de UI e novos componentes visuais.


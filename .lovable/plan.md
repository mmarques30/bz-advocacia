
# Adicionar Filtros e Tabelas nas Sub-abas de Projecao

## O que sera feito

Duplicar os filtros e tabelas que existem em "Lancamentos" para dentro da sub-aba "Projecao", tanto em Faturamento quanto em Despesas.

## Alteracoes

### 1. Faturamento > Projecao (`src/pages/Financeiro.tsx`)

Na sub-aba "projecao" de Faturamento (linhas 167-169), adicionar:
- O componente `FaturamentoFilters` (mesmo filtro da aba Lancamentos, usando o mesmo state `faturamentoFilters`)
- Manter os graficos de projecao (`FaturamentoProjecaoTab`)
- Adicionar `FaturamentoTable` ao final da pagina

### 2. Despesas > Projecao (`src/pages/Financeiro.tsx`)

Na sub-aba "projecao" de Despesas (linhas 217-219), adicionar:
- O componente `DespesasGlobalFilters` (mesmo filtro da aba Lancamentos, usando o mesmo state `despesasGlobalFilters`)
- Manter os graficos de projecao (`DespesasProjecaoTab`)
- Adicionar `DespesasTable` ao final da pagina

### 3. Ajustar componentes de projecao

- `FaturamentoProjecaoTab`: ja recebe `filters` -- nenhuma alteracao necessaria
- `DespesasProjecaoTab`: adicionar prop `filters` do tipo `DespesasGlobalFiltersState` para que os graficos de projecao tambem respeitem os filtros

## Resultado

Ambas as sub-abas de Projecao terao:
1. Filtros identicos aos de Lancamentos (compartilhando o mesmo state)
2. Graficos de projecao (conteudo atual)
3. Tabela de dados ao final (mesma tabela de Lancamentos)

O usuario podera filtrar por periodo, conta, categoria etc. e ver tanto os graficos de projecao quanto a tabela detalhada na mesma visualizacao.

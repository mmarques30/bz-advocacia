
# Plano: Relatorio Consolidado para Contador

## Problema Atual

A pagina de relatorios financeiros tem 7 relatorios separados, muitos redundantes:
- **Receitas do Periodo** - util, mas usa hook `useReceitaMensal` que ignora filtro de data
- **Inadimplencia** - util, manter
- **Fluxo de Caixa** - redundante com a visao de Projetado vs Realizado ja implementada
- **Performance por Tipo** - secundario, pouco uso pratico
- **Performance por Cliente** - secundario, pouco uso pratico  
- **Despesas do Periodo** - util, mas separado das receitas
- **Despesas por Categoria** - redundante com o detalhamento de despesas

O seletor de tipo no topo (`RelatorioSelector`) tem um dropdown que **nao inclui** "Despesas do Periodo" e "Despesas por Categoria" (so tem 5 opcoes), mas a lista de cards abaixo tem 7 opcoes. Inconsistencia.

Alem disso, o `exportToExcel` atual gera um arquivo TSV disfarçado de .xls - nao e um Excel real. O projeto ja tem a biblioteca `xlsx` instalada.

## Solucao

Substituir os 7 relatorios por **3 relatorios uteis**:

1. **Relatorio para Contador** (NOVO) - Consolidado de receitas + despesas + saldo por conta, com exportacao Excel real usando `xlsx`
2. **Inadimplencia** (MANTER) - Ja funciona bem
3. **Fluxo de Caixa** (MANTER simplificado) - Parcelas a receber nos proximos meses

Remover: Performance por Tipo, Performance por Cliente, Despesas por Categoria, Receitas do Periodo (absorvidos pelo relatorio consolidado).

## Arquivos Envolvidos

| Arquivo | Acao |
|---------|------|
| `src/types/financeiro.ts` | Simplificar `TipoRelatorio` para 3 opcoes |
| `src/pages/financeiro/Relatorios.tsx` | Reescrever pagina com 3 relatorios |
| `src/components/financeiro/relatorios/RelatorioSelector.tsx` | Simplificar seletor com filtro de conta |
| `src/components/financeiro/relatorios/RelatorioContador.tsx` | NOVO - relatorio consolidado |
| `src/lib/exportUtils.ts` | Adicionar `exportToExcelFormatado` usando biblioteca `xlsx` |
| `src/components/financeiro/relatorios/RelatorioReceitasPeriodo.tsx` | Remover |
| `src/components/financeiro/relatorios/RelatorioDespesasPeriodo.tsx` | Remover |
| `src/components/financeiro/relatorios/RelatorioDespesasCategoria.tsx` | Remover |
| `src/components/financeiro/relatorios/RelatorioPerformanceTipo.tsx` | Remover |
| `src/components/financeiro/relatorios/RelatorioPerformanceCliente.tsx` | Remover |

## Detalhes Tecnicos

### 1. Novo tipo `TipoRelatorio`

```text
export type TipoRelatorio = 
  | 'consolidado_contador'
  | 'inadimplencia_detalhada'
  | 'fluxo_caixa_projetado';
```

### 2. `RelatorioContador.tsx` - O relatorio principal

Recebe `dataInicio`, `dataFim` e `conta` (filtro opcional).

Busca dados de 3 fontes:
- Parcelas pagas no periodo (receitas de acordos)
- Transacoes importadas do periodo (receitas e despesas)
- Despesas do periodo (tabela despesas)

Exibe em 4 secoes:

**Resumo (KPIs):**
- Total Receitas | Total Despesas | Saldo Liquido | Saldo por Conta

**Aba Receitas:**
- Tabela com data, descricao, cliente, categoria, conta, valor
- Subtotal

**Aba Despesas:**
- Tabela com data, descricao, categoria, conta, valor
- Subtotal

**Aba Saldo por Conta:**
- Tabela: Conta | Receitas | Despesas | Saldo
- Uma linha por conta (Juliana, Liziane, Escritorio)

**Botao "Exportar Excel para Contador":**
- Gera arquivo .xlsx real com 4 abas (Resumo, Receitas, Despesas, Saldo por Conta)
- Formatado com headers em negrito, valores em formato moeda, totais destacados

### 3. `RelatorioSelector.tsx` - Simplificado

Manter filtros de data + adicionar filtro de **Conta** (Todas / Juliana / Liziane / Escritorio). Remover dropdown de tipo (os 3 relatorios ficam como cards clicaveis).

### 4. `exportToExcelFormatado` em `exportUtils.ts`

```text
Usar biblioteca xlsx ja instalada:
- XLSX.utils.json_to_sheet() para criar abas
- XLSX.utils.book_new() + book_append_sheet() para montar workbook
- XLSX.writeFile() para download
- Adicionar largura de colunas e formatacao basica
```

### 5. Pagina `Relatorios.tsx` simplificada

- 3 cards de relatorio em grid
- Seletor de periodo + conta no topo
- Ao clicar num card, renderiza o relatorio abaixo
- Layout limpo e direto

## Resultado

- Pagina de relatorios com 3 opcoes claras em vez de 7
- Relatorio consolidado para contador com todas as informacoes necessarias
- Exportacao Excel real (.xlsx) com multiplas abas formatadas
- Filtro por conta funcional em todos os relatorios
- Filtro de data funcional (atualmente o de Receitas ignora o filtro)

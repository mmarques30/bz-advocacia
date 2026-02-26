

# Padronizar filtros do Financeiro: tamanho compacto e consistente

## Problema
Os filtros nas 4 abas do Financeiro tem tamanhos inconsistentes. O botão "Selecionar período" é largo demais (w-[280px]). Os filtros precisam ser discretos, compactos e mostrar claramente do que se tratam.

## Padrão a aplicar
- Todos os `SelectTrigger`: `h-9 text-xs w-[130px]`
- Botão de período (calendário): `h-9 text-xs w-[180px]`
- Botão de anos (multi-select): `h-9 text-xs w-[130px]`
- Gap entre filtros: `gap-2`

## Arquivos

### 1. `src/components/financeiro/transacoes/TransacoesFilters.tsx` (Visão Geral)
- Linha 116: `gap-3` → `gap-2`
- Linha 123: Anos button `w-[160px]` → `h-9 text-xs w-[130px]`
- Linha 168-169: Período button `w-[220px]` → `h-9 text-xs w-[180px]`
- Linha 199: Tipo trigger `w-[130px]` → `h-9 text-xs w-[120px]`
- Linha 222: Categoria trigger `w-[150px]` → `h-9 text-xs w-[130px]`
- Linha 244: Subcategoria trigger `w-[150px]` → `h-9 text-xs w-[130px]`
- Linha 266: Conta trigger `w-[160px]` → `h-9 text-xs w-[130px]`
- Linha 280: Botão limpar `size="icon"` → `size="sm"` com `h-9`

### 2. `src/components/financeiro/FaturamentoFilters.tsx` (Faturamento)
- Linha 133: `gap-3` → `gap-2`
- Linha 135: Ano trigger `w-[120px]` → `h-9 text-xs w-[100px]`
- Linha 157: Cliente trigger `w-[200px]` → `h-9 text-xs w-[140px]`
- Linha 174-175: Período button `w-[280px]` → `h-9 text-xs w-[180px]`
- Linha 210: Status trigger `w-[150px]` → `h-9 text-xs w-[130px]`
- Linha 227: Tipo trigger `w-[160px]` → `h-9 text-xs w-[130px]`
- Linha 243: Conta trigger `w-[160px]` → `h-9 text-xs w-[130px]`

### 3. `src/components/financeiro/DespesasGlobalFilters.tsx` (Despesas)
- Linha 126: `gap-3` → `gap-2`
- Linha 128: Ano trigger `w-[120px]` → `h-9 text-xs w-[100px]`
- Linha 150: Tipo trigger `w-[150px]` → `h-9 text-xs w-[130px]`
- Linha 166-167: Período button `w-[280px]` → `h-9 text-xs w-[180px]`
- Linha 202: Categoria trigger `w-[160px]` → `h-9 text-xs w-[130px]`
- Linha 219: Status trigger `w-[130px]` → `h-9 text-xs w-[130px]`
- Linha 237: Conta trigger `w-[160px]` → `h-9 text-xs w-[130px]`

### 4. `src/components/financeiro/historico/HistoricoFilters.tsx` (Histórico)
- Linha 55: gap → `gap-2`
- Ano trigger: `w-[120px]` → `h-9 text-xs w-[100px]`
- Data Início button: `w-[140px]` → `h-9 text-xs w-[140px]`
- Data Fim button: `w-[140px]` → `h-9 text-xs w-[140px]`
- Tipo trigger: `w-[130px]` → `h-9 text-xs w-[120px]`
- Categoria trigger: `w-[130px]` → `h-9 text-xs w-[120px]`

Todas as alterações são puramente cosméticas (classes CSS). Nenhuma lógica muda.


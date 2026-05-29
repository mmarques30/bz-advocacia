## Problema

No card "Evolução Mensal de Despesas" (`DespesasProjecaoTab.tsx`):

1. **Filtro de ano ignorado** — o componente sempre monta os "últimos 12 meses corridos" a partir de hoje, sem ler o `dateRange` dos filtros globais. Por isso, mesmo com 2026 selecionado, aparecem jun/25 → mai/26.
2. **Cor ruim** — usa `hsl(var(--chart-5))` (pêssego claro), fora da identidade bronze.

## Fix

### 1. Respeitar o filtro de período

- Passar `despesasGlobalFilters` (ou apenas o `dateRange`) de `Financeiro.tsx` para `DespesasProjecaoTab`.
- No componente, derivar a janela de 12 meses:
  - Se `dateRange.from` e `dateRange.to` cobrem um ano inteiro (jan→dez), montar de `jan/<ano>` a `dez/<ano>`.
  - Se vier um intervalo customizado, montar mês a mês entre `from` e `to` (limitado a 24 meses para não estourar).
  - Sem filtro: comportamento atual (últimos 12 meses corridos).
- Incluir `dateRange` no `queryKey` para invalidar o cache quando o filtro muda.
- Atualizar o subtítulo: "Últimos 12 meses" → "<Período>" dinâmico (ex.: "Ano de 2026", "jan/26 – jun/26").

### 2. Cor da barra

- Trocar `hsl(var(--chart-5))` por `hsl(var(--primary))` (bronze da marca), com `opacity 0.85` no estado normal e `1` no mês selecionado. Mês não selecionado fica com `opacity 0.35` (mantém o efeito de "dim" do filtro clicável).
- Atualizar a cor do hover/cursor para combinar.

## Fora do escopo

- Não vou alterar KPIs nem a tabela — eles já respeitam `despesasGlobalFilters`.
- Não vou mexer em `FaturamentoProjecaoTab` neste passo (mesmo padrão se quiser depois).

## Arquivos afetados

- `src/components/financeiro/DespesasProjecaoTab.tsx`
- `src/pages/Financeiro.tsx` (apenas para passar a prop `filters`)

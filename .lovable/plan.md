
# Unificar Abas de Analise em uma Unica Aba "Analises"

## Diagnostico

As duas abas possuem sobreposicao significativa:
- "Conversao por Origem" (grafico de barras) mostra taxa de conversao por canal
- "Comparacao de Canais" (tabela) mostra os mesmos dados + ticket medio e tempo medio
- Ambas usam o mesmo filtro de periodo

A separacao forca o usuario a alternar entre abas para ter a visao completa.

## Solucao

Substituir as duas abas ("Analise de Conversao" e "Performance por Canal") por uma unica aba **"Analises"** com o seguinte layout sequencial:

1. **KPI de Conversao Geral** (do DashboardConversao)
2. **Insights Automaticos** (do DashboardPerformanceCanal)
3. **Funil Detalhado** (do DashboardConversao)
4. **Grid 2 colunas:**
   - Evolucao da Taxa de Conversao (linha temporal)
   - Distribuicao de Leads por Canal (pizza)
5. **Grid 2 colunas:**
   - Evolucao por Canal (linha temporal por canal)
   - Tempo Medio por Estagio (tabela)
6. **Tabela Comparativa de Canais** (substitui o grafico "Conversao por Origem" que era redundante)

## Alteracoes

### `src/pages/vendas/MetaAds.tsx`
- Remover as duas TabsTrigger ("conversao" e "canais") e seus TabsContent
- Adicionar uma unica TabsTrigger "analises" com label "Analises"
- O conteudo da aba renderiza um novo componente `DashboardAnalises`

### Novo: `src/components/dashboard/analises/DashboardAnalises.tsx`
- Combina os dados de `useConversionAnalytics` e `useChannelPerformance` / `useChannelEvolution` / `useAutoInsights`
- Renderiza todos os componentes na ordem descrita acima
- Remove o `ConversionByOriginChart` (redundante com a tabela comparativa)

### Removidos da renderizacao (nao deletados)
- `DashboardConversao.tsx` -- nao sera mais importado em MetaAds
- `DashboardPerformanceCanal.tsx` -- nao sera mais importado em MetaAds
- `ConversionByOriginChart` -- nao sera renderizado (a tabela comparativa ja mostra a mesma informacao de forma mais completa)

### `src/pages/vendas/Analises.tsx`
- Atualizar para usar o novo `DashboardAnalises` em vez das duas abas separadas, simplificando tambem essa pagina

## Resultado

- Marketing tera 2 abas: **Resumo** e **Analises**
- Tudo em uma unica visualizacao com scroll, sem necessidade de alternar abas
- Eliminada a redundancia entre grafico de conversao por origem e tabela comparativa



# Corrigir layout de Marketing para replicar fielmente o dashboard de referencia

## Diferenças identificadas entre referencia e implementacao atual

### Header
- **Ref**: "Período completo" (label pequeno) + "R$ 5.500" (valor grande bold) no canto direito
- **Atual**: Badge com "X leads no período" + Select de periodo

### KPI Cards - Performance & ROI
- **Ref**: Linha 1 (4 cards): Total de Leads (com variacao %), Custo por Lead (R$), Taxa de Conversao (%), ROI (% em verde)
- **Ref**: Linha 2 (3 cards): CTR Medio (%), CPC Medio (R$), Taxa Qualificacao (%)
- **Atual**: Dados diferentes (Leads Hoje, Leads na Semana, Plataforma Principal) - nao replica o layout

### Graficos
- **Ref**: Chart tem subtitulo descritivo abaixo do titulo
- **Ref**: Funil tem subtitulo "Jornada completa dos leads"
- **Ref**: Distribuicao tem subtitulo "Tipos de servicos mais demandados"
- **Atual**: Sem subtitulos nos graficos

### Aba Campanhas & Custos
- **Atual**: Usa MarketingCsvCharts com pie chart + area chart stacked + tabela - layout diferente do padrao do dashboard de referencia
- **Ref**: Deve seguir o mesmo estilo limpo e estruturado

## Alteracoes

### `src/components/meta-ads/MarketingDashboardKPIs.tsx` (reescrever)
- Linha 1 (4 cards): Total de Leads (com variacao % vs semana), Custo por Lead (R$, derivado de meta_metricas se disponivel ou "-"), Taxa de Conversao (%), ROI (% em verde se positivo)
- Linha 2 (3 cards): CTR Medio (%), CPC Medio (R$), Taxa Qualificacao (%)
- Manter dados CSV para Total de Leads, Taxa de Conversao, Taxa Qualificacao
- Para Custo por Lead, CTR, CPC, ROI: usar dados do hook useMetaMetrics se disponiveis, senao mostrar "-"
- ROI positivo: valor em text-green-600, negativo em text-red-600
- Cada card com subtitulo descritivo (ex: "Investimento / Leads", "X leads convertidos", "Retorno sobre investimento")

### `src/pages/vendas/MetaAds.tsx` (ajustar)
- Header: trocar Badge por "Periodo completo" (label) + valor de investimento (R$) do kpis.gasto se disponivel
- Manter Select de periodo
- Passar kpis do useMetaMetrics para MarketingDashboardKPIs
- Remover secao separada de MetaAdsKPIs/MetaAdsChart (integrar os dados nos KPI cards unificados)

### `src/components/meta-ads/MarketingPerformanceChart.tsx` (ajustar)
- Adicionar subtitulo: "Acompanhamento de leads captados e taxa de conversao ao longo do tempo"

### `src/components/meta-ads/MarketingFunnelChart.tsx` (ajustar)
- Adicionar subtitulo: "Jornada completa dos leads"

### `src/components/meta-ads/MarketingServiceDistribution.tsx` (ajustar)
- Adicionar subtitulo: "Tipos de servicos mais demandados"

### Aba "Campanhas & Custos" (restruturar no MetaAds.tsx)
- Linha 1: 4 KPI cards resumo (Investimento Total, Total Campanhas, Melhor Campanha, CPC Medio) - mesmo estilo visual dos cards da aba Performance
- Linha 2: Grafico full-width "Evolucao de Leads por Dia" (area chart stacked por plataforma - ja existe em MarketingCsvCharts)
- Linha 3: Grid 2 colunas: Distribuicao por Plataforma (pie chart) + Tabela de Performance por Campanha
- Extrair componentes inline ou reutilizar MarketingCsvCharts com props adequadas


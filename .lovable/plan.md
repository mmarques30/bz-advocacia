
# Remover Duplicacao de Informacoes no Resumo de Marketing

## Problema

Na aba "Resumo" de Marketing, o card "Resumo de ROI" e os KPIs abaixo exibem dados duplicados:
- ROI Card: Investimento, Leads, CPL, ROI Estimado
- KPIs: Investimento, Leads, Custo/Lead, Cliques, CTR

Tres metricas (Investimento, Leads, Custo/Lead) aparecem duplicadas.

## Solucao

Remover o componente `ROICard` e adicionar a metrica "ROI Estimado" diretamente nos KPIs, resultando em 6 cards unificados: Investimento, Leads, Custo/Lead, Cliques, CTR e ROI Estimado.

## Alteracoes

### `src/pages/vendas/MetaAds.tsx`
- Remover o componente interno `ROICard` (linhas 19-67)
- Remover a linha `<ROICard kpis={kpis} isLoading={isLoadingMetrics} />` (linha 108)
- Remover imports nao utilizados (DollarSign, Users, Target, BarChart3 do lucide)

### `src/components/meta-ads/MetaAdsKPIs.tsx`
- Adicionar um sexto card "ROI Estimado" calculado a partir de `kpis.gasto` e `kpis.leads`
- Ajustar o grid de 5 para 6 colunas (`lg:grid-cols-6`)



# Redesign da Pagina de Marketing no estilo do Dashboard de referencia

## O que sera feito

Recriar completamente a pagina de Marketing (`src/pages/vendas/MetaAds.tsx`) e seus componentes visuais para replicar o layout do dashboard de referencia, mantendo os dados do Google Sheets (CSV) atual.

## Layout de referencia (screenshot analisado)

O dashboard de referencia tem:
1. **Header**: titulo "Dashboard de Marketing" + subtitulo + investimento total no canto direito
2. **Tabs**: "Performance & ROI" e "Campanhas & Custos"
3. **KPI Cards**: 2 linhas
   - Linha 1: 4 cards (Total de Leads, Custo por Lead, Taxa de Conversao, ROI) — cards brancos com borda fina, icone discreto no canto, valor grande, subtitulo pequeno, variacao colorida
   - Linha 2: 3 cards (CTR Medio, CPC Medio, Taxa Qualificacao)
4. **Grafico principal**: "Performance Diaria: Leads vs Conversoes" — AreaChart com 3 series (Leads azul, Conversoes verde, Taxa% laranja tracejada) e eixo Y duplo
5. **2 graficos lado a lado**: Funil de Conversao (BarChart horizontal) + Distribuicao por Servico (BarChart horizontal)

## Adaptacao para dados do CSV

Como nao temos dados de investimento/CPC/CTR reais do CSV, os KPIs serao:

### Linha 1 (4 cards):
| Card | Dado | Icone |
|------|------|-------|
| Total de Leads | totalLeads | Users |
| Leads Hoje | leadsHoje | CalendarDays |
| Taxa de Conversao | taxaConversao% | Target |
| Taxa Qualificacao | taxaQualificacao% | UserCheck |

### Linha 2 (3 cards):
| Card | Dado | Icone |
|------|------|-------|
| Taxa de Envio | taxaEnvio% | Send |
| Leads na Semana | leadsSemana | TrendingUp |
| Plataforma Principal | top platform name + count | BarChart3 |

### Graficos:
1. **Performance Diaria** (full-width): AreaChart com Leads (area preenchida azul claro / stroke bronze), Conversoes (line verde), e opcionalmente taxa % (line tracejada) — eixo Y duplo
2. **Funil de Conversao** (metade): BarChart horizontal como no exemplo
3. **Distribuicao por Servico** (metade): BarChart horizontal com tipo_servico dos leads

## Cores adaptadas a marca B&Z

| Elemento | Cor de referencia | Adaptacao B&Z |
|----------|-------------------|---------------|
| Leads (area) | Azul claro | `hsl(var(--chart-1))` bronze com opacity 0.2 |
| Conversoes (line) | Verde | `hsl(var(--chart-4))` success |
| Taxa % (dashed) | Laranja | `hsl(var(--chart-5))` warning |
| ROI positivo | Verde (#22c55e) | `hsl(var(--chart-4))` success |
| Card borders | Cinza claro | `border` token existente |
| Card icons | Cinza medio | `text-muted-foreground` |
| Variacao positiva | Verde | `text-green-600` |
| Variacao negativa | Vermelho | `text-red-600` |

## Aba "Campanhas & Custos"

Mantera o conteudo da aba "Analises" atual: evolucao por plataforma (AreaChart stacked) + tabela de campanhas.

## Arquivos alterados

### `src/pages/vendas/MetaAds.tsx` (reescrita completa)
- Novo header com titulo + subtitulo + badge de periodo/total no canto direito
- Tabs renomeadas: "Performance & ROI" e "Campanhas & Custos"
- Tab 1: KPI cards no novo layout (2 linhas: 4+3) + grafico Performance Diaria (full-width) + grid 2 colunas (Funil + Distribuicao por Servico)
- Tab 2: Evolucao por plataforma + Tabela de campanhas

### `src/components/meta-ads/MarketingDashboardKPIs.tsx` (novo)
- Componente de KPI cards no estilo do dashboard de referencia: card branco, borda fina, icone no canto superior direito, valor grande, subtitulo descritivo, variacao com seta colorida
- Recebe `analytics: MarketingCsvAnalytics`

### `src/components/meta-ads/MarketingPerformanceChart.tsx` (novo)
- Grafico "Performance Diaria: Leads vs Conversoes"
- ComposedChart do Recharts com Area (leads), Line (conversoes), Line dashed (taxa %)
- Eixo Y duplo (esquerdo: count, direito: percentual)
- Calcula conversoes diarias a partir dos dados do dailyLeads e funnel

### `src/components/meta-ads/MarketingServiceDistribution.tsx` (novo)
- BarChart horizontal com distribuicao por tipo de servico
- Dados extraidos do CSV (campo `tipoServico`)
- Barras com cor bronze (primary)

### `src/hooks/useMarketingCsvAnalytics.ts` (editar)
- Adicionar campo `serviceDistribution: { service: string; count: number }[]` ao retorno
- Adicionar campo `dailyConversions: { date: string; leads: number; conversoes: number; taxa: number }[]` para o grafico principal
- Calcular distribuicao por tipo de servico a partir de `tipoServico`

### Componentes existentes mantidos:
- `MarketingCsvCharts.tsx` — usado na aba "Campanhas & Custos" (showEvolution + showCampaigns)
- `chartConfig.ts` — cores mantidas

## Estilo dos KPI Cards (detalhe visual)

```text
┌──────────────────────────────┐
│ Total de Leads          [icon]│
│                               │
│ 245                           │
│ ↑ 12.5% vs semana anterior   │
└──────────────────────────────┘
```

- `border rounded-xl bg-card p-6`
- Titulo: `text-sm font-medium text-muted-foreground`
- Valor: `text-3xl font-bold mt-2`
- Subtitulo/variacao: `text-xs mt-1` com cor condicional
- Icone: `h-5 w-5 text-muted-foreground` no canto superior direito


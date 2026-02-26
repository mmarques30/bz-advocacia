

# Fix: Trocar agrupamento de "Campanha" para "Anúncio"

A tabela "Performance por Campanha" agrupa por `campaign_name`, mas deveria agrupar por `ad_name` (anúncio).

## Alterações

### 1. `src/hooks/useMarketingCsvAnalytics.ts`
- **Interface `UnifiedLead` (linha 72)**: Adicionar campo `anuncio: string`
- **Mapeamento de CSV leads (linha ~107)**: Mapear `anuncio: l.adName || "-"`
- **Mapeamento de orgânicos (linha ~130)**: Mapear `anuncio: "Orgânico"`
- **Bloco "Campaigns" (linhas 194-205)**: Trocar agrupamento de `l.campanha` para `l.anuncio`

### 2. `src/components/meta-ads/MarketingCampanhasCustos.tsx`
- **Linha 108**: `"Performance por Campanha"` → `"Performance por Anúncio"`
- **Linha 109**: `"Métricas detalhadas por campanha"` → `"Métricas detalhadas por anúncio"`
- **Linha 120**: TableHead `"Campanha"` → `"Anúncio"`
- **Linha 75**: KPI subtitle `"Campanhas ativas"` → `"Anúncios ativos"`
- **Linha 75**: KPI title `"Total de Campanhas"` → `"Total de Anúncios"`
- **Linha 76**: KPI title `"Melhor Campanha"` → `"Melhor Anúncio"`

### 3. `src/components/meta-ads/MarketingCsvCharts.tsx`
- Linha 143: `"Performance por Campanha"` → `"Performance por Anúncio"`
- TableHead `"Campanha"` → `"Anúncio"`


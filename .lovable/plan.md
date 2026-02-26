

# Corrigir gráfico Distribuição por Plataforma

## Problema
O gráfico de Distribuição por Plataforma na aba "Campanhas & Custos" mostra apenas dados do CSV (Google Sheets), que são predominantemente Instagram. Não inclui os leads orgânicos da tabela `contact_submissions` (182 "outro", 22 "site", 8 "indicação").

## Solução
Combinar dados de plataforma do CSV com dados de origem da tabela `contact_submissions` no mesmo gráfico.

### Alterações

1. **`src/hooks/useServiceDistribution.ts`** → Renomear/expandir para incluir uma função `usePlatformDistribution` que:
   - Busca `origem` de `contact_submissions` agrupado (COUNT por origem)
   - Mapeia origens do banco para labels legíveis: `site → Site`, `indicacao → Indicação`, `outro → Orgânico`, `instagram → Instagram`, `facebook → Facebook`
   - Recebe `platformKPIs` do CSV como parâmetro
   - Combina CSV (fb→Facebook, ig→Instagram, organic→Orgânico) com banco
   - Retorna array unificado `{ label, count, percentage }`

2. **`src/pages/vendas/MetaAds.tsx`** → Importar `usePlatformDistribution`, passar `csvAnalytics.platformKPIs`, passar resultado ao `MarketingCampanhasCustos`

3. **`src/components/meta-ads/MarketingCampanhasCustos.tsx`** → Receber prop `mergedPlatformData` e usar no PieChart em vez de `analytics.platformKPIs`


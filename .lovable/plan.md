

# Plano: Carrossel de KPIs + Funil com dados orgânicos

## 1. KPIs em carrossel horizontal (`MarketingDashboardKPIs.tsx`)
- Substituir os 2 grids (4+3 cards) por uma linha horizontal única com scroll
- Usar `embla-carousel-react` (já instalado) para carrossel com setas de navegação
- Todos os 7 KPIs ficam na mesma linha, com setas esquerda/direita para navegar
- Cada card ocupa largura fixa (~220px) para manter proporção

## 2. Funil de conversão com leads orgânicos

**Problema**: O funil atual (`csvAnalytics.funnel`) só conta leads do CSV (Google Sheets). Os 212 leads orgânicos da tabela `contact_submissions` não aparecem.

**Dados orgânicos disponíveis**:
- `estagio`: fechado (185), novo (25), em_analise (1), contato_inicial (1)
- `status`: todos "novo" (212)

**Solução**: Criar hook `useFunnelUnificado` que:
- Busca leads orgânicos de `contact_submissions` agrupados por `estagio`
- Mapeia estágios orgânicos para labels do funil: `novo → Novo`, `contato_inicial → Enviado`, `em_analise → Qualificado`, `fechado → Convertido`
- Combina com dados do CSV (`csvAnalytics.funnel`)
- Recalcula percentuais sobre o total unificado

### Alterações por arquivo

| Arquivo | Alteração |
|---|---|
| `src/components/meta-ads/MarketingDashboardKPIs.tsx` | Reescrever para usar embla-carousel com 7 cards em linha única + setas |
| `src/hooks/useServiceDistribution.ts` | Adicionar export `useFunnelUnificado` que busca estágios de `contact_submissions` e combina com funnel do CSV |
| `src/pages/vendas/MetaAds.tsx` | Importar `useFunnelUnificado`, passar resultado ao `MarketingFunnelChart` em vez de `csvAnalytics.funnel` |


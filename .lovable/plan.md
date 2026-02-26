

# Plano: Corrigir carrossel KPIs + Unificar dados orgânicos e anúncios no Marketing

## Problema 1: Cards KPI extrapolando a página
O componente `MarketingDashboardKPIs` usa Embla Carousel com `flex-[0_0_220px]` fixo, mas sem `overflow-hidden` correto no container pai, fazendo os cards ultrapassarem os limites da página.

**Correção em `MarketingDashboardKPIs.tsx`:**
- Trocar layout para grid responsivo em vez de carrossel horizontal (mais consistente com o resto do sistema)
- Grid de 2 colunas em mobile, 3 em tablet, 4 em desktop — sem overflow

## Problema 2: Unificar leads orgânicos + anúncios

Atualmente `useMarketingCsvAnalytics` só consome dados do CSV (anúncios). Os leads orgânicos estão na tabela `contact_submissions` e não aparecem no dashboard de marketing.

**Correção em `useMarketingCsvAnalytics.ts`:**
- Importar `supabase` e buscar leads de `contact_submissions` em paralelo
- Mapear leads orgânicos para o mesmo formato de métricas (plataforma = "organic", status derivado do `estagio`)
- Combinar os dois conjuntos antes de calcular KPIs, funil, distribuição por canal e conversões diárias
- Aplicar o mesmo filtro de período aos orgânicos

**Mapeamento de estágio orgânico → status unificado:**
| `estagio` (contact_submissions) | Status unificado |
|---|---|
| `novo` | Novo |
| `contato_inicial` | Enviado |
| `em_analise`, `proposta_enviada` | Qualificado |
| `fechado` | Convertido |
| `perdido` | Perdido |

## Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `MarketingDashboardKPIs.tsx` | Substituir Embla por grid responsivo |
| `useMarketingCsvAnalytics.ts` | Buscar e unificar contact_submissions + CSV |


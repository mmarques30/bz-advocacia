

# Corrigir Funil de Conversao e Distribuicao por Servico

## Problema 1: Funil de Conversao
O grafico atual e um BarChart horizontal com uma unica barra ("Criado"). Precisa ser um funil visual com barras verticais decrescentes mostrando todas as etapas, ou um layout de funil estilizado com barras de largura decrescente.

**Solucao**: Transformar em um funil visual com barras horizontais centralizadas de largura decrescente (estilo trapezio/funil), mostrando cada etapa com cor distinta, contagem e percentual. Usar divs estilizados em vez do Recharts BarChart, que nao consegue representar bem um funil.

## Problema 2: Distribuicao por Servico
O campo `tipo_servico` vem do CSV (Google Sheets) e esta vazio para a maioria dos leads. Mas a tabela `contact_submissions` tem o campo `tipo_processo` com dados reais (Inventario, Divorcio Consensual, Guarda, Outro).

**Solucao**: Alimentar o grafico de distribuicao tambem com dados da tabela `contact_submissions` (leads organicos), usando o campo `tipo_processo`. Combinar dados do CSV + organicos.

## Alteracoes

### `src/components/meta-ads/MarketingFunnelChart.tsx` (reescrever)
- Substituir BarChart horizontal por um funil visual com divs
- Cada etapa e uma barra horizontal centralizada com largura proporcional ao percentual
- Cores distintas por etapa (azul, verde, roxo, emerald, vermelho)
- Mostrar contagem + percentual ao lado de cada barra
- Se nao houver dados, mostrar "Sem dados"

### `src/components/meta-ads/MarketingServiceDistribution.tsx` (ajustar)
- Aceitar prop adicional `organicData` com dados de `tipo_processo` de `contact_submissions`
- Combinar dados CSV + organicos no grafico
- Cada barra com cor distinta por servico (usar Cell com cores diferentes)
- Adicionar subtitulo descritivo

### `src/pages/vendas/MetaAds.tsx` (ajustar)
- Buscar dados de `tipo_processo` da tabela `contact_submissions` agrupados
- Passar para `MarketingServiceDistribution` como prop adicional

### `src/hooks/useMarketingCsvAnalytics.ts` (ajustar)
- Adicionar ao retorno o `serviceDistribution` combinado com dados organicos (ou manter separado e combinar no componente)

**Abordagem alternativa mais simples para servico**: Criar um hook `useServiceDistribution` que busca `tipo_processo` de `contact_submissions` e combina com CSV, passando resultado unico ao componente.


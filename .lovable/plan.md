

# Integrar dados do Google Sheets no Dashboard de Marketing

## Problema atual

O dashboard de Marketing (/vendas/meta-ads) tem duas abas:

1. **Resumo**: Usa `useMetaMetrics` que le da tabela `meta_metricas` (vazia se nao houver conexao Meta Ads configurada)
2. **Analises**: Usa `useConversionAnalytics` / `useChannelPerformance` que leem da tabela `contact_submissions` (leads do formulario do site)

Nenhuma das duas abas consome os dados do Google Sheets (CSV) que e a fonte real de leads via automacao. Resultado: ambas as abas aparecem vazias ou com dados incompletos.

## Solucao

Criar um hook dedicado `useMarketingCsvAnalytics` que processa os dados do CSV (ja disponivel via `useLeadsCsv`) e gera metricas compatíveis com os componentes existentes. Integrar esses dados em ambas as abas.

### 1. Novo hook `src/hooks/useMarketingCsvAnalytics.ts`

Este hook consome `useLeadsCsv` e produz:

- **Para aba Resumo**: KPIs calculados a partir do CSV (total leads, leads por plataforma, leads hoje, distribuicao fb/ig/organic)
- **Para aba Analises**: Dados de conversao (funil por status), performance por canal (fb/ig/organic), evolucao temporal dos leads

Mapeamentos do CSV para analytics:
```text
platform (fb/ig/organic) → origem do canal
lead_status (CREATED/ENVIADO/QUALIFICADO/CONVERTIDO) → estagios do funil
campaign_name → agrupamento por campanha
created_time → evolucao temporal
```

### 2. Alteracoes em `src/pages/vendas/MetaAds.tsx`

**Aba Resumo**:
- Importar `useLeadsCsv` para obter dados do Sheets
- Adicionar secao de KPIs com dados do CSV (total leads, leads hoje, por plataforma)
- Manter KPIs do Meta Ads se houver dados, mas adicionar os dados do Sheets como fonte principal de leads
- Adicionar grafico de leads por plataforma (fb/ig/organic) usando dados do CSV

**Aba Analises**:
- Substituir/complementar `DashboardAnalises` com componente que usa dados do CSV
- Funil: CREATED → ENVIADO → QUALIFICADO → CONVERTIDO
- Distribuicao por canal: Facebook / Instagram / Organico
- Evolucao temporal: leads por dia/semana agrupados por plataforma

### 3. Novo componente `src/components/meta-ads/MarketingCsvKPIs.tsx`

KPIs derivados do CSV:
- Total de Leads (do Sheets)
- Leads Hoje
- Por plataforma (Facebook / Instagram / Organico)
- Taxa de envio (ENVIADO / total)
- Taxa de conversao (CONVERTIDO / total)

### 4. Novo componente `src/components/meta-ads/MarketingCsvCharts.tsx`

Graficos:
- Distribuicao por plataforma (pie chart)
- Funil de status (bar chart: Criado → Enviado → Qualificado → Convertido)
- Evolucao de leads ao longo do tempo (line chart por dia)

### Detalhes tecnicos

- O CSV ja e buscado via `useLeadsCsv` com `queryKey: ["leads-csv"]` - reutilizamos o cache
- Os dados do CSV tem: `plataforma`, `campanha`, `estagio`, `situacao`, `dataRaw`, `tipoServico`
- Nao precisa de alteracoes no banco - tudo e processado client-side a partir do CSV
- Os componentes existentes de analytics (`LeadsDistributionChart`, `ChannelComparisonTable`, etc) esperam `ChannelPerformance[]` com campo `origem: LeadOrigem` - precisamos mapear `fb → meta`, `ig → meta`, `organic → indicacao` para compatibilidade, ou criar componentes proprios

**Decisao**: Criar componentes proprios para a aba Marketing e manter os componentes de analytics separados, ja que os tipos de dados sao diferentes (CSV usa status fb/ig/organic vs analytics usa google/meta/indicacao/site).

### Arquivos alterados/criados
- **Novo**: `src/hooks/useMarketingCsvAnalytics.ts`
- **Novo**: `src/components/meta-ads/MarketingCsvKPIs.tsx`
- **Novo**: `src/components/meta-ads/MarketingCsvCharts.tsx`
- **Editado**: `src/pages/vendas/MetaAds.tsx` (integrar CSV em ambas as abas)


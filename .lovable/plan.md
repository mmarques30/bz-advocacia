

# Plano: Unificar dados de leads no Painel B&Z

## Problema
O Dashboard principal (`useDashboardCompleto`) busca leads apenas da tabela `contact_submissions` (orgânicos). Os leads do CSV (anúncios) são ignorados nos KPIs "Leads no Mês" e no gráfico "Evolução de Leads". O marketing dashboard já faz a unificação corretamente via `useMarketingCsvAnalytics`.

## Alterações

### 1. `src/hooks/useDashboardCompleto.ts`
- Importar `useLeadsCsv` ou consumir o CSV diretamente via fetch+PapaParse dentro da queryFn
- Na contagem "Leads no Mês" (query 9): somar leads orgânicos do banco + leads CSV do mês atual
- Na "Evolução de Leads" (loop de 6 meses): para cada mês, contar leads CSV daquele mês e somar ao count orgânico
- Na taxa de conversão: manter apenas orgânicos (conversão só acontece no banco)

### 2. `src/pages/Dashboard.tsx`
- Sem alterações necessárias (já consome os dados do hook)

### Detalhes técnicos

Como `useDashboardCompleto` usa `useQuery` com `queryFn` async, não pode chamar hooks internamente. A solução é:
- Fazer fetch do CSV dentro da `queryFn` usando `Papa.parse` com download (mesmo padrão do `useLeadsCsv`)
- Parsear as datas do CSV e agrupar por mês
- Somar aos counts do banco para `totalLeadsMes` e `leadsEvolution`

O CSV já está cacheado pelo React Query em `["leads-csv"]`, mas como estamos dentro de outra queryFn, faremos o fetch direto (leve, pois o CSV é pequeno).


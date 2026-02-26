

# Plano: Renomear "Performance por Campanha" para "Performance por Anúncio"

## Contexto
O relatório atual agrupa leads por `utm_campaign || canal_especifico` da tabela `contact_submissions`. O dado de anúncio (`ad_name`) vem dos leads CSV (Google Sheets) e já está disponível via `useLeadsCsv`. A alteração precisa mudar o agrupamento para `ad_name` em vez de `utm_campaign`, e renomear todos os textos.

## Alterações

### 1. `src/types/relatorios-vendas.ts`
- Renomear o tipo `"performance_campanha"` para `"performance_anuncio"`

### 2. `src/hooks/useRelatoriosVendasPeriodo.ts`
- Renomear `CampanhaData` para `AnuncioData` (campo `campanha` → `anuncio`)
- Na função `calculateCampanhas` → `calculateAnuncios`: agrupar por `canal_especifico` (que já recebe o nome do anúncio nos leads convertidos) ou manter `utm_campaign` como fallback
- Adicionar campo `ad_name` na interface `LeadData` para buscar esse dado quando disponível

### 3. `src/components/relatorios-vendas/RelatorioPerformanceCampanha.tsx`
- Renomear arquivo conceitualmente (ou manter e ajustar internamente)
- Trocar todos os textos: "Performance por Campanha" → "Performance por Anúncio", "Melhor Campanha" → "Melhor Anúncio", "Total de Campanhas" → "Total de Anúncios", "Nenhuma campanha encontrada" → "Nenhum anúncio encontrado"
- Ajustar dataKeys e labels no gráfico/tabela

### 4. `src/pages/vendas/RelatoriosVendas.tsx`
- Renomear card: título "Performance por Anúncio", descrição "Análise detalhada por anúncio"
- Atualizar o tipo de `"performance_campanha"` para `"performance_anuncio"`

### 5. `src/components/relatorios-vendas/RelatorioVendasSelector.tsx`
- Renomear `SelectItem` de "Performance por Campanha" para "Performance por Anúncio"
- Atualizar value de `"performance_campanha"` para `"performance_anuncio"`

### Abordagem para dados
Como `contact_submissions` não tem `ad_name`, mas possui `canal_especifico` e `utm_campaign`, o agrupamento usará `canal_especifico || utm_campaign || "Sem anúncio"` — que é o campo onde o nome do anúncio/canal já é armazenado para leads vindos de ads.


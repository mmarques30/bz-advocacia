

# Plano: Adicionar campos extras na tabela de Leads Anúncios

## Problema
1. A coluna "Tipo" (tipo de serviço) parou de aparecer na tabela — precisa ser verificado e garantido
2. Campos úteis do CSV como `ad_name` (tipo de anúncio/post), `campaign_name`, `form_name` não são exibidos na tabela

## Solução

### 1. `useLeadsCsv.ts` — Adicionar campos ao `CsvLead`
- Adicionar `adName`, `campaignName`, `formName`, `adsetName` ao interface `CsvLead`
- Mapear de `row.ad_name`, `row.campaign_name`, `row.form_name`, `row.adset_name`

### 2. `LeadsCsvTable.tsx` — Adicionar colunas na tabela
- Garantir que "Tipo" (tipoServico) está renderizando corretamente
- Adicionar coluna "Anúncio" (`adName`) após "Tipo"
- Adicionar coluna "Campanha" (`campaignName`)
- Manter tabela responsiva com `truncate` nos campos longos

### 3. `csvToLeadGeral` em `Leads.tsx` — Passar novos campos
- Mapear `adName` → `ad_name`, `campaignName` → `campaign_name`, etc. na conversão para `LeadGeral`

## Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `src/hooks/useLeadsCsv.ts` | Adicionar `adName`, `campaignName`, `formName` ao CsvLead e mapeamento |
| `src/components/leads/LeadsCsvTable.tsx` | Adicionar colunas Anúncio e Campanha, garantir Tipo visível |
| `src/pages/Leads.tsx` | Atualizar `csvToLeadGeral` com novos campos |


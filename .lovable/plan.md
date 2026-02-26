

# Plano: Corrigir "Performance por Anúncio" para usar dados do CSV

## Problema
O relatório busca dados apenas da tabela `contact_submissions` (leads orgânicos), que não possui campo `ad_name`. Os dados reais de anúncios vêm do Google Sheets (CSV) via `useLeadsCsv`, onde cada lead tem `adName`, `campaignName`, `situacao`, etc.

## Alterações

### 1. `src/components/relatorios-vendas/RelatorioPerformanceCampanha.tsx`
- Importar `useLeadsCsv` em vez de (ou além de) `useRelatoriosVendasPeriodo`
- Agrupar os leads CSV por `adName` para gerar a tabela de anúncios
- Filtrar por período (`dataRaw` entre `dataInicio` e `dataFim`)
- Calcular por anúncio: total leads, leads por situação (Enviado, Qualificado, Convertido), taxa de conversão
- Manter o layout atual (KPIs, gráfico de barras, tabela)
- Ajustar colunas da tabela: "Contatados" → "Enviados", "Convertidos" mantém (baseado em `situacao === 'Convertido'`)

### 2. Sem alteração no hook `useRelatoriosVendasPeriodo`
- Ele continua servindo os outros relatórios (funil, status, contato)
- O relatório de anúncios passa a consumir diretamente o `useLeadsCsv`

### Lógica de agrupamento
```text
CSV leads filtrados por período
  → agrupar por adName (excluindo "-" como "Sem anúncio")
  → para cada grupo: totalLeads, enviados (situacao=Enviado), convertidos (situacao=Convertido)
  → taxa conversão = convertidos / total * 100
```


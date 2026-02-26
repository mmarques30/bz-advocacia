

# Plano: Corrigir mapeamento da tabela Leads Anúncios

## Problemas identificados

1. **Tipo de Serviço**: O CSV usa a coluna `qual_tipo_de_serviço_você_procura?` mas o código lê `row.tipo_servico` (inexistente) — por isso "Tipo" aparece sempre "-"
2. **Estágio**: Atualmente deriva do `lead_status` do CSV. O correto é: todos começam como "Novo" e só mudam via Kanban (tabela `leads_status_overrides`)
3. **Situação**: Deve ficar oculta na tabela CSV

## Alterações

### 1. `src/hooks/useLeadsCsv.ts`
- Linha 125: trocar `row.tipo_servico` por `row["qual_tipo_de_serviço_você_procura?"]` para mapear corretamente a coluna M do CSV
- Linha 118: alterar `mapEstagio` para sempre retornar "Novo" como padrão (o estágio real será resolvido via overrides no componente pai)

### 2. `src/components/leads/LeadsCsvTable.tsx`
- Remover a coluna "Situação" (cabeçalho e célula) — linhas 81, 111-114
- A tabela ficará: Nome, Origem, Tipo, Anúncio, Campanha, Estágio, Data, Dias Parado, Ação

### 3. `src/pages/Leads.tsx` (CsvLeadsTab)
- Integrar `useLeadStatusOverrides` na aba CSV para que o estágio exibido na tabela respeite os overrides do Kanban
- Passar os overrides para `LeadsCsvTable` e `csvToLeadGeral` para que o estágio do lead use o override quando existir, caso contrário "Novo"




# Corrigir: Excluir Clientes da aba "Leads Orgânicos"

## Problema

A aba "Leads Orgânicos" exibe **todos** os registros da tabela `contact_submissions`, incluindo aqueles com `estagio = 'fechado'` que são **clientes** (já gerenciados na página de Clientes). Muitos foram importados de uma planilha e não deveriam aparecer como leads.

## Diagnóstico

- A página **Clientes** filtra `estagio = 'fechado'` — esses são clientes
- A aba **Leads Orgânicos** não exclui esses registros, mostrando clientes misturados com leads ativos
- Dos 212 registros, 185 têm `estagio = 'fechado'` (são clientes), inflando os números

## Solução

Excluir registros com `estagio = 'fechado'` da aba de Leads Orgânicos. Leads com estágio "perdido" continuam visíveis (são leads que não converteram, diferente de clientes).

## Alterações

### `src/hooks/useLeads.ts`
- Adicionar um parâmetro opcional `excludeEstagios` ao filtro, ou aplicar a exclusão diretamente
- Antes do retorno, filtrar `estagio !== 'fechado'` quando chamado da aba de Leads (não da página de Clientes)

**Abordagem mais simples**: no `ManualLeadsTab` em `src/pages/Leads.tsx`, passar o filtro de status excluindo "fechado", alterando o `defaultFilters` para a aba de leads.

### `src/pages/Leads.tsx` (ManualLeadsTab)
- Alterar `queryFilters` para incluir exclusão de `estagio = 'fechado'`
- Usar o hook `useLeads` com filtro que exclui clientes: adicionar `status: ['novo', 'contato_inicial', 'em_analise', 'proposta_enviada', 'perdido']` como default

### `src/components/leads/LeadsOrganicSummary.tsx`
- Remover o card "Fechados" (já que não haverá mais leads fechados nessa aba)
- Substituir por outro KPI relevante, como "Perdidos"
- Os cálculos de KPI refletirão automaticamente apenas os leads reais

## Resumo do impacto

| Antes | Depois |
|-------|--------|
| 212 registros na aba | ~27 registros (apenas leads ativos) |
| Card "Fechados: 185" | Removido (clientes estão na página Clientes) |
| Clientes misturados | Apenas leads no funil |


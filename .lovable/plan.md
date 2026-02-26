

# Adicionar cards de resumo na aba "Leads" (renomear para "Leads Orgânicos")

## O que sera feito

1. **Renomear** a aba "Leads" para **"Leads Orgânicos"**
2. **Criar** um componente `LeadsOrganicSummary` com a mesma estrutura visual do `LeadsCsvSummary`, mas com KPIs calculados a partir dos dados da tabela `contact_submissions`
3. **Inserir** os cards acima da tabela/kanban na aba de Leads Orgânicos

## Dados disponíveis (contact_submissions)

| Metrica | Valor atual |
|---------|-------------|
| Total | 212 |
| Novos | 25 |
| Contato Inicial | 1 |
| Em Análise | 1 |
| Fechados | 185 |
| Perdidos | 0 |

## Cards propostos (5, mesmo layout do LeadsCsvSummary)

| Card | Dado | Icone |
|------|------|-------|
| Total de Leads | total de leads retornados | Users |
| Leads do Dia | criados hoje | CalendarDays |
| Novos | estagio = "novo" | PlusCircle |
| Fechados | estagio = "fechado" | CheckCircle2 |
| Em Andamento | contato_inicial + em_analise + proposta_enviada | AlertCircle |

## Arquivos

- **Novo**: `src/components/leads/LeadsOrganicSummary.tsx` -- componente de cards, recebe array de leads e calcula os KPIs client-side (sem query extra)
- **Editado**: `src/pages/Leads.tsx` -- renomear tab trigger de "Leads" para "Leads Orgânicos", importar e renderizar `LeadsOrganicSummary` no topo da `ManualLeadsTab`

## Detalhes tecnicos

O componente recebe `leads: Lead[] | undefined` e `loading: boolean`. Os KPIs sao calculados via `useMemo` sobre o array de leads ja carregado pelo `useLeads`, sem necessidade de queries adicionais. Isso mantém o mesmo pattern do `LeadsCsvSummary` que recebe dados ja processados.




# Plano: Ajustes nas abas de Leads

## 1. Leads Orgânicos — Remover botão "Importar" e busca por lupa

**Arquivo**: `src/pages/Leads.tsx` (ManualLeadsTab)
- Remover o componente `LeadsHeader` e substituir por um header simplificado sem botão de importação e sem campo de busca com lupa
- Manter apenas: botão "Novo Lead", filtros de Nome, Origem, botão Filtros, toggle Tabela/Kanban

## 2. Leads Anúncios — Adicionar filtros de nome e origem

**Arquivo**: `src/pages/Leads.tsx` (CsvLeadsTab)
- Adicionar um `Select` de nome (valores únicos extraídos de `csvData.leads`)
- Adicionar um `Select` de origem/plataforma (fb → Facebook, ig → Instagram, organic → Orgânico)
- Aplicar filtros ao `filteredLeads`

## 3. Kanban de Leads Orgânicos — Prévia com dias e tipo de serviço

**Arquivo**: `src/components/leads/LeadCard.tsx`
- Adicionar linha discreta mostrando "há X dias" (calculado a partir de `created_at`)
- O tipo de serviço (`tipo_processo`) já aparece no card. Ajustar para exibir de forma mais clean/discreta
- Remover o badge de origem (reduzir ruído) e manter layout minimalista

**Arquivo**: `src/pages/Leads.tsx` (DraggableLeadCard no KanbanView do CSV)
- Adicionar `created_time` formatado como "há X dias"
- Já exibe `tipo_servico`, manter

### Resumo de arquivos alterados
| Arquivo | Alteração |
|---|---|
| `src/pages/Leads.tsx` | Simplificar header orgânicos, adicionar filtros nome/origem em anúncios |
| `src/components/leads/LeadCard.tsx` | Adicionar dias desde contato, layout mais clean |




# Padronizar etapas: Leads Orgânicos = Leads Anúncios

## Situação atual

| Leads Orgânicos (Kanban) | Leads Anúncios (Kanban) |
|---|---|
| Novo | Novo |
| Contato Inicial | Enviado |
| Em Análise | Qualificado |
| Proposta | Convertido |
| Fechado (excluído) | Perdido |
| Perdido | |

## O que será feito

Padronizar o Kanban de Leads Orgânicos para ter as mesmas 5 colunas dos Leads Anúncios: **Novo, Enviado, Qualificado, Convertido, Perdido**.

### Mapeamento de estágios (DB → Visual)

O banco de dados mantém os valores atuais do enum (`novo`, `contato_inicial`, `em_analise`, `proposta_enviada`, `fechado`, `perdido`). O Kanban fará o mapeamento visual:

| Coluna visual | Valor(es) do DB agrupados | Cor |
|---|---|---|
| Novo | `novo` | blue-500 |
| Enviado | `contato_inicial` | green-500 |
| Qualificado | `em_analise`, `proposta_enviada` | purple-500 |
| Convertido | `fechado` (não aparece pois está excluído do filtro) | emerald-500 |
| Perdido | `perdido` | red-500 |

### Ao arrastar (drag-and-drop)

| Coluna destino | Salva no DB como |
|---|---|
| Novo | `novo` |
| Enviado | `contato_inicial` |
| Qualificado | `em_analise` |
| Convertido | `fechado` |
| Perdido | `perdido` |

## Arquivos alterados

### `src/components/leads/LeadsKanban.tsx`
- Alterar `columns` para as 5 etapas unificadas: Novo, Enviado, Qualificado, Convertido, Perdido
- Alterar `VALID_STAGES` para incluir todos os valores do DB que mapeiam para essas colunas
- Alterar o agrupamento (`leadsGrouped`) para mapear `contato_inicial` → "enviado", `em_analise`/`proposta_enviada` → "qualificado", `fechado` → "convertido"
- No `handleDragEnd`, mapear a coluna destino para o valor correto do DB
- Alterar grid de 6 para 5 colunas (`lg:grid-cols-5`)

### `src/pages/Leads.tsx` (defaultFilters)
- Atualizar `defaultFilters.status` para incluir `proposta_enviada` (para que leads existentes nesse estágio ainda sejam buscados e exibidos na coluna "Qualificado")

### `src/types/leads.ts` (labels)
- Atualizar `LEAD_STATUS_LABELS` para refletir os nomes unificados: `contato_inicial` → "Enviado", `em_analise` → "Qualificado", `proposta_enviada` → "Qualificado", `fechado` → "Convertido"

### `src/components/leads/LeadsOrganicSummary.tsx`
- Atualizar os cards de KPI para refletir as novas etapas: Novos, Enviados, Qualificados, Perdidos, Em Andamento


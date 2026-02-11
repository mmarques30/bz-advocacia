
# Plano: Historico de Tarefas na Ficha do Cliente + Filtro na Gestao de Tarefas

## Resumo

Duas mudancas complementares:
1. **Gestao de Tarefas**: por padrao, mostrar apenas tarefas ativas (pendente/em_andamento), com filtro para ver concluidas quando necessario (ja existe o filtro de status, basta mudar o comportamento padrao)
2. **Ficha do Cliente**: adicionar aba "Tarefas" mostrando historico completo (ativas + concluidas) vinculadas ao cliente via `lead_id`

## Alteracoes

### 1. Gestao de Tarefas - Filtro padrao para ativas (`src/pages/processos/Demandas.tsx`)

- Inicializar `filters` com `status` vazio (sem filtro), mas alterar a query no hook para excluir concluidas/canceladas por padrao
- Melhor abordagem: adicionar um filtro `excluirConcluidas` no `DemandasFilters` que por padrao esta ativo
- Na pratica: manter o filtro de status existente e apenas inicializar com `status: ''` (ja funciona assim). Mudar o hook `useDemandas` para, quando nenhum status for selecionado, excluir automaticamente concluidas e canceladas. Quando o usuario seleciona "Concluido" explicitamente, mostra apenas concluidas.

### 2. Hook `useDemandas.ts` - Comportamento padrao sem concluidas

- Quando `filters.status` estiver vazio/undefined: adicionar `.not('status', 'in', '("concluido","cancelado")')` para mostrar apenas ativas
- Quando `filters.status` tiver valor (ex: "concluido"): filtrar normalmente pelo status escolhido
- Isso garante que a listagem padrao mostra apenas tarefas ativas, mas o filtro permite ver concluidas

### 3. Novo Hook: `useDemandasByLead(leadId)` em `useDemandas.ts`

- Query que busca TODAS as demandas (ativas + concluidas) vinculadas a um `lead_id`
- Sem filtro de status -- mostra historico completo
- Ordenado por `created_at` descendente

### 4. Nova Aba "Tarefas" na Ficha do Cliente (`LeadDetailsDialog.tsx`)

- Adicionar 6a tab "Tarefas" no TabsList
- Importar e usar o novo hook `useDemandasByLead`
- Exibir lista com: titulo, status (badge colorido), advogada, data de conclusao (se concluida), prioridade
- Separar visualmente: tarefas ativas no topo, concluidas abaixo com estilo mais suave
- Clicar em uma tarefa pode abrir o `DemandaDetailsDialog`

### 5. Novo Componente: `ClienteTarefasTab.tsx` em `src/components/leads/`

Componente dedicado para a aba de tarefas do cliente:
- Recebe `leadId` como prop
- Usa `useDemandasByLead(leadId)` para buscar dados
- Exibe secao "Tarefas Ativas" e "Tarefas Concluidas" separadas
- Cada item mostra: titulo, status badge, advogada responsavel, prazo/data conclusao
- Estado vazio amigavel quando nao ha tarefas

## Arquivos Envolvidos

| Arquivo | Acao |
|---------|------|
| `src/hooks/useDemandas.ts` | Filtro padrao sem concluidas + novo hook `useDemandasByLead` |
| `src/components/leads/ClienteTarefasTab.tsx` | **Novo** - aba de tarefas do cliente |
| `src/components/leads/LeadDetailsDialog.tsx` | Adicionar aba "Tarefas" |

## Resultado

- Gestao de Tarefas mostra apenas tarefas ativas por padrao
- Filtro de status permite ver concluidas quando desejado
- Ficha do Cliente tem historico completo de todas as tarefas (ativas e concluidas)
- Tarefas concluidas ficam registradas e acessiveis na ficha do cliente para sempre

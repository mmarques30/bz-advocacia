

# Plano: Incluir prazos de tarefas (demandas) nos "Próximos Prazos" do Dashboard

## Problema
A seção "Próximos Prazos" no card "Processos e Prazos" do Dashboard só consulta a tabela `processos_prazos`. Tarefas criadas em `demandas_internas` com `data_limite` definida não aparecem ali.

## Alterações

### 1. `src/hooks/useDashboardCompleto.ts`
- Adicionar query paralela para buscar `demandas_internas` com `data_limite` nos próximos 14 dias e status `pendente` ou `em_andamento`
- Selecionar campos: `id, titulo, data_limite, prioridade, processo_id, lead_id`
- Mesclar os resultados de `processos_prazos` e `demandas_internas` em um único array `proximosPrazos`, ordenado por data
- Diferenciar a origem com um campo `origem: "prazo" | "tarefa"` no tipo `PrazoProximo`

### 2. `src/hooks/useDashboardCompleto.ts` (tipo `PrazoProximo`)
- Adicionar campo opcional `origem?: "prazo" | "tarefa"` ao interface `PrazoProximo`

### 3. `src/components/dashboard/VisaoOperacional.tsx`
- Exibir um indicador visual para diferenciar prazos processuais de tarefas (ex: badge "Tarefa" vs "Prazo" na linha do item)
- Manter o mesmo layout, apenas adicionar contexto de origem


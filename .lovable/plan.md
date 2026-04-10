

## Corrigir conexão entre tarefas, processos e clientes

### Problemas identificados

1. **`NewDemandaDialog`** recebe `defaultProcessoId` mas NÃO busca o `lead_id` do processo para preencher automaticamente. A tarefa é salva com `processo_id` correto, mas sem `lead_id`.

2. **`useDemandasByLead`** filtra apenas `.eq('lead_id', leadId)` — ignora tarefas vinculadas indiretamente via processos do cliente.

3. **`DemandaDetailsDialog`** (modo visualização) mostra o processo como texto estático sem link clicável para a ficha do processo.

### Alterações

**1. `src/components/demandas/NewDemandaDialog.tsx`**
- Quando `defaultProcessoId` é fornecido, buscar o `lead_id` do processo automaticamente via query
- Passar `lead_id` no payload do `createDemanda.mutate()`
- Isso garante que tarefas criadas dentro de um processo herdem o cliente

**2. `src/hooks/useDemandas.ts` — `useDemandasByLead`**
- Alterar a query para buscar tarefas onde `lead_id = leadId` OU onde `processo_id` pertence a um processo do cliente
- Usar uma abordagem em 2 passos: primeiro buscar os `processo_id` do cliente, depois buscar demandas com `.or('lead_id.eq.{leadId},processo_id.in.({ids})')`
- Incluir campo `processo` no select para exibir info do processo vinculado

**3. `src/components/leads/ClienteTarefasTab.tsx` — `TarefaItem`**
- Exibir badge com número/tipo do processo quando a tarefa tem `processo` vinculado
- Badge clicável que navega para `/dashboard/processos?id={processo_id}` (ou abre o detalhe do processo)

**4. `src/components/demandas/DemandaDetailsDialog.tsx` — modo visualização**
- Transformar o texto "Processo Relacionado" em link clicável quando há processo vinculado

### Arquivos editados
- `src/components/demandas/NewDemandaDialog.tsx`
- `src/hooks/useDemandas.ts`
- `src/components/leads/ClienteTarefasTab.tsx`
- `src/components/demandas/DemandaDetailsDialog.tsx`


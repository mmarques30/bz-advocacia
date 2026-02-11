
# Plano: Sistema de Tarefa-Mae com Subtarefas

## Resumo

Adicionar suporte a hierarquia de tarefas na tabela `demandas_internas`, permitindo criar uma tarefa principal ("tarefa-mae") com subtarefas vinculadas em sequencia. A tarefa-mae so pode ser concluida quando todas as subtarefas estiverem finalizadas.

## Exemplo de Uso

```text
Tarefa-Mae: "Peticao Inicial"
  |-- 1. Pesquisa jurisprudencia (estagiario)
  |-- 2. Redigir peticao (estagiario)
  |-- 3. Revisar (Juliana)
  |-- 4. Protocolar (Juliana)
```

Cada subtarefa tem seu proprio responsavel e advogada. A tarefa-mae acompanha o progresso geral.

## Alteracoes

### 1. Migracao de Banco de Dados

Adicionar duas colunas na tabela `demandas_internas`:

- `parent_id` (uuid, nullable, FK para si mesma) -- vincula subtarefa a tarefa-mae
- `ordem` (integer, nullable) -- define a sequencia das subtarefas

```sql
ALTER TABLE demandas_internas
  ADD COLUMN parent_id uuid REFERENCES demandas_internas(id) ON DELETE CASCADE,
  ADD COLUMN ordem integer;

CREATE INDEX idx_demandas_parent ON demandas_internas(parent_id);
```

RLS: as politicas existentes ja cobrem a nova coluna (mesma tabela).

### 2. Tipos TypeScript (`src/types/demandas.ts`)

- Adicionar `parent_id?: string | null` e `ordem?: number | null` na interface `Demanda`
- Adicionar campo opcional `subtarefas?: Demanda[]` para uso no frontend

### 3. Hook de Dados (`src/hooks/useDemandas.ts`)

- **Query principal**: filtrar apenas tarefas sem parent (`is.('parent_id', null)`) para evitar duplicacao na listagem
- **Nova query `useSubtarefas(parentId)`**: buscar subtarefas de uma tarefa-mae ordenadas por `ordem`
- **`useCreateDemanda`**: aceitar `parent_id` e `ordem` opcionais
- **Logica de conclusao**: ao atualizar status para "concluido" em tarefa-mae, verificar se todas subtarefas estao concluidas; se nao, bloquear e exibir alerta

### 4. Formulario de Criacao (`NewDemandaDialog.tsx`)

- Nenhuma mudanca no formulario de criacao inicial (tarefas-mae sao criadas como hoje)
- Subtarefas serao adicionadas a partir do dialog de detalhes

### 5. Dialog de Detalhes (`DemandaDetailsDialog.tsx`)

Maior mudanca -- adicionar secao de subtarefas quando a tarefa nao tem `parent_id`:

- **Secao "Subtarefas"**: lista as subtarefas ordenadas por `ordem`, com status, responsavel e advogada
- **Botao "Adicionar Subtarefa"**: abre um mini-formulario inline ou dialog simplificado para criar subtarefa vinculada (titulo, responsavel, advogada, prazo)
- **Barra de progresso**: mostra X de Y subtarefas concluidas
- **Bloqueio de conclusao**: se a tarefa tem subtarefas pendentes, desabilitar opcao "Concluido" no select de status com tooltip explicativo
- **Indicador visual**: badge "Tarefa-Mae" ou "Subtarefa de: [titulo]" conforme o caso
- Reordenacao via drag-and-drop (opcional, pode ser fase 2)

### 6. Novo Componente: `SubtarefasList.tsx`

Componente dedicado para exibir e gerenciar subtarefas dentro do dialog de detalhes:

- Lista com checkbox visual para marcar conclusao rapida
- Cada item mostra: ordem, titulo, advogada, responsavel, status
- Botao para adicionar nova subtarefa
- Indicador de progresso (barra)

### 7. Novo Componente: `NewSubtarefaDialog.tsx`

Dialog simplificado para criar subtarefa:

- Titulo (obrigatorio)
- Advogada Responsavel (obrigatorio)
- Responsavel (usuario do sistema)
- Data Limite
- Herda automaticamente: processo_id, lead_id, categoria da tarefa-mae
- Define `parent_id` e `ordem` automaticamente (proximo numero)

### 8. Tabela de Demandas (`DemandasTable.tsx`)

- Adicionar indicador visual (icone) para tarefas que possuem subtarefas
- Mostrar contagem de subtarefas (ex: "3/4 concluidas")
- Subtarefas nao aparecem na listagem principal (filtradas no hook)

### 9. Card do Kanban (`DemandaCard.tsx`)

- Exibir mini barra de progresso quando a tarefa tem subtarefas
- Mostrar contagem (ex: "2/4")

### 10. Aba Tarefas do Processo (`ProcessoTarefasTab.tsx`)

- Agrupar subtarefas sob a tarefa-mae na listagem
- Exibir de forma indentada ou colapsavel

## Arquivos Envolvidos

| Arquivo | Acao |
|---------|------|
| Migracao SQL | Adicionar `parent_id` e `ordem` |
| `src/types/demandas.ts` | Novos campos na interface |
| `src/hooks/useDemandas.ts` | Filtrar tarefas-mae, novo hook subtarefas, logica conclusao |
| `src/components/demandas/DemandaDetailsDialog.tsx` | Secao de subtarefas, bloqueio conclusao |
| `src/components/demandas/SubtarefasList.tsx` | **Novo** - lista e gestao de subtarefas |
| `src/components/demandas/NewSubtarefaDialog.tsx` | **Novo** - formulario de subtarefa |
| `src/components/demandas/DemandasTable.tsx` | Indicador de subtarefas |
| `src/components/demandas/DemandaCard.tsx` | Barra de progresso |
| `src/components/processos/tabs/ProcessoTarefasTab.tsx` | Agrupamento hierarquico |

## Fluxo de Trabalho

```text
1. Advogada cria tarefa-mae "Peticao Inicial"
2. Adiciona subtarefas em ordem:
   - Pesquisa jurisprudencia (resp: estagiario)
   - Redigir peticao (resp: estagiario)
   - Revisar (resp: advogada)
   - Protocolar (resp: advogada)
3. Estagiario conclui subtarefa 1 -> status volta para advogada ver
4. Estagiario conclui subtarefa 2 -> advogada recebe para revisao
5. Advogada conclui subtarefa 3 (revisao)
6. Advogada conclui subtarefa 4 (protocolo)
7. Todas subtarefas concluidas -> advogada pode concluir tarefa-mae
```

## Resultado

- Tarefas podem ter subtarefas vinculadas em sequencia
- Cada subtarefa tem seu responsavel e advogada
- Tarefa-mae so conclui quando todas subtarefas estiverem finalizadas
- Progresso visivel na tabela, kanban e detalhes
- Base para relatorios de produtividade por etapa

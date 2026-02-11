
# Plano: Conectar Tarefas aos Processos do Cliente

## Resumo

Ao abrir os detalhes de um processo (via ficha do cliente ou pagina de processos), exibir uma nova aba "Tarefas" com todas as demandas vinculadas ao processo, separadas por status (agendadas, concluidas), e adicionar um resumo de esforco por processo.

## Situacao Atual

- A tabela `demandas_internas` ja possui coluna `processo_id` (vinculo com processos)
- O dialog de detalhes do processo (`ProcessoDetailsDialog`) tem 7 abas, mas nenhuma de tarefas
- A aba "Andamentos" mostra timeline processual (audiencias, decisoes, etc.) -- isto e diferente de tarefas internas

## Alteracoes

### 1. Migracao de Banco de Dados

Adicionar coluna `horas_gastas` na tabela `demandas_internas` para registro de esforco por tarefa:

```sql
ALTER TABLE demandas_internas ADD COLUMN horas_gastas numeric DEFAULT 0;
```

### 2. Novo Componente: `ProcessoTarefasTab.tsx`

Criar `src/components/processos/tabs/ProcessoTarefasTab.tsx` que:

- Recebe `processoId` como prop
- Busca todas as demandas com `processo_id = processoId` via query direta ao banco
- Exibe 3 secoes:
  - **Tarefas Pendentes/Em Andamento**: cards com titulo, prioridade, responsavel, data limite
  - **Tarefas Concluidas**: lista colapsavel com data de conclusao
  - **Resumo de Esforco**: total de tarefas, concluidas, horas gastas (somatorio de `horas_gastas`)
- Botao "Nova Tarefa" que abre o `NewDemandaDialog` com `processo_id` pre-preenchido

### 3. Modificar `ProcessoDetailsDialog.tsx`

- Importar o novo `ProcessoTarefasTab`
- Adicionar aba "Tarefas" entre "Andamentos" e "Prazos"
- Ajustar grid de 7 para 8 colunas no `TabsList`

### 4. Modificar `ProcessoAndamentosTab.tsx`

- Melhorar visual da timeline com icones por tipo de andamento (audiencia, decisao, etc.)
- Adicionar indicador visual de timeline (linha vertical conectando os itens)

## Arquivos Envolvidos

| Arquivo | Acao |
|---------|------|
| Migracao SQL | Criar coluna `horas_gastas` |
| `src/components/processos/tabs/ProcessoTarefasTab.tsx` | Novo componente |
| `src/components/processos/ProcessoDetailsDialog.tsx` | Adicionar aba Tarefas |
| `src/components/processos/tabs/ProcessoAndamentosTab.tsx` | Melhorar visual timeline |

## Resultado

Ao clicar em um processo do cliente, o usuario vera:
- **Aba Andamentos**: timeline processual (audiencias, decisoes, peticoes)
- **Aba Tarefas** (nova): tarefas internas pendentes e concluidas vinculadas ao processo, com resumo de horas/esforco
- Separacao clara entre movimentacao processual e tarefas de trabalho interno

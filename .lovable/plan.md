

## Ajuste: Coluna `concluida_em` e exibição da data de conclusão

### Situação atual
- O status de conclusão no sistema usa o valor `concluido` (não `concluida`)
- Já existe `data_conclusao` (DATE) na tabela, preenchida pelo frontend na linha 161 do DemandaDetailsDialog
- O dialog de detalhes já exibe "Concluído em" usando `data_conclusao` (linhas 245-252)
- A tabela de demandas (DemandasTable) **não** exibe data de conclusão
- Os cards (DemandaCard, ClienteTarefasTab) **não** exibem data de conclusão com timestamp

### Plano

#### 1. Migração SQL
- Adicionar coluna `concluida_em TIMESTAMPTZ` à tabela `demandas_internas`
- Criar trigger que preenche `concluida_em = NOW()` quando status muda para `concluido` (valor correto no sistema) e limpa quando sai de `concluido`
- Backfill: preencher `concluida_em` para tarefas já concluídas usando `data_conclusao` ou `updated_at`

#### 2. Tipo Demanda (`src/types/demandas.ts`)
- Adicionar `concluida_em: string | null` à interface `Demanda`

#### 3. DemandasTable (`src/components/demandas/DemandasTable.tsx`)
- Adicionar coluna "Concluída em" na tabela, exibindo `concluida_em` formatado como DD/MM/YYYY para tarefas concluídas, "—" para as demais

#### 4. DemandaDetailsDialog (`src/components/demandas/DemandaDetailsDialog.tsx`)
- No modo visualização, substituir o bloco que mostra `data_conclusao` por `concluida_em` com formato DD/MM/YYYY HH:mm
- Mostrar o campo sempre (com "—" se não concluída) em vez de escondê-lo

#### 5. DemandaCard (`src/components/demandas/DemandaCard.tsx`)
- Para tarefas concluídas, exibir "Concluída em: DD/MM/YYYY" abaixo do prazo

#### 6. ClienteTarefasTab (`src/components/leads/ClienteTarefasTab.tsx`)
- Substituir `data_conclusao` por `concluida_em` na exibição

### Arquivos alterados
- Migração SQL (nova)
- `src/types/demandas.ts`
- `src/components/demandas/DemandasTable.tsx`
- `src/components/demandas/DemandaDetailsDialog.tsx`
- `src/components/demandas/DemandaCard.tsx`
- `src/components/leads/ClienteTarefasTab.tsx`




# Plano: Adicionar Campo "Advogada Responsavel" nas Tarefas

## Resumo

Adicionar um campo obrigatorio "Advogada Responsavel" com opcoes fixas (Juliana / Liziane) na tabela de demandas, permitindo rastreabilidade, filtragem e futuros relatorios de produtividade.

## Alteracoes

### 1. Migracao de Banco de Dados

Adicionar coluna `advogada_responsavel` na tabela `demandas_internas`:

```sql
ALTER TABLE demandas_internas
  ADD COLUMN advogada_responsavel text NOT NULL DEFAULT 'juliana'
  CHECK (advogada_responsavel IN ('juliana', 'liziane'));
```

### 2. Tipo TypeScript (`src/types/demandas.ts`)

- Adicionar tipo `AdvogadaResponsavel = 'juliana' | 'liziane'`
- Adicionar campo `advogada_responsavel` na interface `Demanda`
- Adicionar `ADVOGADA_LABELS` com os nomes formatados
- Adicionar `advogada_responsavel?: string` no `DemandasFilters`

### 3. Formulario de Criacao (`NewDemandaDialog.tsx`)

- Adicionar campo Select obrigatorio "Advogada Responsavel" com opcoes Juliana e Liziane
- Enviar o valor no `createDemanda.mutate()`

### 4. Formulario de Edicao (`DemandaDetailsDialog.tsx`)

- Exibir "Advogada Responsavel" na visualizacao (modo leitura)
- Adicionar Select no modo de edicao
- Enviar o valor no `updateDemanda.mutate()`

### 5. Tabela de Demandas (`DemandasTable.tsx`)

- Adicionar coluna "Advogada" na tabela entre "Prazo" e "Responsavel"

### 6. Filtros (`DemandasFilters.tsx`)

- Adicionar novo Select "Advogada" para filtrar por Juliana ou Liziane
- Ajustar o grid de 5 para 6 colunas

### 7. Hook de dados (`useDemandas.ts`)

- Adicionar filtro `advogada_responsavel` na query principal quando o filtro estiver ativo

### 8. Card do Kanban (`DemandaCard.tsx`)

- Exibir o nome da advogada no card

### 9. Aba Tarefas do Processo (`ProcessoTarefasTab.tsx`)

- Exibir advogada nas tarefas pendentes e concluidas

## Arquivos Envolvidos

| Arquivo | Acao |
|---------|------|
| Migracao SQL | Criar coluna `advogada_responsavel` |
| `src/types/demandas.ts` | Adicionar tipo e labels |
| `src/components/demandas/NewDemandaDialog.tsx` | Campo obrigatorio no formulario |
| `src/components/demandas/DemandaDetailsDialog.tsx` | Exibir e editar advogada |
| `src/components/demandas/DemandasTable.tsx` | Nova coluna na tabela |
| `src/components/demandas/DemandasFilters.tsx` | Novo filtro por advogada |
| `src/components/demandas/DemandaCard.tsx` | Exibir no card kanban |
| `src/hooks/useDemandas.ts` | Filtro no hook |
| `src/components/processos/tabs/ProcessoTarefasTab.tsx` | Exibir advogada |

## Resultado

- Toda tarefa tera obrigatoriamente uma advogada responsavel (Juliana ou Liziane)
- Filtros permitem ver tarefas por advogada
- Tabela e kanban exibem a advogada de cada tarefa
- Base pronta para relatorios de produtividade individual


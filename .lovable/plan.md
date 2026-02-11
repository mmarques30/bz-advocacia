
# Integrar Tarefas e Rotinas ao Calendario de Prazos

## Situacao Atual

O calendario (`/dashboard/processos/calendario`) exibe apenas **prazos processuais** da tabela `processos_prazos`. Tarefas (demandas internas) que possuem `data_limite` nao aparecem no calendario, e nao ha suporte para rotinas importantes.

## O que muda

### 1. Tarefas (demandas) refletidas no calendario

Buscar todas as demandas que possuem `data_limite` preenchida e exibi-las no calendario junto com os prazos, diferenciando visualmente por tipo (prazo vs tarefa).

### 2. Nova funcionalidade: Rotinas Importantes

Criar uma tabela `rotinas_calendario` para armazenar compromissos e rotinas que nao estao vinculados a processos. Exemplos: reunioes de equipe, prazos administrativos, compromissos recorrentes.

### 3. Calendario unificado com filtros por tipo

Adicionar filtros para o usuario escolher o que visualizar: Prazos, Tarefas, Rotinas ou Todos.

## Alteracoes

### Banco de dados

Nova tabela `rotinas_calendario`:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | PK |
| titulo | text | Descricao da rotina |
| data | date | Data do evento |
| horario | text | Horario opcional (ex: "14:00") |
| tipo | text | Categoria (reuniao, administrativo, pessoal, outro) |
| recorrente | boolean | Se repete |
| recorrencia | text | semanal, mensal, etc (quando recorrente) |
| prioridade | text | alta, media, baixa |
| status | text | pendente, concluido |
| observacoes | text | Notas adicionais |
| created_by | uuid | Quem criou |
| created_at | timestamptz | Data criacao |

RLS: usuarios autenticados podem gerenciar suas rotinas.

### Arquivos alterados

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/processos/Calendario.tsx` | Buscar demandas com data_limite e rotinas; unificar no calendario; adicionar filtros por tipo; botao "Adicionar Rotina" |
| `src/hooks/useRotinasCalendario.ts` | Novo hook para CRUD de rotinas |
| `src/components/processos/AddRotinaDialog.tsx` | Novo dialog para criar rotina |

### Logica do calendario unificado

O calendario passa a agrupar 3 fontes de dados por data:

- **Prazos** (processos_prazos) - marcados com indicador azul/vermelho conforme urgencia
- **Tarefas** (demandas_internas com data_limite) - marcados com indicador roxo
- **Rotinas** (rotinas_calendario) - marcados com indicador cinza

Filtros por abas no topo: Todos | Prazos | Tarefas | Rotinas

Ao clicar em um dia, o dialog mostra todos os itens daquele dia agrupados por tipo, com acoes (marcar como cumprido/concluido).

### Dialog de detalhes do dia

O dialog atual sera expandido para mostrar:
- Secao "Prazos Processuais" (com checkbox de cumprido)
- Secao "Tarefas" (com link para a demanda)
- Secao "Rotinas" (com checkbox de concluido e opcao de excluir)

### Botao de adicionar rotina

Botao "Adicionar Rotina" no header da pagina, abrindo um dialog com campos: titulo, data, horario, tipo, prioridade e observacoes.



## Corrigir nome hardcoded da advogada nas tarefas

### Problema
O nome "Eliziane Zembruski Taborda" está **hardcoded** em dois arquivos. Mesmo após alterar no cadastro (tabela profiles), as tarefas continuam exibindo o nome antigo porque usam constantes fixas no código, não o banco de dados.

### Alterações

**1. `src/types/demandas.ts` (linha 77)**
- Alterar `'Eliziane Zembruski Taborda'` → `'Eliziane Taborda'`

**2. `src/hooks/useProdutividadeEquipe.ts` (linha 195)**
- Alterar `'Eliziane Zembruski Taborda'` → `'Eliziane Taborda'`

Ambos os locais alimentam todos os componentes que exibem o nome da advogada responsável nas tarefas (tabela, kanban, detalhes, subtarefas, etc.).


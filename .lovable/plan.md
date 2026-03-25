

## Tornar nomes das advogadas dinâmicos (vindo do banco)

### Problema
O campo `advogada_responsavel` armazena chaves fixas (`'juliana'`, `'liziane'`), e o código usa `ADVOGADA_LABELS` com nomes hardcoded para exibição. Quando o nome é alterado no cadastro (profiles), as tarefas continuam mostrando o nome antigo.

### Solução
Criar um hook `useAdvogadaLabels` que busca os nomes reais da tabela `profiles` e constrói o mapeamento dinamicamente, substituindo o uso da constante hardcoded em todos os componentes.

### Alterações

**1. Criar `src/hooks/useAdvogadaLabels.ts`**
- Hook que consulta `profiles` buscando os perfis cujo `nome_completo` começa com "Juliana" e "Eliziane"
- Retorna um `Record<string, string>` no formato `{ juliana: 'Nome Real', liziane: 'Nome Real' }`
- Fallback para os valores atuais caso a query falhe

**2. Atualizar 6 componentes** que usam `ADVOGADA_LABELS`:
- `src/components/demandas/DemandaCard.tsx`
- `src/components/demandas/DemandasTable.tsx`
- `src/components/demandas/DemandaDetailsDialog.tsx`
- `src/components/demandas/SubtarefasList.tsx`
- `src/components/leads/ClienteTarefasTab.tsx`
- `src/components/processos/tabs/ProcessoTarefasTab.tsx`

Em cada um: importar `useAdvogadaLabels`, chamar o hook, e usar o mapa dinâmico no lugar de `ADVOGADA_LABELS`.

**3. `src/hooks/useProdutividadeEquipe.ts`**
- Substituir o `ADVOGADA_LABELS` local pela mesma query dinâmica de profiles (já busca profiles no mesmo hook).

A constante `ADVOGADA_LABELS` em `types/demandas.ts` permanece como fallback mas deixa de ser a fonte principal.


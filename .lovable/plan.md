

## Corrigir erro visual ao criar subtarefa

### Análise

Investiguei o fluxo completo: constraints do banco (`tipo`, `status`, `prioridade`, `advogada_responsavel` — todos permitem os valores enviados), RLS policies (INSERT e SELECT abertos para authenticated), triggers (apenas em UPDATE), e o código do formulário/mutation.

Não encontrei uma causa raiz óbvia que impeça a inserção. O cenário mais provável do "erro visual mesmo com sucesso" é:

1. **Form não reseta corretamente entre criações**: O `useForm` mantém `defaultValues` do mount inicial. Quando o dialog abre novamente, campos como `advogada_responsavel` podem estar stale se o `parentDemanda` mudou.

2. **Mutação com callback duplo**: O `useCreateSubtarefa` tem `onSuccess` global (toast.success) e o `NewSubtarefaDialog` passa `onSuccess` local (reset + close). Se o callback local lançar um erro implícito, o toast.success global pode não aparecer, deixando apenas um estado visual ambíguo.

3. **Possível re-render que dispara validação do formulário pai**: A invalidação de queries (`demandas`, `demandas-by-status`) pode causar re-render do `DemandaDetailsDialog`, que poderia disparar alguma validação visual.

### Correções

**1. `src/components/demandas/NewSubtarefaDialog.tsx`**
- Resetar form com valores corretos ao abrir (usar `useEffect` com `open` + `parentDemanda`)
- Mover `reset()` e `onOpenChange(false)` para o `onSettled` ou garantir execução segura
- Adicionar `try/catch` no callback `onSuccess` local para evitar erros silenciosos

**2. `src/hooks/useSubtarefas.ts`**
- Adicionar `console.error` no `onError` para diagnóstico
- Garantir que `onSuccess` e `onError` não conflitam (usar apenas um ponto de toast)

**3. `src/components/demandas/SubtarefasList.tsx`**
- Sem alteração necessária — renderização é defensiva com optional chaining

### Arquivos editados
- `src/components/demandas/NewSubtarefaDialog.tsx` (reset robusto ao abrir/fechar)
- `src/hooks/useSubtarefas.ts` (melhorar logging de erro)


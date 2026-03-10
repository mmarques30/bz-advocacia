

## Diagnóstico

O erro `null value in column "advogada_responsavel"` ocorre porque o campo `advogada_responsavel` não está incluído nos `defaultValues` do `useForm`. O `defaultValue="juliana"` no componente `Select` é apenas visual — o valor real no formulário permanece `undefined` se o usuário não interagir com o campo.

## Correção

**Arquivo:** `src/components/demandas/NewDemandaDialog.tsx` (linha 34-41)

Adicionar `advogada_responsavel: 'juliana'` aos `defaultValues` do `useForm`:

```typescript
defaultValues: {
  tipo: 'tarefa',
  prioridade: 'media',
  categoria: 'geral',
  advogada_responsavel: 'juliana',  // <-- adicionar
  processo_id: defaultProcessoId || '',
}
```

Isso é suficiente para resolver o erro. Nenhuma outra alteração necessária.



## Fix: Missing function declaration in useDespesas.ts

### Problem
Line 282 in `src/hooks/useDespesas.ts` starts with `const queryClient = useQueryClient();` but there's no function declaration wrapping it. The `despesaToTransacaoPayload` helper function closes at line 281, and what should be `export function useUpdateDespesa()` is missing its declaration — the body is just floating at module scope.

### Fix
**File**: `src/hooks/useDespesas.ts`, line 282

Insert the missing function declaration before `const queryClient`:

```typescript
// line 281: }  ← end of despesaToTransacaoPayload

export function useUpdateDespesa() {   // ← ADD THIS LINE
  const queryClient = useQueryClient();
  // ... rest stays the same
```

Single line insertion. The closing `}` at line 324 already matches this function.

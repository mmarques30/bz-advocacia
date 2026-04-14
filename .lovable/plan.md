

## Fix: Invalid date "2026-04-31" in despesas fixas

### Problem
Line 116 in `useDespesasFixas.ts` hardcodes `-31` as the last day of the month for the query filter. April only has 30 days, causing a Postgres error.

### Fix
**File**: `src/hooks/useDespesasFixas.ts`

Replace the hardcoded `-31` date range with a proper last-day-of-month calculation using `date-fns`'s `endOfMonth`:

```typescript
const ultimoDia = format(endOfMonth(hoje), 'yyyy-MM-dd');
```

Then use `ultimoDia` in the `.lte('data', ultimoDia)` filter instead of the string concatenation `${mesAtual}-31`.

Single file change, one line fix.


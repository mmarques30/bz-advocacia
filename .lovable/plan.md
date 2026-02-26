

# Fix: Produtividade Tab Error

## Problem
`useProdutividadeEquipe.ts` uses `profiles!demandas_internas_responsavel_id_fkey(id, nome_completo)` in two queries (lines 81, 97), but `demandas_internas` has no foreign key to `profiles`. This causes a PostgREST error.

## Solution
Remove the embedded join from both queries and rely on the existing `nameMap` (built from a separate profiles fetch on line 108) to resolve names. The code already has this fallback logic — the join is redundant and broken.

### File: `src/hooks/useProdutividadeEquipe.ts`
1. **Line 81**: Change `.select('*, responsavel:profiles!demandas_internas_responsavel_id_fkey(id, nome_completo)')` → `.select('*')`
2. **Line 97**: Same change
3. **Lines 147, 158, 187**: Replace `d.responsavel?.nome_completo?.split(' ')[0]` with `nameMap.get(d.responsavel_id)` since the join data won't exist anymore


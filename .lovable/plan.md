
# Fix: Produtividade tab crash — empty SelectItem value

## Problem
The error is **not** a database query issue. It's a React crash in `ProdutividadeDashboard.tsx` caused by `<SelectItem value="">Todos</SelectItem>`. Radix UI's `Select.Item` does not allow empty string values — it throws: *"A Select.Item must have a value prop that is not an empty string."*

This happens in two places:
- **Line 93**: `<SelectItem value="">Todos</SelectItem>` (Responsável filter)
- **Line 105**: `<SelectItem value="">Todos</SelectItem>` (Tipo filter)

## Fix
### File: `src/components/demandas/ProdutividadeDashboard.tsx`

1. **Line 93**: Change `value=""` to `value="all"`
2. **Line 105**: Change `value=""` to `value="all"`
3. **Line 46-47**: Update initial state from `''` to `'all'`:
   - `const [responsavelId, setResponsavelId] = useState<string>('all');`
   - `const [tipo, setTipo] = useState<string>('all');`
4. **Lines 50-52**: Update the filter prop mapping:
   - `responsavelId: responsavelId !== 'all' ? responsavelId : undefined`
   - `tipo: tipo !== 'all' ? tipo : undefined`

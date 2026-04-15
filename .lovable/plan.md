

## Fix: Missing closing brace in kpis.ts

The build error `src/hooks/financeiro/kpis.ts(231,1): error TS1005: '}' expected.` is caused by the `useReceitasMesAtual` function missing its closing `}`. The file ends at line 230 with `});` which closes the `useQuery` call, but the function body itself is never closed.

### Fix

**File**: `src/hooks/financeiro/kpis.ts`, line 230

Add a closing `}` after line 230:

```typescript
      .sort((a, b) => b.total - a.total),
      };
    },
  });
}  // ← ADD THIS closing brace for useReceitasMesAtual
```

Single character fix. No other files affected.


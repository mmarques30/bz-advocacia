

## Corrigir nomes das advogadas nas tarefas

### Problema
O campo `advogada_responsavel` armazena chaves fixas (`'juliana'`, `'liziane'`) e o mapeamento `ADVOGADA_LABELS` usa nomes abreviados ("Juliana", "Liziane") em vez dos nomes completos cadastrados no sistema:
- juliana → **Juliana Borges** (perfil real)
- liziane → **Eliziane Zembruski Taborda** (perfil real)

### Alterações

#### 1. `src/types/demandas.ts`
Atualizar `ADVOGADA_LABELS`:
```typescript
export const ADVOGADA_LABELS: Record<AdvogadaResponsavel, string> = {
  juliana: 'Juliana Borges',
  liziane: 'Eliziane Zembruski Taborda',
};
```

#### 2. `src/hooks/useProdutividadeEquipe.ts`
Atualizar o mapeamento local duplicado (linha 195):
```typescript
const ADVOGADA_LABELS: Record<string, string> = { juliana: 'Juliana Borges', liziane: 'Eliziane Zembruski Taborda' };
```

#### 3. `src/components/leads/ClienteTarefasTab.tsx`
Linha 48 exibe `demanda.advogada_responsavel` diretamente (mostra "juliana" cru). Corrigir para usar `ADVOGADA_LABELS`:
```typescript
import { ADVOGADA_LABELS } from "@/types/demandas";
// ...
<span>Resp: {ADVOGADA_LABELS[demanda.advogada_responsavel as keyof typeof ADVOGADA_LABELS] || demanda.advogada_responsavel || "—"}</span>
```

Todos os outros componentes (DemandaCard, DemandasTable, DemandaDetailsDialog, SubtarefasList, ProcessoTarefasTab) já usam `ADVOGADA_LABELS` e serão corrigidos automaticamente pela alteração no passo 1.


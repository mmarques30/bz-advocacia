

## Corrigir cálculo de tempo médio: usar `concluida_em` em vez de `data_conclusao`

### Arquivos afetados

#### 1. `src/hooks/useProdutividadeEquipe.ts` — 3 ocorrências
- **Linha 126-127**: KPI de tempo médio geral — trocar `d.data_conclusao` por `d.concluida_em`
- **Linha 152-153**: Tempo médio por executor — mesma troca

#### 2. `src/hooks/useDemandasPerformance.ts` — 1 ocorrência
- **Linha 87-89**: Cálculo de tempo médio — trocar `d.data_conclusao` por `d.concluida_em`

### Detalhe da mudança
Em cada ocorrência, substituir:
```typescript
if (d.data_conclusao && d.created_at) {
  const dias = differenceInDays(new Date(d.data_conclusao), ...
```
Por:
```typescript
if (d.concluida_em && d.created_at) {
  const dias = differenceInDays(new Date(d.concluida_em), ...
```

Nenhuma outra parte do sistema é alterada.


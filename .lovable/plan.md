
# Plano: Filtros dropdown em Produtividade

## Alterações

### 1. `src/components/demandas/ProdutividadeDashboard.tsx`
- Substituir o `Tabs` de período por um `Select` dropdown
- Adicionar `Select` de **Responsável** (populado via query de `profiles` ativos)
- Adicionar `Select` de **Tipo de Tarefa** (melhoria, bug, sugestao, tarefa — dos tipos existentes em `demandas`)
- Layout: uma linha horizontal com os 3 dropdowns lado a lado, estilo compacto
- Passar os novos filtros (`responsavelId`, `tipo`) ao hook

### 2. `src/hooks/useProdutividadeEquipe.ts`
- Expandir o tipo de parâmetros para aceitar `responsavelId?: string` e `tipo?: string`
- Aplicar `.eq('responsavel_id', ...)` e `.eq('tipo', ...)` nas queries de `concluidas` e `ativas` quando os filtros estiverem ativos
- Incluir os novos filtros na `queryKey`

### Layout dos filtros
```text
[Período ▼]  [Responsável ▼]  [Tipo de Tarefa ▼]
```
Todos com opção "Todos" como default.



## Remover card "Prazos processuais" do Dashboard

### Alteração em `src/pages/Dashboard.tsx`

1. Remover import do `DashboardPrazosCard`
2. Remover o card `<DashboardPrazosCard>` do grid (linhas ~146-153)
3. Ajustar o grid: o `DashboardTarefasUrgentesCard` passa a ocupar a largura toda (remover `lg:grid-cols-2` ou manter com outro card)

### Alteração em `src/hooks/useDashboardPrincipal.ts`

- Remover as queries de prazos do `Promise.all` (4 queries de contagem + 1 de próximos prazos)
- Remover tipos `PrazoUrgencia`, `PrazoProximoEnriquecido` e campos relacionados do retorno
- Remover lógica de enriquecimento de prazos

### Arquivo a excluir

- `src/components/dashboard/DashboardPrazosCard.tsx`

### O que NÃO muda

- A aba "Prazos" dentro dos detalhes de cada processo (`ProcessoPrazosTab`) permanece intacta
- O hook `useProcessoPrazos` e a tabela `processos_prazos` permanecem — são usados nos detalhes de processos
- O calendário de prazos continua funcionando


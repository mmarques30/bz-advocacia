

## Remover cards e ajustar layout da Linha 2 do Dashboard

### Alterações em `src/pages/Dashboard.tsx`

1. Remover import de `DashboardStatusProcessosCard`
2. Na Linha 2, mudar grid de `lg:grid-cols-3` para `lg:grid-cols-2`
3. Remover o bloco `<DashboardStatusProcessosCard ... />`
4. Os dois cards restantes (Distribuição + Leads Pendentes) ocuparão 50% cada


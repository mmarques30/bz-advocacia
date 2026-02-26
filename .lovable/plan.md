
# Plano: Mover gráfico "Evolução de Leads" para acima da "Visão Operacional"

## Alteração

### `src/pages/Dashboard.tsx`
- Mover o bloco `<LeadsEvolution>` (linhas 62-63) para antes do bloco `<VisaoOperacional>` (linha 52)
- Ordem final: Pendências → KPIs → **Evolução de Leads** → Visão Operacional (Processos + Pipeline)

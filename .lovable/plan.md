

# Plano: Remover Pipeline de Vendas e expandir card de Processos e Prazos

## Alterações

### 1. `src/components/dashboard/VisaoOperacional.tsx`
- Remover o componente `PipelineVendasCard` completamente (função e uso)
- Remover props `pipeline` e `leadsRecentes` da interface `VisaoOperacionalProps`
- Alterar o grid de `md:grid-cols-2` para coluna única (card ocupa largura total)
- Remover imports não utilizados (`Users`, `ESTAGIO_LABELS`)

### 2. `src/pages/Dashboard.tsx`
- Remover as props `pipeline` e `leadsRecentes` passadas ao `<VisaoOperacional>`


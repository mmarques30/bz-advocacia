

# Criar Menu Lateral "Relatorios"

## Objetivo

Criar um novo grupo no menu lateral chamado **Relatorios**, transferindo para ele os submenus:
- "Relatorios Vendas" (atualmente dentro de "Gestao de Clientes", rota `/dashboard/vendas/relatorios`)
- "Relatorios Financeiros" (atualmente dentro de "Financeiro", rota `/dashboard/financeiro/relatorios`)

As rotas e componentes continuam os mesmos -- apenas mudam de posicao no menu.

## Alteracoes

### 1. `src/components/AppSidebar.tsx`

- Importar icone `FileBarChart` do lucide-react (icone de relatorios)
- Remover "Relatorios Vendas" do submenu de "Gestao de Clientes" (linha 74)
- Remover "Relatorios Financeiros" do submenu de "Financeiro" (linha 105)
- Adicionar novo item no array `menuItems`, posicionado entre "Financeiro" e "Administrativo":

```
{
  title: "Relatorios",
  label: "Relatórios",
  icon: FileBarChart,
  submenu: [
    { title: "Vendas", url: "/dashboard/vendas/relatorios" },
    { title: "Financeiro", url: "/dashboard/financeiro/relatorios" },
  ]
}
```

### 2. `src/lib/pagePermissions.ts`

- Remover `gestao_clientes.relatorios` dos filhos de "Gestao de Clientes"
- Remover `financeiro.relatorios` dos filhos de "Financeiro"
- Adicionar novo grupo de permissao:

```
{
  key: "relatorios",
  label: "Relatórios",
  description: "Relatórios de vendas e financeiros",
  children: [
    { key: "relatorios.vendas", label: "Vendas", parent: "relatorios" },
    { key: "relatorios.financeiro", label: "Financeiro", parent: "relatorios" },
  ],
}
```

- Atualizar `ROUTE_TO_PERMISSION` para mapear as rotas para as novas chaves:
  - `/dashboard/vendas/relatorios` -> `relatorios.vendas`
  - `/dashboard/financeiro/relatorios` -> `relatorios.financeiro`

### 3. Sem alteracoes em rotas

As rotas em `App.tsx` permanecem identicas -- `/dashboard/vendas/relatorios` e `/dashboard/financeiro/relatorios` continuam apontando para os mesmos componentes (`RelatoriosVendas` e `FinanceiroRelatorios`). Apenas a navegacao do menu lateral muda.

## Resultado

O menu lateral passara a ter a seguinte estrutura:
1. Painel B&Z
2. Gestao de Vendas (Marketing, Leads)
3. Gestao de Clientes (Clientes, Documentos)
4. Gestao de Rotinas (Tarefas, Prazos)
5. Pesquisas (...)
6. Financeiro (Analises, Pagamentos)
7. **Relatorios** (Vendas, Financeiro) -- NOVO
8. Administrativo (...)


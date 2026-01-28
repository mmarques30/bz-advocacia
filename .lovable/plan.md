
# Plano: Reorganização do Menu Lateral - Separar Gestão de Vendas e Gestão de Clientes

## Visão Geral

O usuário solicitou reorganizar o menu lateral para:
1. **Criar nova aba "Gestão de Vendas"** contendo: Marketing, Análises e Leads
2. **Renomear a aba atual "Gestão de Vendas"** para **"Gestão de Clientes"**
3. A nova "Gestão de Clientes" ficará com: Documentos e Relatórios Vendas

## Estrutura Atual do Menu

```text
├── Painel B&Z (Dashboard)
├── Gestão de Vendas ← RENOMEAR para "Gestão de Clientes"
│   ├── Análises          ← MOVER para nova aba
│   ├── Marketing         ← MOVER para nova aba
│   ├── Leads e Clientes  ← MOVER para nova aba
│   ├── Documentos        ← MANTER
│   └── Relatórios Vendas ← MANTER
├── Gestão de Rotinas
├── Pesquisas
├── Financeiro
└── Administrativo
```

## Nova Estrutura Proposta

```text
├── Painel B&Z (Dashboard)
├── Gestão de Vendas ← NOVA ABA (ícone: TrendingUp)
│   ├── Marketing
│   ├── Análises
│   └── Leads e Clientes
├── Gestão de Clientes ← RENOMEADA (ícone: Users)
│   ├── Documentos
│   └── Relatórios Vendas
├── Gestão de Rotinas
├── Pesquisas
├── Financeiro
└── Administrativo
```

## Implementação

### Arquivo a Modificar
`src/components/AppSidebar.tsx`

### Mudanças Necessárias

**1. Adicionar novo ícone no import**
```typescript
import { 
  // ... existentes
  TrendingUp,  // Adicionar este ícone para a nova aba "Gestão de Vendas"
} from "lucide-react";
```

**2. Reorganizar o array `menuItems`**

```typescript
const menuItems: MenuItem[] = [
  { 
    title: "Analises", 
    label: "Painel B&Z",
    url: "/dashboard", 
    icon: LayoutDashboard 
  },
  // NOVA ABA: Gestão de Vendas
  {
    title: "GestaoVendas",
    label: "Gestão de Vendas",
    icon: TrendingUp,  // Ícone de gráfico ascendente
    submenu: [
      { title: "Marketing", url: "/dashboard/vendas/meta-ads" },
      { title: "Análises", url: "/dashboard/vendas/analises" },
      { title: "Leads e Clientes", url: "/dashboard/leads" },
    ]
  },
  // ABA RENOMEADA: Gestão de Clientes (antes era "Gestão de Vendas")
  {
    title: "Clientes",
    label: "Gestão de Clientes",
    icon: Users,  // Mantém o ícone de usuários
    submenu: [
      { title: "Documentos", url: "/dashboard/documentos" },
      { title: "Relatórios Vendas", url: "/dashboard/vendas/relatorios" },
    ]
  },
  // ... restante do menu permanece igual
];
```

## Resumo Visual da Mudança

| Antes | Depois |
|-------|--------|
| Gestão de Vendas (Users) | Gestão de Vendas (TrendingUp) - **NOVA** |
| ├── Análises | ├── Marketing |
| ├── Marketing | ├── Análises |
| ├── Leads e Clientes | └── Leads e Clientes |
| ├── Documentos | Gestão de Clientes (Users) - **RENOMEADA** |
| └── Relatórios Vendas | ├── Documentos |
| | └── Relatórios Vendas |

## Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/components/AppSidebar.tsx` | Adicionar import do `TrendingUp`, criar nova aba "Gestão de Vendas", renomear aba atual para "Gestão de Clientes" |

## Resultado Esperado

1. **Nova aba "Gestão de Vendas"** aparece no menu com ícone de gráfico (TrendingUp)
2. **"Gestão de Clientes"** fica abaixo com ícone de usuários (Users)
3. Sub-itens redistribuídos conforme especificado
4. Navegação e rotas permanecem funcionais (nenhuma URL mudou)

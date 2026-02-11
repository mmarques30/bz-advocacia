

# Unificar Marketing e Análises em uma única página com abas

## Situação Atual

- **Marketing** (`/dashboard/vendas/meta-ads`): KPIs de investimento, gráfico de evolução, tabela de campanhas
- **Análises** (`/dashboard/vendas/analises`): Análise de conversão e performance por canal (página separada no menu)
- Redundância: ambas tratam do mesmo funil de vendas/marketing, mas em páginas distintas

## O que muda

### 1. Página Marketing unificada com abas

A página `/dashboard/vendas/meta-ads` passa a ter 3 abas:

| Aba | Conteúdo |
|-----|----------|
| **Resumo** | Card de ROI (investimento, CPL, leads, ROI%) + KPIs atuais + gráfico de evolução + campanhas |
| **Análise de Conversão** | Funil detalhado, taxa de conversão, tempo por estágio, conversão por origem (conteúdo atual de Análises) |
| **Performance por Canal** | Distribuição de leads, evolução por canal, tabela comparativa, insights automáticos (conteúdo atual de Análises) |

### 2. Card de ROI (novo)

Novo card no topo da aba "Resumo" com 4 métricas em destaque:

- **Investimento Total** (soma do gasto no período)
- **Leads Gerados** (total de leads)
- **CPL** (Custo por Lead)
- **ROI Estimado** (baseado em faturamento vs investimento, quando disponível)

### 3. Navegação simplificada

- Remover "Análises" como item separado do submenu "Gestão de Vendas"
- Menu fica: Marketing | Leads (em vez de Marketing | Análises | Leads)
- Rota `/dashboard/vendas/analises` redireciona para `/dashboard/vendas/meta-ads` (compatibilidade)

## Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/vendas/MetaAds.tsx` | Reescrever com Tabs (Resumo, Conversão, Canais) + card ROI |
| `src/components/AppSidebar.tsx` | Remover "Análises" do submenu de Gestão de Vendas |
| `src/App.tsx` | Redirecionar `/dashboard/vendas/analises` para `/dashboard/vendas/meta-ads` |

## Resultado

Uma única página "Marketing" com tudo o que o gestor precisa: resumo rápido de ROI, análises de conversão e performance por canal, tudo acessível por abas sem sair da página.


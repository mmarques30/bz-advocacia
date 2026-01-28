
# Plano: Reestruturação do Painel B&Z

## Objetivo
Remover o card "Receita do Mês" e reorganizar o dashboard para apresentar informações mais harmônicas e relevantes para iniciar o dia de trabalho.

## Análise da Estrutura Atual

O dashboard atual possui:
1. **Filtros de período** (7d, 30d, 90d)
2. **Cards de Pendências do Usuário** (3 cards: Tarefas, Pagamentos, Processos em Atraso)
3. **Grid de 6 KPIs**:
   - Total de Leads
   - Taxa de Conversão
   - Novos Clientes
   - Processos Ativos
   - **Receita do Mês** (a ser removido)
   - Taxa de Inadimplência
4. **Gráfico de Evolução de Leads** (largura total)

## Proposta de Nova Estrutura

A nova estrutura foca em informações operacionais para o início do dia:

```text
┌──────────────────────────────────────────────────────────────────────────┐
│  FILTROS DE PERÍODO                                                       │
├──────────────────────────────────────────────────────────────────────────┤
│  SEÇÃO 1: Suas Pendências (3 cards interativos)                          │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐              │
│  │ Tarefas        │  │ Pagamentos     │  │ Processos      │              │
│  │ Pendentes      │  │ Pendentes      │  │ em Atraso      │              │
│  └────────────────┘  └────────────────┘  └────────────────┘              │
├──────────────────────────────────────────────────────────────────────────┤
│  SEÇÃO 2: Visão Rápida (5 KPIs em grid responsivo)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ Leads    │ │ Taxa     │ │ Novos    │ │Processos │ │ Prazos   │        │
│  │ Ativos   │ │ Conversão│ │ Clientes │ │ Ativos   │ │ Próximos │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
├──────────────────────────────────────────────────────────────────────────┤
│  SEÇÃO 3: Evolução de Leads (gráfico largura total)                      │
│  ┌────────────────────────────────────────────────────────────────┐      │
│  │  [Gráfico de área comparativo]                                 │      │
│  └────────────────────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────────────────┘
```

## Mudanças Propostas

### 1. Remover "Receita do Mês" e "Taxa de Inadimplência"
- Esses indicadores financeiros já estão disponíveis no módulo Financeiro
- O dashboard deve focar em métricas operacionais do dia

### 2. Adicionar "Prazos Próximos"
- Novo KPI mostrando quantidade de prazos judiciais vencendo nos próximos 7 dias
- Usa dados da tabela `processos_prazos` com status "pendente"
- Icone: `Calendar` (lucide-react)

### 3. Reorganizar Grid de KPIs para 5 Colunas
- Desktop (lg): 5 colunas
- Tablet (md): 3 colunas (primeira linha com 3, segunda com 2)
- Mobile: 2 colunas (com último item centralizado)

### 4. Ordem dos KPIs (prioridade operacional)
1. **Total de Leads** - Entrada do funil
2. **Taxa de Conversão** - Eficiência comercial
3. **Novos Clientes** - Resultado do período
4. **Processos Ativos** - Carga de trabalho atual
5. **Prazos Próximos** - Urgências da semana (NOVO)

## Detalhamento Técnico

### Arquivo: `src/hooks/useDashboardData.ts`
Adicionar nova query para prazos próximos:

```typescript
// Dentro de useKPIs
const { count: prazosProximos } = await supabase
  .from('processos_prazos')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'pendente')
  .gte('data_prazo', now.toISOString())
  .lte('data_prazo', sevenDaysFromNow.toISOString());
```

### Arquivo: `src/types/dashboard.ts`
Atualizar interface KPI:

```typescript
export interface KPI {
  totalLeads: number;
  taxaConversao: number;
  novosClientes: number;
  processosAtivos: number;
  prazosProximos: number; // NOVO - substitui receitaMes
  // receitaMes REMOVIDO
  // taxaInadimplencia REMOVIDO
}
```

### Arquivo: `src/pages/Dashboard.tsx`
Atualizar grid de KPIs:

```tsx
{/* Grid de 5 KPIs */}
<div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
  <KPICard
    title="Total de Leads"
    value={kpis?.totalLeads || 0}
    icon={Users}
    loading={kpisLoading}
  />
  <KPICard
    title="Taxa de Conversão"
    value={kpis?.taxaConversao || 0}
    icon={TrendingUp}
    format="percentage"
    loading={kpisLoading}
  />
  <KPICard
    title="Novos Clientes"
    value={kpis?.novosClientes || 0}
    icon={UserPlus}
    loading={kpisLoading}
  />
  <KPICard
    title="Processos Ativos"
    value={kpis?.processosAtivos || 0}
    icon={Briefcase}
    loading={kpisLoading}
  />
  <KPICard
    title="Prazos Próximos"
    value={kpis?.prazosProximos || 0}
    icon={Calendar}
    loading={kpisLoading}
  />
</div>
```

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/types/dashboard.ts` | Atualizar interface KPI |
| `src/hooks/useDashboardData.ts` | Remover receitaMes e inadimplência, adicionar prazosProximos |
| `src/pages/Dashboard.tsx` | Atualizar grid e cards |

## Benefícios da Nova Estrutura

1. **Foco Operacional**: Dashboard orientado para ação imediata
2. **Menos Sobrecarga Visual**: 5 KPIs ao invés de 6, mais limpo
3. **Informações Complementares**: Prazos judiciais são críticos para escritórios de advocacia
4. **Dados Financeiros Separados**: Módulo Financeiro já possui visão detalhada de receitas
5. **Consistência**: Segue o padrão visual existente dos cards

## Responsividade

| Breakpoint | Layout KPIs |
|------------|-------------|
| Mobile (<640px) | 2 colunas |
| Tablet (640-1024px) | 3 colunas |
| Desktop (>1024px) | 5 colunas |



## Reformulação do Dashboard Principal

### Visão Geral
Reescrever o Dashboard.tsx e o hook useDashboardPrincipal.ts para implementar o novo layout com 6 KPIs, 2 linhas de cards e dados totalmente dinâmicos. Manter a saudação existente, preservar todas as rotas e navegação.

### Arquivos a criar/modificar

#### 1. `src/hooks/useDashboardPrincipal.ts` — Reescrever
Expandir o hook para buscar os dados adicionais necessários:
- **Tarefas ativas**: count de `demandas_internas` com status != 'concluido', count de urgentes
- **Leads no mês**: count de `contact_submissions` criados no mês corrente, count sem follow-up (ultimo_contato_em < 2 dias atrás)
- **Clientes ativos**: count de `contact_submissions` com estagio = 'fechado', count dos novos este mês
- **Processos concluídos no mês**: count de processos com status concluido e data_inicio no mês corrente
- **Distribuição por responsável** (processos e tarefas): agregar por `responsavel_id` de processos e demandas, buscar nomes de `profiles`
- **Leads pendentes por estágio**: agrupar contact_submissions por estagio (excluindo 'fechado')
- **Leads sem follow-up**: buscar leads com ultimo_contato_em > 2 dias, mostrar nome + origem + dias parado
- **Taxa de conversão**: fechados / total no mês
- **Tarefas urgentes**: buscar demandas_internas com prioridade alta/urgente e data_limite próxima, enriquecer com nome do responsável de profiles

Novas interfaces exportadas para cobrir todos os dados dos cards.

#### 2. `src/pages/Dashboard.tsx` — Reescrever
Nova estrutura:

```text
┌─────────────────────────────────────────────────────┐
│  Saudação + Data (manter existente, ajustar texto)  │
├──┬──┬──┬──┬──┬──────────────────────────────────────┤
│P1│P2│P3│P4│P5│P6│  ← KPI Strip (6 células, borda)  │
├──────────────────┬──────────────────────────────────┤
│ Prazos           │ Tarefas urgentes                 │
│ processuais      │ (lista com badges)               │
│ (2x2 + lista)   │                                   │
├──────────┬───────┴──┬───────────────────────────────┤
│Distrib.  │ Leads    │ Status processos              │
│responsável│pendentes │ Sem movimentação              │
└──────────┴──────────┴───────────────────────────────┘
```

#### 3. `src/components/dashboard/DashboardKPIStrip.tsx` — Criar
Componente de barra única com 6 células divididas por bordas internas. Cada célula: título, valor grande, contexto com cor opcional.

#### 4. `src/components/dashboard/DashboardPrazosCard.tsx` — Criar
Card esquerdo da Linha 1: grade 2x2 de urgência + lista de próximos vencimentos com dots coloridos. Link "Ver calendário →".

#### 5. `src/components/dashboard/DashboardTarefasUrgentesCard.tsx` — Criar
Card direito da Linha 1: lista de tarefas urgentes/alta prioridade com dot, título, responsável (dinâmico de profiles), badge de prioridade. Link "Ver todas →".

#### 6. `src/components/dashboard/DashboardDistribuicaoCard.tsx` — Criar
Card 1 da Linha 2: seção Processos + seção Tarefas ativas, com avatar iniciais + nome + barra + contagem. Membros dinâmicos de profiles.

#### 7. `src/components/dashboard/DashboardLeadsPendentesCard.tsx` — Criar
Card 2 da Linha 2: funil por estágio (4 células), lista sem follow-up, taxa de conversão. Link "Ver todos →".

#### 8. `src/components/dashboard/DashboardStatusProcessosCard.tsx` — Criar
Card 3 da Linha 2: card superior (3 blocos coloridos) + card inferior (sem movimentação com alerta âmbar).

#### Componentes removidos (não mais usados pelo Dashboard)
- `DashboardKPICard.tsx` — pode ser mantido se usado em outro lugar, mas não será importado pelo Dashboard
- `DashboardPrazosPanel.tsx` — substituído por DashboardPrazosCard
- `DashboardRightPanel.tsx` — substituído pelos novos cards

### Regras de implementação
- Todos os nomes de responsáveis buscados dinamicamente de `profiles` — zero hardcoded
- Cards com `bg-white border rounded-xl p-4`
- Badges: vermelho (urgente/atrasado), âmbar (atenção), verde (ok), azul (informativo)
- Estados vazios com mensagem centralizada
- Clique em prazo abre ProcessoDetailsDialog (já existente)
- Clique em tarefa abre DemandaDetailsDialog
- React Query para todos os dados, refetch a cada 5 minutos


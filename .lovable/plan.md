

## Redesenho Completo do Dashboard + Fix de Build Errors

### Parte 0 — Fix de Build Errors (pré-requisito)

**`useAdvogadas.ts`** (line 57): The `.eq("is_advogada", true)` causes TS2589 because the column doesn't exist in generated types. Fix: cast the query builder through `as any` for that specific filter call, keeping the runtime behavior intact.

**`useTransacoesFinanceiras.ts`** (lines ~294-300): The select includes `responsavel_profile_id` and FK join `responsavel:profiles!responsavel_profile_id(...)` which don't exist in types. Fix: remove these from the select string, use only the legacy columns (`subcategoria_codigo`, `categoria_codigo`, `descricao`, `valor`). The fallback logic already handles this — just make the primary query match what the DB actually has.

---

### Parte 1 — New hook: `useDashboardVisual.ts`

Separate hook to fetch data not currently in `useDashboardPrincipal`:

- **Receita do mês**: sum from `transacoes_financeiras` where `tipo_codigo = 'receita'` and `data_competencia` in current month
- **Tarefas concluídas na semana**: count `demandas_internas` where `status = 'concluido'` and `concluida_em >= startOfWeek`
- **Tarefas pendentes**: count where `status = 'pendente'`
- **Tarefas atrasadas**: count where `data_limite < hoje` and status not concluido/cancelado
- **Demandas por responsável x prioridade**: for heatmap — group `demandas_internas` by `advogada_responsavel` and `prioridade`
- **Prazos breakdown**: atrasados / hoje / esta semana / 30 dias from `processos_prazos`
- **Próximos 3 prazos**: with join to `processos` for client name
- **Aniversariantes do mês**: `contact_submissions` where `estagio = 'fechado'`, filter by month of `data_nascimento` client-side
- **Profiles list**: fetch all active profiles for heatmap rows

---

### Parte 2 — New Dashboard Components (7 files)

| Component | Description |
|---|---|
| `DashboardKPIStripV2.tsx` | 6 cells with 3px colored top accent (blue/red/amber/green/gold/purple), conditional number colors |
| `DashboardSituacaoTarefasCard.tsx` | 2x2 colored blocks (Urgentes/Atrasadas/Concluídas/Pendentes) + weekly progress bar + "Abrir tarefas →" link |
| `DashboardCargaEquipeCard.tsx` | Heatmap table: rows = team members, cols = priority levels + total. Cell color by intensity. Legend below. |
| `DashboardPrazosCard.tsx` | 2x2 urgency grid + vertical timeline (border-left) with next 3 deadlines. "Calendário →" link. |
| `DashboardEvolucaoProcessosV2.tsx` | Grouped bar chart (green=opened, red=closed) with custom HTML legend. Uses existing `useProcessosEvolucao`. |
| `DashboardPipelineLeadsCard.tsx` | Horizontal proportional bars (funnel), conversion progress bar, stale lead alert. "Ver leads →" link. |
| `DashboardAniversariantesCard.tsx` | Today banner with WhatsApp button, monthly list with avatars/badges, empty state with Cake icon. |

---

### Parte 3 — Dashboard Layout

```text
┌───────────────────────────────────────────────────┐
│ Saudação serif dourada          │  Alerta crítico │
├───────────────────────────────────────────────────┤
│ KPI Strip V2: 6 cells com acento colorido         │
├────────────┬────────────┬─────────────────────────┤
│ Situação   │ Carga da   │ Prazos processuais      │
│ tarefas    │ equipe     │ (2x2 + timeline)        │
├────────────┴────────────┼─────────────────────────┤
│ Evolução processos      │ Pipeline leads           │
│ (barras agrupadas)      │ (funil + conversão)      │
├─────────────────────────┴─────────────────────────┤
│              Aniversariantes do mês                │
└───────────────────────────────────────────────────┘
```

### Parte 4 — Interactive behavior

- Click on urgency blocks → navigate with query params (e.g. `/dashboard/processos/demandas?prioridade=urgente`)
- Click "Atrasados" in prazos → `/dashboard/processos/calendario`
- All header links navigate to corresponding modules
- Zero-value blocks render in neutral background-secondary
- "Enviar parabéns" button on birthday banner opens WhatsApp template

---

### Files Summary

| Action | File |
|---|---|
| Fix | `src/hooks/useAdvogadas.ts` |
| Fix | `src/hooks/useTransacoesFinanceiras.ts` |
| Create | `src/hooks/useDashboardVisual.ts` |
| Create | `src/components/dashboard/DashboardKPIStripV2.tsx` |
| Create | `src/components/dashboard/DashboardSituacaoTarefasCard.tsx` |
| Create | `src/components/dashboard/DashboardCargaEquipeCard.tsx` |
| Create | `src/components/dashboard/DashboardPrazosCard.tsx` |
| Create | `src/components/dashboard/DashboardEvolucaoProcessosV2.tsx` |
| Create | `src/components/dashboard/DashboardPipelineLeadsCard.tsx` |
| Create | `src/components/dashboard/DashboardAniversariantesCard.tsx` |
| Rewrite | `src/pages/Dashboard.tsx` |

No schema changes. Old dashboard components preserved as files but no longer imported.


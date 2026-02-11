
# Plano: Dashboard de Produtividade Individual

## Resumo

Substituir completamente o conteudo da aba "Alertas" em Gestao de Tarefas por um dashboard focado em produtividade individual da equipe. O componente `AlertasUnificados` sera reescrito para exibir metricas de produtividade por membro.

## O que sera removido

- Cards de "Alertas Importantes", "Minhas Demandas" e "Proximos 7 Dias"
- Esses dados ja estao cobertos pelos filtros da propria listagem de tarefas

## Novo Layout do Dashboard

```text
+------------------------------------------------------------+
| [Filtro de Periodo: Este Mes | Ultimos 30d | 90d | Todos]  |
+------------------------------------------------------------+
| KPI 1         | KPI 2          | KPI 3       | KPI 4       |
| Total         | Concluidas     | Tempo Medio | Taxa        |
| Concluidas    | no Periodo     | Conclusao   | Conclusao   |
+------------------------------------------------------------+
| Ranking por Executor              | Distribuicao de Carga  |
| (quem executou - tabela)          | (grafico barras horiz) |
|                                   |                        |
| Nome | Concl | Pendentes | Media  |                        |
+------------------------------------------------------------+
| Tarefas por Advogada Responsavel  | Evolucao Mensal        |
| (grafico pizza/donut)             | (grafico barras)       |
+------------------------------------------------------------+
```

## Alteracoes Detalhadas

### 1. Renomear aba "Alertas" para "Produtividade" (`Demandas.tsx`)

- Mudar o texto da tab de "Alertas" para "Produtividade"
- Mudar o icone de AlertTriangle para BarChart3

### 2. Reescrever `AlertasUnificados.tsx` -> `ProdutividadeDashboard.tsx`

Novo componente completo com:

**Filtro de periodo** no topo:
- Este Mes (padrao), Ultimos 30 dias, Ultimos 90 dias, Todos

**4 KPI Cards** em grid:
- Total de tarefas concluidas no periodo
- Tarefas concluidas por advogada (maior numero)
- Tempo medio de conclusao (dias)
- Taxa de conclusao (%)

**Ranking por Executor** (card com tabela):
- Tabela mostrando cada membro da equipe
- Colunas: Nome, Concluidas, Pendentes, Em Andamento, Tempo Medio
- Ordenado por concluidas (maior primeiro)
- Dados vem do campo `responsavel_id` (quem executou)

**Distribuicao de Carga de Trabalho** (card com grafico):
- Grafico de barras horizontal empilhado (reaproveita estilo do DistribuicaoResponsavel atual)
- Mostra pendentes, em andamento e concluidas por pessoa

**Tarefas por Advogada Responsavel** (card com grafico):
- Grafico de barras agrupado mostrando Juliana vs Liziane
- Barras: Concluidas, Pendentes, Em Andamento

**Evolucao Mensal** (card com grafico):
- Grafico de barras vertical com os ultimos 6 meses
- Barras: tarefas concluidas por mes

### 3. Novo Hook: `useProdutividadeEquipe.ts`

Hook dedicado que busca e calcula todas as metricas:

- Busca demandas concluidas no periodo selecionado
- Busca demandas ativas (pendentes/em andamento)
- Agrupa por `responsavel_id` (executor) e por `advogada_responsavel` (advogada)
- Calcula tempo medio de conclusao por pessoa
- Calcula evolucao mensal (ultimos 6 meses)
- Aceita parametro de periodo para filtrar

Retorna:
```text
{
  kpis: { totalConcluidas, tempoMedio, taxaConclusao, topExecutor }
  rankingExecutores: [{ nome, concluidas, pendentes, emAndamento, tempoMedio }]
  distribuicaoCarga: [{ nome, pendentes, emAndamento, concluidas }]
  porAdvogada: [{ advogada, concluidas, pendentes, emAndamento }]
  evolucaoMensal: [{ mes, concluidas }]
}
```

### 4. Componentes auxiliares removidos/mantidos

- `PerformanceIndicators.tsx` e `DistribuicaoResponsavel.tsx` deixam de ser usados (substituidos pelo novo dashboard)
- O hook `useDemandasPerformance.ts` sera substituido pelo novo `useProdutividadeEquipe.ts`

## Arquivos Envolvidos

| Arquivo | Acao |
|---------|------|
| `src/pages/processos/Demandas.tsx` | Renomear tab "Alertas" para "Produtividade", trocar icone |
| `src/components/demandas/AlertasUnificados.tsx` | **Reescrever** completamente como `ProdutividadeDashboard` |
| `src/hooks/useProdutividadeEquipe.ts` | **Novo** - hook com todas as metricas de produtividade |
| `src/components/demandas/PerformanceIndicators.tsx` | Removido (absorvido pelo novo dashboard) |
| `src/components/demandas/DistribuicaoResponsavel.tsx` | Removido (absorvido pelo novo dashboard) |

## Resultado

- Dashboard focado em produtividade individual com metricas claras
- Visibilidade de quem esta executando mais tarefas
- Comparacao entre advogadas responsaveis
- Tempo medio de conclusao por pessoa
- Evolucao temporal para acompanhar tendencias
- Filtro de periodo para analises flexiveis

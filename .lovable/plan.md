

# Plano: Reformular Painel de Produtividade

## Estrutura nova (de cima para baixo)

### 1. KPIs (4 cards) — manter, mas ajustar
- Concluidas, Tempo Medio, Taxa Conclusao, Top Executor (com medalha)

### 2. Card "Pendentes Aprovação das Advogadas" (NOVO)
- Buscar demandas com `status = 'em_andamento'` que estão aguardando conclusão (só advogadas podem concluir)
- Agrupar por advogada_responsavel (Juliana / Liziane)
- Mostrar contagem e lista resumida dos títulos pendentes
- Destaque visual com ícone de alerta

### 3. Tabela Ranking com Medalhas (reformulada)
- Posição com medalha (ouro, prata, bronze para top 3, número para demais)
- Colunas: Posição, Nome, Concluídas, Pendentes, Em Andamento, Tempo Médio
- Full width (sem o gráfico de Distribuição de Carga ao lado — redundante)

### 4. Gráfico de Barras + Linha — Volume de Trabalho (substituir os 2 gráficos antigos)
- Um único gráfico ComposedChart full width
- Barras empilhadas: Concluídas + Em Andamento + Pendentes (por mês, evolução mensal)
- Linha: total de demandas por mês (volume total)
- Remover gráfico "Por Advogada" e "Evolução Mensal" separados

## Alterações nos arquivos

### `src/hooks/useProdutividadeEquipe.ts`
- Adicionar ao retorno: `pendentesAprovacao` — array de demandas `em_andamento` agrupadas por `advogada_responsavel`
- Adicionar dados de evolução mensal expandidos: incluir `emAndamento` e `pendentes` por mês (além de `concluidas`)

### `src/components/demandas/ProdutividadeDashboard.tsx`
- Reescrever layout:
  1. Filtro de período (manter)
  2. KPIs (manter)
  3. Card "Pendentes Aprovação" com Badge por advogada
  4. Tabela Ranking com medalhas (🥇🥈🥉 + números)
  5. ComposedChart com Bar+Line para volume mensal
- Remover: gráfico Distribuição de Carga, gráfico Por Advogada (redundantes)



Objetivo: fazer os nomes exibidos nos selects de tarefas seguirem o cadastro atual (profiles), sem quebrar os valores salvos em `advogada_responsavel` (`juliana`/`liziane`).

1) Identificar e substituir todos os pontos ainda hardcoded nos formulários
- Ajustar estes arquivos que ainda renderizam labels fixas:
  - `src/components/demandas/NewDemandaDialog.tsx`
  - `src/components/demandas/DemandaDetailsDialog.tsx` (modo edição)
  - `src/components/demandas/NewSubtarefaDialog.tsx`
  - `src/components/demandas/DemandasFilters.tsx`
- Em todos, trocar `SelectItem` com texto fixo (“Juliana”, “Liziane”) por labels vindas de `useAdvogadaLabels()`.

2) Padronizar a fonte dos labels
- Reusar `useAdvogadaLabels` como única fonte de exibição dos nomes.
- Manter `value="juliana"` e `value="liziane"` nos selects (para não afetar registros existentes e filtros no banco).
- Só o texto exibido muda dinamicamente para o nome atual cadastrado.

3) Fortalecer o fallback do hook (para evitar regressão)
- Garantir fallback consistente para quando a query ainda não carregou:
  - exibir `ADVOGADA_LABELS` temporariamente.
- (Ajuste recomendado) tornar a resolução menos frágil do que “começa com nome”, para evitar voltar ao nome antigo se o cadastro mudar bastante.

4) Validação funcional após ajuste
- Fluxo 1: abrir “Nova Demanda” e confirmar que “Advogada Responsável” mostra os nomes atualizados do cadastro.
- Fluxo 2: abrir “Detalhes da Demanda” em edição e validar o mesmo select.
- Fluxo 3: criar “Nova Subtarefa” e validar o select.
- Fluxo 4: abrir filtros de demandas e validar nomes atualizados no filtro de advogada.
- Confirmar que salvar/filtrar continua funcionando normalmente (valores persistidos continuam `juliana`/`liziane`).

Detalhes técnicos
- Não haverá mudança de banco/migration.
- Não altera schema nem dados antigos.
- Impacto é somente de camada de apresentação (labels dinâmicos) com compatibilidade total de dados existentes.

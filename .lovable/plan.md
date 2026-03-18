

## Redesenho do Painel Principal (Dashboard)

### Resumo
Redesenhar completamente o dashboard para o layout mostrado na imagem de referência: saudação com data, 4 KPIs com barra lateral colorida, e bloco principal com dois painéis (prazos processuais à esquerda, carga/status/sem movimentação à direita).

### Dados necessários (hook `useDashboardCompleto.ts`)
O hook atual já fornece quase tudo. Precisamos adicionar:
- **Prazos atrasados**: query de `processos_prazos` com `data_prazo < hoje` e `status = pendente`
- **Prazos hoje**: filtro `data_prazo = hoje`
- **Prazos esta semana**: filtro `data_prazo` entre hoje e domingo
- **Distribuição por tipo de prazo**: agrupamento por `tipo_prazo`
- **Carga por advogada**: count de processos por `responsavel_id` + prazos hoje por responsável, cruzando com `profiles`
- **Concluídos no mês**: processos com status `concluido` (já existe parcialmente)
- **Total sem movimentação**: count total (não apenas 5)
- Nos próximos vencimentos, incluir **nome do cliente** (join com `contact_submissions` via `processos.lead_id`) e **advogada responsável** (join com `profiles`)

### Arquivos a criar/modificar

#### 1. `src/hooks/useDashboardCompleto.ts` — expandir dados
- Adicionar interfaces: `PrazoUrgencia`, `PrazoTipoDistribuicao`, `CargaAdvogada`
- Novas queries:
  - Prazos atrasados (count): `processos_prazos` where `data_prazo < hoje` and `status = pendente`
  - Prazos hoje (count): `data_prazo = hoje`
  - Prazos esta semana: `data_prazo` entre hoje e próximo domingo
  - Prazos 30 dias
  - Total processos sem movimentação (count, head: true) — sem limit
  - Distribuição por tipo: todos os prazos pendentes agrupados client-side por `tipo_prazo`
  - Processos por responsável + prazos hoje por responsável (join com profiles)
  - Para lista de próximos vencimentos: incluir `lead_id` do processo → buscar `nome_completo` do cliente, e `responsavel_id` → buscar nome da advogada
- Retornar novas propriedades no objeto `DashboardCompletoData`

#### 2. `src/pages/Dashboard.tsx` — novo layout
- Remover imports de `UserPendenciasCards`, `LeadsEvolution`, `KPICard` antigos
- Nova estrutura:
  - **Saudação** (esquerda) + **Data/resumo** (direita)
  - **4 KPI cards** com barra lateral colorida (azul, vermelho, âmbar, verde)
  - **Grid 2 colunas**: painel esquerdo (prazos) + painel direito (3 cards empilhados)
- Manter `ProcessoDetailsDialog` para cliques

#### 3. `src/components/dashboard/DashboardPrazosPanel.tsx` — novo
Painel esquerdo com:
- Barra de urgência (4 segmentos coloridos com contagens)
- Distribuição por tipo (barras horizontais mini)
- Lista de próximos vencimentos (barra colorida + cliente + ação + advogada + badge dias)
- Link "Ver todos" → `/dashboard/processos/calendario`

#### 4. `src/components/dashboard/DashboardRightPanel.tsx` — novo
3 cards empilhados:
- **Carga por advogada**: avatar iniciais + nome + processos + prazos hoje + badge + mini barra
- **Status dos processos**: 3 blocos (Em andamento/Concluídos/Arquivados)
- **Sem movimentação**: alerta âmbar + lista 3 primeiros + link "Ver todos"

#### 5. `src/components/dashboard/DashboardKPICard.tsx` — novo
Card com barra lateral colorida, título uppercase muted, número grande, subtexto opcional.

### Componentes que deixam de ser usados no Dashboard
- `UserPendenciasCards` (removido do dashboard, mas mantido no codebase)
- `LeadsEvolution` (removido do dashboard, mas mantido no codebase)
- `KPICard` antigo (mantido no codebase, usado em outros lugares)

### Estilo
- Cores de urgência: `#FCEBEB` (vermelho), `#FAEEDA` (âmbar), `#EAF3DE` (verde)
- Cards brancos com `border` sutil
- Barras laterais nos KPIs com classes de cor Tailwind
- Tipografia: `font-seasons` para saudação e números grandes
- Sem emojis (conforme regra de identidade visual)

### Navegação
Nenhuma rota ou aba alterada. Apenas o conteúdo de `Dashboard.tsx`.


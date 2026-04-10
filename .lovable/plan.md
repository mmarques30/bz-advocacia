

# Relatório de Varredura Completa — B&Z Advocacia

---

## 🔴 CRÍTICOS

### 1. Código morto | `src/hooks/useDashboardData.ts` (332 linhas)
Hook inteiro não é importado por nenhum componente ou página. Era usado pelo dashboard antigo.
**Impacto:** 332 linhas de código morto que confunde manutenção e pode gerar importações erradas.
**Correção:** Deletar o arquivo.

### 2. Código morto | `src/hooks/useDashboardCompleto.ts`
Importado apenas por `VisaoOperacional.tsx` e `PropostasInteligentes.tsx`, que por sua vez não são importados por nenhuma página.
**Impacto:** Cadeia inteira de componentes e hook mortos — queries ao Supabase que nunca executam.
**Correção:** Deletar `useDashboardCompleto.ts`, `VisaoOperacional.tsx`, `PropostasInteligentes.tsx`.

### 3. Código morto | `src/components/dashboard/` — 7 componentes órfãos
- `RecentActivities.tsx` — não importado
- `RevenueChart.tsx` — não importado por páginas
- `LeadsEvolution.tsx` — não importado
- `ConversionFunnel.tsx` — não importado
- `AlertsWidget.tsx` — não importado
- `DashboardRightPanel.tsx` — não importado
- `DashboardPrazosPanel.tsx` — não importado
- `UserPendenciasCards.tsx` — não importado
- `DashboardFilters.tsx` — importado apenas por `vendas/Analises.tsx` (pode ser mantido)

**Impacto:** ~1000+ linhas de código morto poluindo o projeto.
**Correção:** Deletar cada um.

### 4. Código morto | `src/components/dashboard/DashboardStatusProcessosCard.tsx` e `DashboardSemMovimentacaoCard.tsx`
Removidos do Dashboard mas os arquivos ainda existem, não são importados em lugar nenhum.
**Impacto:** Arquivos residuais da limpeza recente.
**Correção:** Deletar ambos.

### 5. Código morto | `src/pages/configuracoes/Demandas.tsx`
Página inteira (136 linhas) não é referenciada por nenhuma rota nem importada.
**Impacto:** Duplicação da funcionalidade de `processos/Demandas.tsx`.
**Correção:** Deletar.

### 6. Código morto | `src/components/demandas/AlertasUnificados.tsx`
Não é importado por nenhum arquivo.
**Impacto:** Componente órfão.
**Correção:** Deletar.

### 7. Código morto | Páginas sem rota
- `src/pages/pesquisas/Imoveis.tsx` — sem rota no App.tsx
- `src/pages/pesquisas/Veiculos.tsx` — sem rota no App.tsx
- `src/pages/pesquisas/Configuracao.tsx` — sem rota no App.tsx
- `src/pages/comunicacao/Index.tsx` — sem rota no App.tsx (referenciada mas não mapeada)

**Impacto:** Código que jamais será acessado pelo usuário.
**Correção:** Adicionar rotas ou deletar se não são necessários.

### 8. Segurança | RLS `TO public` em tabelas sensíveis
As tabelas `meta_campanhas`, `meta_connections`, `meta_metricas`, `meta_relatorios_auto`, `meta_envios_historico`, `categorias_externas`, `categorias_financeiras`, `leads_geral`, `lead_acquisition_events`, `leads_status_overrides` usam `TO public` em vez de `TO authenticated`.
**Impacto:** Usuários anônimos (sem login) podem potencialmente ler/modificar dados via API direta.
**Correção:** Alterar policies para `TO authenticated`.

### 9. Segurança | `acordos_financeiros` e `despesas` — RLS permissivo demais
Policy `ALL` com `USING (true) WITH CHECK (true)` — qualquer usuário autenticado pode inserir, editar e deletar qualquer registro.
**Impacto:** Sem controle de acesso por role — qualquer usuário pode manipular dados financeiros.
**Correção:** Restringir a `admin` e `financeiro` como feito em `financeiro`, `despesas_fixas`, etc.

### 10. Segurança | `documentos_drive` — RLS permissivo demais
Policy `ALL` com `USING (true)` para authenticated — qualquer usuário pode deletar documentos de qualquer processo.
**Impacto:** Risco de exclusão acidental/maliciosa de documentos.
**Correção:** Restringir por role ou por propriedade.

---

## 🟡 IMPORTANTES

### 11. Código morto | `src/components/financeiro/relatorios/RelatorioSelector.tsx`
Arquivo exporta objeto vazio (`export {};`), marcado como "não mais utilizado".
**Correção:** Deletar.

### 12. Bug potencial | `src/hooks/useProcessosEvolucao.ts` — queries sem `limit`
Busca TODOS os processos em duas queries separadas sem paginação. Se a base crescer, pode atingir o limite de 1000 rows do Supabase.
**Impacto:** Dados truncados silenciosamente → gráfico mostrando números errados.
**Correção:** Usar `.select('id, created_at, status, data_ultima_atualizacao', { count: 'exact' })` ou buscar com paginação.

### 13. Bug potencial | Queries sem `limit` em múltiplos hooks
`useDashboardPrincipal`, `useDashboardCompleto`, `useDashboardData` — todos fazem `.select()` sem `.limit()` em tabelas que podem ter >1000 registros (`contact_submissions`, `processos`).
**Impacto:** Mesma questão — dados truncados em 1000 rows.
**Correção:** Adicionar `.limit()` ou paginação onde aplicável.

### 14. Performance | `console.log`/`console.error` em 25 arquivos (224 ocorrências)
Logs de debug espalhados por todo o projeto.
**Impacto:** Poluição do console em produção, potencial vazamento de dados em logs.
**Correção:** Remover ou substituir por logging condicional.

### 15. Código morto | `src/components/demandas/DemandasHeader.tsx`
Importado apenas por `configuracoes/Demandas.tsx` que é código morto.
**Correção:** Deletar junto com `Demandas.tsx`.

### 16. Dependência | `@types/papaparse` em `dependencies` em vez de `devDependencies`
**Impacto:** Aumenta bundle desnecessariamente.
**Correção:** Mover para `devDependencies`.

### 17. Dependência | `next-themes` instalado mas possivelmente não utilizado para dark mode
Sem implementação visível de dark mode toggle.
**Impacto:** Bundle extra sem uso.
**Correção:** Verificar se está sendo usado; remover se não.

### 18. Banco | Tabela `kpis` — sem INSERT/UPDATE/DELETE policies
Apenas SELECT permitido. Se a tabela deveria ser populada automaticamente, não há trigger nem função que a popula.
**Impacto:** Tabela possivelmente morta / sem dados.
**Correção:** Verificar se a tabela é usada; deletar ou adicionar mecanismo de população.

### 19. Bug potencial | `DemandaDetailsDialog` — `created_at: ""` passado como prop
Em `Dashboard.tsx` linha 110, `created_at: ""` é passado ao construir um objeto Demanda sintético. Se o dialog tentar formatar essa string vazia como data, causa `Invalid time value`.
**Impacto:** Possível crash ao clicar em tarefa urgente no dashboard.
**Correção:** Usar `new Date().toISOString()` ou null com safe formatting.

### 20. UI | Rota duplicada para whatsapp-templates
Há redirect E rota real para `/dashboard/configuracoes/whatsapp-templates` — a rota redirect nunca será alcançada porque a rota real já captura.
**Correção:** Remover a rota redirect.

---

## 🟢 MENORES

### 21. Código morto | `src/components/financeiro/FinanceiroKPIs.tsx` e `src/components/financeiro/FinanceiroCharts.tsx` e `src/components/financeiro/FinanceiroWidgets.tsx`
Verificar se são importados — podem ser residuais do layout antigo do Financeiro.

### 22. Performance | Recharts é importado em múltiplos componentes sem code splitting
Bundle pesado (~200KB) carregado mesmo em páginas que não usam gráficos.
**Correção:** Lazy load páginas com gráficos.

### 23. Design | `font-seasons` usado no greeting — verificar se a fonte está carregada
`className="font-seasons"` referenciada em Dashboard e Sidebar mas a fonte pode não estar definida no CSS.
**Correção:** Verificar `index.css` ou `tailwind.config.ts` para a definição.

### 24. Código morto | `src/types/dashboard.ts` — tipos usados apenas por `useDashboardData.ts` (que é morto)
**Correção:** Deletar junto com o hook.

### 25. Dependência | `@dnd-kit/utilities` listado mas possivelmente não importado diretamente
**Correção:** Verificar uso; pode ser dependência transitiva necessária.

---

## Resumo

| Severidade | Total |
|---|---|
| 🔴 Crítico | 10 |
| 🟡 Importante | 10 |
| 🟢 Menor | 5 |

| Categoria | Total |
|---|---|
| Código morto | 12 |
| Segurança | 3 |
| Bug potencial | 3 |
| Performance | 2 |
| Dependência | 3 |
| Design/UI | 1 |
| Banco | 1 |

### Top 5 Prioridades de Correção Imediata

1. **Corrigir RLS `TO public`** em 10+ tabelas — risco de acesso anônimo a dados sensíveis
2. **Restringir RLS de `acordos_financeiros` e `despesas`** — qualquer autenticado pode manipular
3. **Fix `created_at: ""`** no Dashboard → crash potencial ao clicar tarefa urgente
4. **Adicionar `limit` nas queries** que buscam processos/leads sem paginação — dados truncados
5. **Deletar ~15 arquivos de código morto** (~2000+ linhas) — reduz confusão e bundle


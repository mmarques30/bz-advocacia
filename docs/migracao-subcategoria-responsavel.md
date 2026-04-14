# Plano de Migração — subcategoria_codigo como nome da advogada

> Gerado em 2026-04-14 como parte do Item 4 da roadmap de médio/longo prazo.
> **Plano + Fase A aplicada.** Fases B e C permanecem pendentes.

## Problema

O hook `useReceitasPorResponsavel` em `src/hooks/useTransacoesFinanceiras.ts:281-349` determina **a quem pertence uma receita** através de três camadas de matching frágil:

1. **`subcategoria_codigo.toLowerCase()` === 'eliziane' / 'juliana'** (linhas 312-317) — depende de que a tabela `subcategorias_financeiras` tenha exatamente esses códigos.
2. **`categoria_codigo === 'pj'`** → B&Z Advocacia; **`categoria_codigo === 'pf'`** → fallback (linhas 318-321).
3. **`descricao.toLowerCase().includes('eliziane' / 'juliana')`** (linhas 325-328) — varre texto livre para tentar adivinhar a responsável quando a subcategoria não ajuda.

### Consequências

- Adicionar uma terceira advogada exige editar código, redeployar e **não há maneira automática de atribuir transações históricas** a ela.
- Remover uma sócia deixa transações "órfãs" — o hook cai no fallback de descrição e pode atribuir errado.
- Erros de grafia na descrição (`"julyana"`, `"elisiane"`) quebram a atribuição silenciosamente.
- O mesmo string literal está replicado em vários lugares (dashboard de sócias, relatório contador, gráfico de distribuição).

## Inventário de consumidores

| Arquivo | Linha | O que faz |
|---|---|---|
| `src/hooks/useTransacoesFinanceiras.ts` | 278-349 | Hook `useReceitasPorResponsavel` — fonte do problema |
| `src/components/financeiro/distribuicao/DistribuicaoSociasTab.tsx` | — | Consome o hook, espera strings `"Juliana"`, `"Eliziane"`, `"B&Z Advocacia"` |
| `src/components/financeiro/visao-geral/DistribuicaoSociasCards.tsx` | — | Consome o hook |
| `src/components/financeiro/FaturamentoCharts.tsx` | 25-26 | Label hardcoded `'Liziane/Juliana'` para código `pf`/`PF` |
| `src/components/financeiro/relatorios/RelatorioContador.tsx` | 159 | Array `["juliana", "liziane", "escritorio"]` (conta, não subcategoria — sobreposição conceitual) |
| `src/components/financeiro/ImportFaturamentoDialog.tsx` | 47-48 | Importador de planilha com colunas `valor_juliana`, `valor_eliziane` — já cria transações com subcategoria correspondente |

## Estratégia em 3 fases

### Fase A — DB foundation ✅ *APLICADA AQUI*

Arquivo: `supabase/migrations/20260414165530_subcategoria_responsavel_fase_a.sql`

1. Adiciona `transacoes_financeiras.responsavel_profile_id uuid references profiles(id)` (nullable, sem default).
2. Backfill **conservador**: para cada transação existente, aplica a lógica atual do hook (subcategoria → descrição → categoria) e grava o `profile_id` correspondente ao primeiro profile com `nome_completo ILIKE 'Juliana%' OR 'Eliziane%'`. Transações que ficariam como "PF (não identificado)" ou "B&Z Advocacia" recebem NULL (semanticamente = "não atribuído a advogada individual").
3. Index parcial em `responsavel_profile_id` para as queries de distribuição.
4. Toda a migration defensive (no-op se `transacoes_financeiras` ou `profiles` estão ausentes).

**Pós-fase A**: a coluna existe e está populada. Hook ainda usa string matching. Nada muda visualmente.

### Fase B — Escrita dual (coexistência) ⏳ *PENDENTE*

1. Atualizar `ImportFaturamentoDialog` e formulários de nova transação para **setar `responsavel_profile_id`** (selecionando da lista `useAdvogadas()`) além de manter o `subcategoria_codigo` atual.
2. Criar trigger opcional que auto-preenche `responsavel_profile_id` com base no `subcategoria_codigo` no INSERT/UPDATE, para cobrir fluxos não atualizados.

### Fase C — Migração de leitura ⏳ *PENDENTE*

1. Reescrever `useReceitasPorResponsavel` para fazer JOIN:
   ```ts
   .select("valor, responsavel_profile_id, profiles!responsavel_profile_id(nome_completo)")
   ```
2. Agrupar pelo nome do profile (ou "Não atribuído" quando NULL), substituindo o IF/ELSE de strings.
3. Remover a dependência de descrição para atribuição.
4. `FaturamentoCharts.tsx` passa a mostrar nomes reais dos profiles em vez de `"Liziane/Juliana"` hardcoded.

### Fase D (opcional, longo prazo) — Limpeza

- Renomear `subcategorias_financeiras` rows com `codigo='juliana'` / `codigo='eliziane'` para códigos semânticos (ex: `receita_advogada_responsavel`).
- Separar o conceito "conta financeira" (`juliana`/`liziane`/`escritorio` em `acordos_financeiros.conta`) de "advogada responsável" — hoje estão misturados.

## Riscos

| Fase | Risco | Mitigação |
|---|---|---|
| A | Baixo — aditivo | to_regclass guard + NULL permitido |
| B | Médio — formulários tocados | Testar criação manual e import CSV |
| C | Alto — semântica do dashboard de sócias muda | Smoke test completo, comparar valores antes/depois do deploy |
| D | Muito alto — renomear códigos pode quebrar dados importados | Só depois de Fase C estar estável em produção por ≥ 4 semanas |

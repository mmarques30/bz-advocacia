# Plano de Migração — Remover hardcoded de advogadas (juliana / liziane / eliziane)

> Gerado em 2026-04-14 como parte do audit da Fase 3, Item 6.
> **Este é um plano, não uma mudança.** O refactor é extenso e deve ser
> feito em fases separadas com QA manual em cada etapa.

## Problema

Os nomes `juliana`, `liziane` e `eliziane` (também grafado `Eliziane`)
estão espalhados como strings literais por 14+ arquivos do frontend, em
pelo menos seis papéis diferentes: tipo TypeScript, valor default de
form, chave de conta bancária, filtro de relatório, label de gráfico,
rótulo de PDF/Proposta, parser de planilha e regra de negócio em hook.

Consequência:
1. Adicionar uma terceira advogada (ou remover uma existente) exige
   alterar código em múltiplos lugares e fazer um novo deploy.
2. Duplicação de verdade entre o banco (`profiles.nome_completo`) e o
   código (`'juliana'` / `'liziane'`).
3. Inconsistência de grafia (`liziane` no código vs `Eliziane` no banco)
   já forçou o hook `useAdvogadaLabels` a fazer um mapeamento manual
   em runtime, com `ilike 'Eliziane%'`.

## Inventário de ocorrências

### A. Tipos TypeScript (unions fechadas)

| Arquivo | Linha | Ocorrência | Papel |
|---|---|---|---|
| `src/types/demandas.ts` | 5 | `type AdvogadaResponsavel = 'juliana' \| 'liziane'` | Union fechada para coluna `advogada_responsavel` |
| `src/types/demandas.ts` | 77-78 | `juliana: 'Juliana Borges', liziane: 'Eliziane Taborda'` | Mapa de labels |
| `src/types/financeiro.ts` | 14 | `type ContaFinanceira = 'juliana' \| 'liziane' \| 'escritorio'` | Chave de conta bancária |
| `src/types/financeiro.ts` | 17-18 | `juliana: 'Conta Juliana', liziane: 'Conta Liziane'` | Labels das contas |

### B. Hooks com regras de negócio

| Arquivo | Linha | Ocorrência |
|---|---|---|
| `src/hooks/useAdvogadaLabels.ts` | 12 | `ilike.Juliana%,ilike.Eliziane%` — busca labels reais no banco mas chaveia por `juliana` / `liziane` |
| `src/hooks/useAdvogadaLabels.ts` | 17-18 | map por `startsWith('juliana' / 'eliziane')` |
| `src/hooks/useProdutividadeEquipe.ts` | 196-200 | mesmo padrão do `useAdvogadaLabels` |
| `src/hooks/useTransacoesFinanceiras.ts` | 278-328 | infere responsável por `subcategoria_codigo` ou `descricao` contendo literalmente `"eliziane"` / `"juliana"` |
| `src/hooks/useIsAdvogada.ts` | 5 | lista de e-mails hard-coded (`julianalimaborges@hotmail.com`, etc.) |

### C. Componentes de UI

| Arquivo | Linha | Ocorrência |
|---|---|---|
| `src/components/demandas/NewDemandaDialog.tsx` | 28, 40, 208, 213-214 | default `juliana`, `<SelectItem value="juliana">` e `<SelectItem value="liziane">` |
| `src/components/demandas/DemandaDetailsDialog.tsx` | 104, 341-342 | idem |
| `src/components/financeiro/FaturamentoCharts.tsx` | 25-26 | label `'Liziane/Juliana'` hard-coded |
| `src/pages/financeiro/Relatorios.tsx` | 115-116 | opções `Conta Juliana` / `Conta Liziane` |
| `src/components/financeiro/relatorios/RelatorioContador.tsx` | 159 | `const contas = ["juliana", "liziane", "escritorio"]` |

### D. Importador de planilhas

| Arquivo | Linha | Ocorrência |
|---|---|---|
| `src/components/financeiro/ImportFaturamentoDialog.tsx` | 47-48 | colunas `valor_eliziane`, `valor_juliana` no tipo `ParsedRow` |
| `src/components/financeiro/ImportFaturamentoDialog.tsx` | 256-257, 313 | leitura das colunas com nomes fixos |

### E. Documentos / PDFs (conteúdo institucional, **não** refatorar)

| Arquivo | Linha | Ocorrência |
|---|---|---|
| `src/components/documentos/PropostaPreview.tsx` | 179-181 | `Eliziane Zembruski` / `Juliana Lima Borges Gasparini` como rodapé |
| `src/components/documentos/PropostaPDF.tsx` | 334-337 | idem no PDF |

> Esses aparecem em documentos oficiais enviados a clientes. Devem ser
> movidos para `configuracoes_escritorio` (tabela já existente) e lidos
> em runtime, mas isso é independente do refactor de tipos.

### F. Banco

- Coluna `demandas_internas.advogada_responsavel TEXT` — hoje guarda
  `'juliana'` ou `'liziane'`. Nada impede valores arbitrários mas o
  frontend só aceita estes dois.
- Sem CHECK constraint ativa (verificado no audit). Adicionar um
  CHECK quebraria a migração gradual, então não adicionar.

## Estratégia de migração (4 fases)

### Fase A — Fonte única de verdade no banco
1. Adicionar coluna `profiles.is_advogada boolean default false` (ou
   reaproveitar um role existente como `has_role(uid, 'advogado')`).
2. Popular para as pessoas atuais via seed script.
3. Adicionar `demandas_internas.responsavel_id uuid references profiles(id)` — já existe! Usar a coluna que já está lá e parar de gravar `advogada_responsavel`.
4. Migration de backfill: `UPDATE demandas_internas SET responsavel_id = (SELECT id FROM profiles WHERE nome_completo ILIKE ...)` casando os dois nomes atuais.

### Fase B — Camada de compatibilidade no frontend
1. Criar hook `useAdvogadas()` que retorna `{id, nome_completo, apelido}[]` a partir de `profiles` filtrando `is_advogada = true`.
2. Substituir `useAdvogadaLabels` e `useProdutividadeEquipe`'s bloco
   inline por esse novo hook.
3. Manter o type `AdvogadaResponsavel` temporariamente como
   `type AdvogadaResponsavel = string` (largo) para não quebrar
   imports existentes.

### Fase C — Reescrita dos formulários
1. `NewDemandaDialog` e `DemandaDetailsDialog`: trocar os dois
   `<SelectItem value="juliana|liziane">` por um `.map` sobre
   `useAdvogadas()` e passar a gravar apenas em `responsavel_id`,
   deixando `advogada_responsavel` como NULL (legacy).
2. Telas de filtros e relatórios (`RelatorioContador`, `Relatorios`,
   `FaturamentoCharts`): dropdowns populados dinamicamente.

### Fase D — Limpeza do legado
1. Depois que 100% das novas escritas passarem por `responsavel_id`,
   rodar script para backfill inverso (copiar para o nome derivado do
   profile) e então DROP column `advogada_responsavel`.
2. Remover `src/types/demandas.ts` types, `useAdvogadaLabels`,
   `useIsAdvogada` (substituir por check de role).

## Itens fora do escopo deste refactor

- **Conta financeira** (`juliana` / `liziane` / `escritorio` em
  `financeiro`/`despesas`): conceitualmente é uma "conta bancária",
  não uma pessoa. Refatorar separadamente criando
  `contas_bancarias (codigo, nome, owner_profile_id)`.
- **Planilha de importação**: se o template Excel usado pelo
  escritório tem colunas `valor_juliana` / `valor_eliziane`, mudar o
  nome de coluna quebra a importação. Manter como está até combinar
  novo template com o escritório.
- **PDFs e propostas**: texto institucional de rodapé — trocar quando
  houver alteração de sócias.

## Estimativa de risco

| Fase | Risco | Motivo |
|---|---|---|
| A | Baixo | Aditivo — não remove coluna ainda |
| B | Baixo | Novos hooks coexistem com os antigos |
| C | **Médio** | Muitos componentes tocados; requer QA manual de criação/edição de demanda, filtros de relatório e dashboard de produtividade |
| D | Alto | DROP COLUMN é irreversível — só fazer depois de 2+ semanas em produção com escrita nova |

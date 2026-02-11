

# Reorganizar Projecoes como Sub-abas e Adicionar Gestao de Metas

## Problema

1. O grafico "Projetado vs Realizado" na aba Faturamento esta vazio porque busca dados de `parcelas_financeiras` (acordos), e nao ha acordos cadastrados
2. Nao existe forma de configurar metas/projecoes dentro do modulo Financeiro -- o dialog de metas so existe no Dashboard
3. Os graficos de projecao (Projetado vs Realizado, Fluxo de Caixa) ocupam espaco na aba principal de Faturamento/Despesas quando deveriam ser sub-abas internas

## Solucao

### 1. Aba Faturamento: adicionar sub-abas internas

Dentro da aba "Faturamento", criar sub-abas:

- **Lancamentos** (padrao): contem os KPIs, widgets, tabela de faturamento e creditos condicionais (conteudo atual)
- **Projecao**: contem o grafico "Projetado vs Realizado" alimentado pelas metas mensais + dados reais de `transacoes_financeiras`, o grafico de Fluxo de Caixa, e o botao "Configurar Metas" para definir projecoes

### 2. Aba Despesas: adicionar sub-abas internas

Dentro da aba "Despesas", criar sub-abas:

- **Lancamentos** (padrao): contem alertas, KPIs, graficos, widgets e tabela de despesas (conteudo atual)
- **Projecao**: contem grafico de evolucao de despesas com meta de orcamento, botao para configurar orcamento mensal de despesas

### 3. Corrigir "Projetado vs Realizado"

O hook `useProjetadoVsRealizado` atualmente busca apenas de `parcelas_financeiras`. Alterar para:

- **Realizado**: buscar da tabela `transacoes_financeiras` (receitas reais, que ja esta populada com importacoes)
- **Projetado**: buscar da tabela `metas_mensais` (metas definidas pelo usuario)

Isso vai alimentar o grafico com dados reais.

### 4. Reutilizar ConfigurarMetaDialog

Mover/reutilizar o `ConfigurarMetaDialog` (ja existente em `src/components/dashboard/`) para que apareca na sub-aba "Projecao" de Faturamento, permitindo definir metas de receita por mes.

## Alteracoes por arquivo

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/Financeiro.tsx` | Adicionar sub-abas (Tabs internas) nas abas Faturamento e Despesas; mover graficos de projecao para sub-aba "Projecao" |
| `src/hooks/useFinanceiro.ts` | Alterar `useProjetadoVsRealizado` para buscar realizado de `transacoes_financeiras` e projetado de `metas_mensais` |
| `src/components/financeiro/FaturamentoCharts.tsx` | Separar: manter Fluxo de Caixa e Faturamento por Responsavel no "Lancamentos"; mover Projetado vs Realizado para a sub-aba "Projecao" |

### Nova sub-aba "Projecao" em Faturamento contera:
- Botao "Configurar Metas" (reutilizando ConfigurarMetaDialog)
- Grafico Projetado vs Realizado (com dados corrigidos)
- Grafico de Fluxo de Caixa

### Nova sub-aba "Projecao" em Despesas contera:
- Grafico de evolucao mensal de despesas
- Comparativo com meses anteriores

## Resultado esperado

- O grafico "Projetado vs Realizado" mostrara dados reais (receitas importadas vs metas configuradas)
- O usuario podera configurar metas diretamente na aba Financeiro > Faturamento > Projecao
- A aba principal de Faturamento ficara mais limpa, focando nos lancamentos do dia-a-dia


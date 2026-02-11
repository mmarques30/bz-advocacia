

# Plano: Projecao de Faturamento vs. Realizado

## Resumo

Quando um contrato e fechado, o valor entra no financeiro como **Projecao de Faturamento** (nao como receita confirmada). Somente quando o pagamento e confirmado manualmente (via "Registrar Pagamento" nas parcelas) o valor passa a ser **Receita Realizada**. Isso evita contabilizar como receita o que ainda nao entrou no caixa.

## Situacao Atual

- Ao fechar contrato, o sistema cria um acordo financeiro (`acordos_financeiros`) com parcelas (`parcelas_financeiras`) com status `pendente`
- Os KPIs ja distinguem parcialmente: "Receita do Mes" soma parcelas pagas + transacoes importadas, e "A Receber" soma parcelas pendentes
- Porem nao ha conceito explicito de "Projecao" vindo de contratos fechados
- Os graficos e widgets nao mostram visao separada Projetado vs Realizado

## O que precisa mudar

### 1. KPIs de Faturamento - Adicionar "Projecao" (`FaturamentoKPIs.tsx`)

Adicionar um novo KPI card: **"Projecao"** que soma o valor total dos acordos ativos com parcelas pendentes (valores de contratos fechados que ainda nao foram pagos).

Layout passa de 4 para 5 KPIs:
- Receita Realizada (parcelas pagas + transacoes importadas - como ja funciona)
- Projecao (valor total de parcelas pendentes de acordos ativos)
- A Receber (parcelas pendentes com vencimento no periodo - ja existe)
- Em Atraso (parcelas vencidas nao pagas - ja existe)
- Ticket Medio (ja existe)

### 2. Hook `useKPIsFinanceiros` - Calcular projecao (`useFinanceiro.ts`)

Adicionar campo `projecao` no retorno dos KPIs:
- Somar `valor_total` de todos os acordos com status `ativo` que possuem parcelas com status `pendente`
- Ou somar o valor das parcelas pendentes diretamente (mais preciso, pois parcelas parcialmente pagas serao descontadas)

Adicionar ao tipo `KPIsFinanceiros` em `types/financeiro.ts`.

### 3. Grafico Projetado vs Realizado (`FaturamentoCharts.tsx`)

Adicionar um novo grafico de barras agrupadas mostrando por mes:
- Barra verde: **Realizado** (parcelas pagas no mes)
- Barra azul tracejada: **Projetado** (parcelas pendentes com vencimento no mes)

Hook novo `useProjetadoVsRealizado` em `useFinanceiro.ts` que retorna array mensal com ambos os valores.

### 4. Fluxo de Criacao de Acordo via Contrato

O fluxo atual ja funciona corretamente:
1. Contrato emitido -> Lead vira "Fechado" (automacao ja implementada)
2. Acordo criado -> Parcelas criadas com status `pendente` (ja funciona)
3. Confirmacao manual via "Registrar Pagamento" -> Parcela muda para `pago` (ja funciona)

**Nenhuma mudanca necessaria no fluxo de criacao.** A unica mudanca e na **visualizacao**, para deixar claro que parcelas pendentes sao projecao e nao receita.

## Arquivos Envolvidos

| Arquivo | Acao |
|---------|------|
| `src/types/financeiro.ts` | Adicionar `projecao` ao tipo `KPIsFinanceiros` |
| `src/hooks/useFinanceiro.ts` | Calcular projecao nos KPIs + novo hook `useProjetadoVsRealizado` |
| `src/components/financeiro/FaturamentoKPIs.tsx` | Adicionar card de Projecao |
| `src/components/financeiro/FaturamentoCharts.tsx` | Adicionar grafico Projetado vs Realizado |

## Detalhes Tecnicos

**Novo campo em KPIsFinanceiros:**
```text
projecao: number  // soma das parcelas pendentes de acordos ativos
```

**Calculo da projecao no hook:**
```text
projecao = parcelas
  .filter(p => p.status === 'pendente')
  .reduce((sum, p) => sum + p.valor, 0)
```

**Hook useProjetadoVsRealizado:**
```text
Para cada mes nos ultimos 12 meses:
  - realizado = parcelas pagas no mes (valor_pago)
  - projetado = parcelas pendentes com vencimento no mes (valor)
Retorna: [{ mes: "Jan/25", realizado: 5000, projetado: 12000 }, ...]
```

**Novo grafico (barras agrupadas):**
```text
[Barra Verde: Realizado] [Barra Azul Pontilhada: Projetado]
  Jan     Fev     Mar     Abr     Mai
```

## Resultado

- Contratos fechados entram como projecao, nao como receita
- Confirmacao manual de pagamento transforma projecao em receita realizada
- KPIs mostram claramente: quanto ja entrou vs quanto se espera receber
- Grafico visual facilita acompanhar a conversao de projecao em receita real
- Nenhuma mudanca no fluxo operacional - apenas na visualizacao dos dados


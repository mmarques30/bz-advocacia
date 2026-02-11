
# Conectar e Automatizar a Gestao de Pagamentos

## Diagnostico

A pagina "Gestao de Pagamentos" (`/dashboard/financeiro/pagamentos`) esta **desconectada** do restante do modulo financeiro:

1. **Somente leitura**: Os cards de "Despesas Pendentes", "Receitas a Receber" e "Proximos Vencimentos" nao possuem nenhuma acao -- o usuario ve os dados mas nao pode fazer nada (marcar como pago, registrar pagamento, editar, excluir).

2. **Dados parcialmente redundantes**: As mesmas informacoes de despesas pendentes e receitas a receber ja aparecem nos widgets da aba "Faturamento" (acordos/parcelas) e "Despesas" (alertas) do modulo financeiro principal.

3. **Sem integracao com os dialogs existentes**: O sistema ja possui `RegistrarPagamentoDialog` para parcelas e acoes de pagar/editar despesas, mas nada disso esta conectado a esta pagina.

## Solucao

Transformar a pagina de Pagamentos de uma visao passiva em um **centro de acao operacional**, conectando-a aos dialogs e hooks ja existentes no sistema.

## Alteracoes

### 1. `src/components/financeiro/pagamentos/PagamentosAtrasados.tsx`

**Despesas Pendentes (lado esquerdo):**
- Adicionar botao "Pagar" em cada item de despesa que atualiza o status para "pago" usando o hook `useUpdateDespesa` ja existente em `useDespesas.ts`
- Adicionar botao "Editar" que abre o `DespesaDetailsDialog`

**Receitas a Receber (lado direito):**
- Para itens com `origem: "parcelas"`: adicionar botao "Registrar Pagamento" que abre o `RegistrarPagamentoDialog` (ja existe)
- Para itens com `origem: "transacoes"`: adicionar botao "Editar" que abre o `EditTransacaoDialog`

### 2. `src/components/financeiro/pagamentos/ProximosVencimentos.tsx`

- Adicionar botao de acao em cada card de vencimento:
  - Se tipo "despesa": botao "Pagar" (marca despesa como paga)
  - Se tipo "receita": botao "Registrar" (abre RegistrarPagamentoDialog)
- Armazenar a `origem` (despesas/transacoes/parcelas) nos itens de vencimento para saber qual acao executar

### 3. `src/pages/financeiro/Pagamentos.tsx`

- Adicionar KPIs resumidos no topo: Total a Pagar, Total a Receber, Saldo Projetado (calculados a partir dos mesmos dados dos hooks existentes)
- Adicionar states para controlar os dialogs de pagamento e detalhes
- Renderizar `RegistrarPagamentoDialog` e `DespesaDetailsDialog`
- Aumentar periodo de proximos vencimentos para 30 dias (mais util para planejamento)

### 4. `src/hooks/usePagamentos.ts`

- Adicionar campo `origem` ao tipo `ItemVencimento` para que `ProximosVencimentos` saiba se deve abrir o dialog de parcela ou de despesa
- Propagar o `origem` nos dados retornados por `useProximosVencimentos`

## Resultado

- Os 3 componentes da pagina de Pagamentos passam a ter **botoes de acao** conectados aos dialogs ja existentes
- O usuario pode registrar pagamentos, marcar despesas como pagas e editar registros diretamente da pagina
- KPIs no topo dao visao rapida do saldo pendente
- Dados vem das mesmas fontes que o modulo financeiro principal (sem duplicacao de logica)

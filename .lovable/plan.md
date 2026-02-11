

# Plano: Edicao Individual de Status de Parcelas

## Resumo

Melhorar o dialog de detalhes do acordo para permitir edicao completa de cada parcela: alterar status (pendente/pago), editar valor, e filtrar parcelas por status.

## Situacao Atual

- `AcordoDetailsDialog` exibe parcelas em tabela com botao "Registrar" para pendentes
- `RegistrarPagamentoDialog` permite marcar como pago com data, valor e forma de pagamento
- Nao ha como reverter uma parcela de "pago" para "pendente"
- Nao ha como editar o valor previsto de uma parcela
- Nao ha filtro de parcelas por status dentro do dialog
- Hook `useUpdateParcela` ja existe e suporta atualizacoes parciais

## Alteracoes

### 1. Filtro de parcelas no dialog (`AcordoDetailsDialog.tsx`)

Adicionar barra de filtro acima da tabela de parcelas com 4 opcoes:
- **Todas** (padrao)
- **A Receber** (status pendente, nao vencida)
- **Recebidas** (status pago)
- **Atrasadas** (status pendente, vencida)

Implementar como toggle group ou botoes com contadores.

### 2. Edicao inline de valor (`AcordoDetailsDialog.tsx`)

Na coluna "Valor" da tabela de parcelas:
- Exibir icone de edicao (lapiz) ao lado do valor
- Ao clicar, campo se torna editavel (input number)
- Ao confirmar (Enter ou blur), salva via `useUpdateParcela`
- Se o valor for diferente do original, exibir indicador visual (tooltip ou texto menor com valor original)

### 3. Acoes expandidas por parcela (`AcordoDetailsDialog.tsx`)

Coluna de acoes com dropdown menu:
- **Parcela pendente**: "Registrar Pagamento" (abre dialog existente) + "Editar Valor"
- **Parcela paga**: "Desfazer Pagamento" (volta para pendente, limpa data_pagamento e valor_pago) + "Ver Detalhes do Pagamento"

### 4. Mutation para desfazer pagamento (`useParcelas.ts`)

Novo hook `useDesfazerPagamento`:
- Atualiza parcela: status = 'pendente', data_pagamento = null, valor_pago = null
- Remove entrada correspondente do historico_pagamentos
- Invalida caches relevantes

### 5. Dialog de edicao de valor (`EditParcelaValorDialog.tsx`)

Novo dialog simples:
- Campo com valor atual
- Campo com novo valor
- Motivo da alteracao (opcional)
- Salva via `useUpdateParcela`

## Arquivos Envolvidos

| Arquivo | Acao |
|---------|------|
| `src/components/financeiro/AcordoDetailsDialog.tsx` | Adicionar filtro de status + acoes expandidas + edicao inline |
| `src/hooks/useParcelas.ts` | Adicionar `useDesfazerPagamento` |
| `src/components/financeiro/EditParcelaValorDialog.tsx` | Novo dialog para editar valor da parcela |

## Detalhes Tecnicos

**Filtro de parcelas (estado local no dialog):**
```text
const [statusFilter, setStatusFilter] = useState<'todas' | 'a_receber' | 'recebidas' | 'atrasadas'>('todas');

parcelasFiltradas = acordo.parcelas.filter(p => {
  if (statusFilter === 'recebidas') return p.status === 'pago';
  if (statusFilter === 'a_receber') return p.status === 'pendente' && new Date(p.data_vencimento) >= new Date();
  if (statusFilter === 'atrasadas') return p.status !== 'pago' && new Date(p.data_vencimento) < new Date();
  return true;
});
```

**useDesfazerPagamento:**
```text
1. UPDATE parcelas_financeiras SET status='pendente', data_pagamento=null, valor_pago=null WHERE id=parcelaId
2. DELETE FROM historico_pagamentos WHERE parcela_id=parcelaId
3. Invalidar queries: parcelas, acordo-detalhes, acordos-financeiros, kpis-financeiros, projetado-vs-realizado
```

**Acoes por status:**
```text
Pendente (nao vencida):
  - [Registrar Pagamento] (abre RegistrarPagamentoDialog)
  - [Editar Valor] (abre EditParcelaValorDialog)

Pendente (vencida/atrasada):
  - [Registrar Pagamento]
  - [Editar Valor]

Pago:
  - [Desfazer Pagamento] (com confirmacao)
  - [Editar Valor]
```

**Contadores nos filtros:**
```text
[Todas (12)] [A Receber (5)] [Recebidas (4)] [Atrasadas (3)]
```

## Resultado

- Visualizacao completa de todas as parcelas de um contrato com filtros por status
- Edicao individual do valor previsto de cada parcela
- Marcacao de parcela como recebida com data e valor (ja existia)
- Possibilidade de desfazer um pagamento registrado por engano
- Filtros rapidos para ver somente pendentes, recebidas ou atrasadas

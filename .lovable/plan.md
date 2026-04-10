

## Corrigir erros intermitentes no módulo financeiro

### Problemas identificados

1. **`EntradaSimplesForm` (NewEntradaFaturamentoDialog.tsx)**: Não reseta estado do formulário após sucesso. Apesar de o componente desmontar ao fechar, se a mutação falhar silenciosamente o form fica travado com `isPending` eternamente.

2. **`NewAcordoDialog`**: Não reseta formulário ao cancelar/fechar — apenas no `onSuccess`. Se o usuário abre, preenche, cancela e reabre, os dados antigos persistem. Além disso, `onClose()` é chamado antes do reset, podendo causar race condition.

3. **`NewTransacaoDialog`**: Chama `onClose()` antes de `resetForm()` — o dialog fecha antes do reset executar. Se o componente não desmonta (caching do Dialog), o estado fica sujo.

4. **`NewDespesaDialog`**: Formulário bem implementado com `handleClose` que reseta tudo. Sem problemas aparentes aqui.

5. **Constraint `parcelas_financeiras.valor > 0`**: Quando um contrato tem valor total R$10.000 com entrada R$4.900 e 5 parcelas, o cálculo `(10000 - 4900) / 5 = 1020` funciona. Mas com divisões que geram decimais longos (ex: R$10.000 / 3 = 3333.333...), a precisão pode causar problemas de arredondamento que eventualmente violam constraints.

6. **Sem tratamento de erro explícito no `EntradaSimplesForm`** — não tem `onError`, `try/catch`, nem feedback ao usuário quando a inserção falha.

### Alterações

**1. `src/components/financeiro/NewEntradaFaturamentoDialog.tsx`**
- Adicionar função `resetForm()` no `EntradaSimplesForm`
- Chamar `resetForm()` no `onSuccess` ANTES de `onClose()`
- Adicionar callback `onError` com `toast.error` mostrando mensagem específica do erro
- Arredondar valores de parcela para 2 casas decimais: `Math.round(valor * 100) / 100`

**2. `src/components/financeiro/NewAcordoDialog.tsx`**
- Extrair `resetForm()` como função separada
- Chamar `resetForm()` em `onOpenChange` (quando dialog fecha por qualquer motivo)
- Mover reset para ANTES do `onClose()` no `onSuccess`
- Adicionar `onError` com `toast.error` na chamada do `mutate`
- Arredondar `valorParcela` para 2 casas: `Math.round(valorParcela * 100) / 100`
- Ajustar última parcela para absorver diferença de arredondamento (garantir que soma = valor total)

**3. `src/components/financeiro/transacoes/NewTransacaoDialog.tsx`**
- Inverter ordem: chamar `resetForm()` ANTES de `onClose()`
- Adicionar `toast.error` com `error.message` no catch

**4. `src/hooks/useFinanceiro.ts` (useCreateAcordo)**
- Já tem `onError` com toast — OK
- Invalidar também queries de `faturamento-detalhado` e `fluxo-caixa` no `onSuccess`

### Arquivos editados
- `src/components/financeiro/NewEntradaFaturamentoDialog.tsx`
- `src/components/financeiro/NewAcordoDialog.tsx`
- `src/components/financeiro/transacoes/NewTransacaoDialog.tsx`
- `src/hooks/useFinanceiro.ts`


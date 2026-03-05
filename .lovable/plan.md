

## Diagnóstico

### Problema 1: Nomenclatura "Novo Acordo" → "Contrato"
Na tela "Nova Entrada de Faturamento", o primeiro card diz "Novo Acordo". O dialog subsequente também usa "Acordo Financeiro". Precisa renomear para "Contrato" em todos os locais visíveis.

### Problema 2: Não consegue visualizar/alterar pagamentos realizados
O `AcordoDetailsDialog` mostra parcelas e histórico, mas quando o pagamento é registrado, as informações de data e valor pagos ficam apenas no badge de status ("Pago em dd/MM/yyyy"). Não há como visualizar detalhes completos nem editar um pagamento já registrado — só é possível "Desfazer" ou "Editar Valor" (que edita o valor esperado, não o pago).

**Correção:** Adicionar na tabela de parcelas colunas para "Valor Pago" e "Data Pagamento" quando o status for "pago", e adicionar opção de "Editar Pagamento" no dropdown de ações.

### Problema 3: Entrada + parcelas com valores diferentes
Atualmente, o `NewAcordoDialog` divide o valor total igualmente entre todas as parcelas. Não existe campo para "valor de entrada" separado do restante parcelado.

**Correção:** Adicionar opção de "Entrada" no formulário de novo contrato: um toggle/checkbox "Com entrada?", campo de valor da entrada, e o restante é dividido nas parcelas. A entrada vira parcela nº 1 com vencimento imediato, e as demais parcelas têm o valor restante dividido igualmente.

## Alterações

### 1. Renomear "Acordo" → "Contrato" (visual apenas)
**Arquivos:**
- `src/components/financeiro/NewEntradaFaturamentoDialog.tsx` — Card label e description
- `src/components/financeiro/NewAcordoDialog.tsx` — DialogTitle
- `src/components/financeiro/AcordoDetailsDialog.tsx` — DialogTitle
- `src/components/financeiro/AcordosHeader.tsx` — Botão "Novo Acordo" → "Novo Contrato"
- `src/pages/financeiro/Acordos.tsx` — Título da página
- `src/types/financeiro.ts` — Labels (TIPO_ENTRADA_FATURAMENTO_LABELS, STATUS_ACORDO_LABELS se necessário)

### 2. Melhorar visualização de pagamentos no AcordoDetailsDialog
**Arquivo:** `src/components/financeiro/AcordoDetailsDialog.tsx`
- Adicionar colunas "Valor Pago" e "Data Pgto" na tabela de parcelas
- Adicionar opção "Editar Pagamento" no dropdown (para parcelas pagas) que abre o RegistrarPagamentoDialog com dados pré-preenchidos

### 3. Suporte a entrada + parcelas no NewAcordoDialog
**Arquivo:** `src/components/financeiro/NewAcordoDialog.tsx`
- Adicionar checkbox "Com entrada?"
- Campo "Valor da Entrada" (aparece quando checkbox ativo)
- Recalcular preview: parcela 1 = entrada (vencimento = data informada), parcelas 2..N = (valorTotal - valorEntrada) / numeroParcelas
- Gerar array de parcelas corretamente no submit


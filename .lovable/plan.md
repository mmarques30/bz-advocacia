

## Diagnóstico

Quando o usuário seleciona um cliente no dialog "Novo Contrato Financeiro", o sistema não verifica se já existe um contrato gerado (`contratos_gerados`) para esse cliente. Os campos `tipo_servico`, `valor_total`, número de parcelas e valor de entrada ficam vazios, mesmo quando essas informações já estão disponíveis na tabela `contratos_gerados.valores`.

## Correção

**Arquivo:** `src/components/financeiro/NewAcordoDialog.tsx`

1. Importar o hook `useClienteContratos` existente
2. Adicionar um `useEffect` que reage à mudança de `clienteId`: quando um cliente é selecionado, buscar seus contratos gerados
3. Se existir contrato, preencher automaticamente os campos com os valores do contrato mais recente:
   - `tipoServico` ← `contrato.tipo_contrato` (ex: "Divórcio")
   - `valorTotal` ← `contrato.valores?.valor_total`
   - Se `valor_entrada` existir: ativar `comEntrada` e preencher `valorEntrada`
   - Se `num_parcelas > 1`: selecionar `formaPagamento = "parcelado"` e preencher `numeroParcelas`
4. Exibir um aviso visual (Alert) informando "Valores pré-preenchidos a partir do contrato gerado — você pode editá-los"
5. Todos os campos continuam editáveis normalmente

Os dados vêm do campo JSON `valores` da tabela `contratos_gerados`, que já contém `valor_total`, `valor_entrada`, `valor_parcelas`, `num_parcelas`, `percentual_exito` e `desconto_avista`.



# Plano: Buscar Processo pelo Nome do Cliente ao Criar Demanda

## Problema

Atualmente, o campo "Processo Relacionado" no formulario de nova demanda lista todos os processos de forma generica (numero ou tipo), sem indicar o cliente. O usuario precisa saber o numero do processo de antemao.

## Solucao

Substituir o campo unico de processo por dois campos encadeados:

1. **Cliente** (Input com busca): campo de texto que filtra clientes por nome
2. **Processo do Cliente** (Select): exibe apenas os processos do cliente selecionado

Fluxo: Digita nome do cliente -> Seleciona cliente -> Exibe processos vinculados -> Seleciona processo

## Arquivo a Modificar

| Arquivo | Descricao |
|---------|-----------|
| `src/components/demandas/NewDemandaDialog.tsx` | Substituir select unico por busca cliente + select processo |

## Detalhamento Tecnico

### Alteracoes no `NewDemandaDialog.tsx`

1. **Adicionar estado local**:
   - `clienteSearch` (string): texto digitado para buscar cliente
   - `selectedClienteId` (string | null): cliente selecionado

2. **Nova query de clientes**: buscar `contact_submissions` com `estagio = 'fechado'`, filtrado pelo texto digitado (`.ilike('nome_completo', '%texto%')`)

3. **Alterar query de processos**: quando `selectedClienteId` estiver preenchido, buscar processos com `.eq('lead_id', selectedClienteId)` e incluir dados do cliente na query (`.select('id, numero_processo, tipo, cliente:contact_submissions!lead_id(nome_completo)')`)

4. **Substituir a secao "Processo Relacionado"** por:
   - Campo "Cliente" com Input de busca + lista dropdown de resultados
   - Campo "Processo" (Select) que aparece somente apos selecionar um cliente, listando os processos daquele cliente
   - Botao "Limpar" para resetar a selecao

5. **Manter compatibilidade** com `defaultProcessoId`: quando preenchido, buscar o processo e pre-selecionar o cliente automaticamente

## Resultado

O usuario digitara o nome do cliente, vera uma lista filtrada, selecionara o cliente desejado, e entao um segundo campo exibira apenas os processos daquele cliente para selecao.

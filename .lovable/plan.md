

# Diagnóstico: "Propostas do Cliente" mostrando vazio

## Investigação

Verifiquei diretamente no banco de dados e o cliente **Ademar Lunardelli** possui apenas **1 registro** na tabela `contratos_gerados`:

| Título | Tipo | Status |
|--------|------|--------|
| teste | divorcio | rascunho |

**Não existe nenhum registro com `tipo_contrato = 'proposta'`** para esse cliente.

## Como funciona a conexão

- A seção **"Propostas do Cliente"** na aba Contrato busca registros em `contratos_gerados` filtrados por `tipo_contrato = 'proposta'`
- Propostas são criadas exclusivamente pela aba **"Proposta"** (segunda aba da página Documentos)
- O registro existente ("teste") é um **contrato de divórcio**, não uma proposta

## Possível cenário

Se você gerou uma proposta para o Ademar pela aba "Proposta" e o PDF foi baixado, mas houve um erro ao salvar no banco (ex: falha de rede), a proposta não ficou registrada. Nesse caso, basta gerar novamente na aba "Proposta".

## Plano (se quiser uma correção)

Se o objetivo é que o campo "Propostas do Cliente" também mostre **contratos já gerados** (não só propostas), posso alterar o hook `usePropostasCliente` para buscar todos os registros do cliente em vez de filtrar apenas por `tipo_contrato = 'proposta'`. Confirme se é isso que deseja.


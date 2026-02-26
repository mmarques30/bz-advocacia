

# Plano: Propostas com número de identificação, vínculo ao lead, e aproveitamento no contrato

## Contexto
Atualmente propostas são salvas em `contratos_gerados` com `tipo_contrato = 'proposta'` mas sem número sequencial, sem status de aprovação vinculado ao contrato, e o formulário de contrato só carrega a última proposta automaticamente sem permitir escolha.

## 1. Migração de banco — adicionar `numero_proposta` sequencial

Adicionar coluna `numero_proposta` (integer, auto-incremento via sequence) à tabela `contratos_gerados`. Criar uma sequence e um trigger para atribuir automaticamente o próximo número quando `tipo_contrato = 'proposta'`.

```sql
ALTER TABLE contratos_gerados ADD COLUMN numero_proposta integer;

CREATE SEQUENCE propostas_numero_seq START 1;

CREATE OR REPLACE FUNCTION set_numero_proposta()
RETURNS trigger AS $$
BEGIN
  IF NEW.tipo_contrato = 'proposta' AND NEW.numero_proposta IS NULL THEN
    NEW.numero_proposta := nextval('propostas_numero_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_numero_proposta
BEFORE INSERT ON contratos_gerados
FOR EACH ROW EXECUTE FUNCTION set_numero_proposta();
```

## 2. Edição inline de dados do cliente nos formulários

**Arquivos**: `GerarContratoForm.tsx`, `GerarPropostaForm.tsx`

Ao selecionar o cliente, exibir um painel colapsável/editável com os campos pessoais (CPF, RG, nacionalidade, profissão, estado civil, endereço). O usuário pode editar diretamente e os dados são salvos na tabela `contact_submissions` ao clicar "Salvar dados" — sem precisar abrir dialog separado.

- Reutilizar `useUpdateClienteDados` para persistir
- Mostrar campos preenchidos como `defaultValue` editáveis
- Sync `estado_civil` ↔ `situacao_atual` ao salvar

## 3. GerarPropostaForm — gerar número de identificação

**Arquivo**: `GerarPropostaForm.tsx`

- Ao salvar a proposta, o trigger do banco atribui automaticamente o `numero_proposta`
- Exibir o número na confirmação: "Proposta #12 gerada com sucesso"
- Adicionar campo de título automático: `Proposta #N - Nome do Cliente`

## 4. GerarContratoForm — listar e selecionar propostas do cliente

**Arquivo**: `GerarContratoForm.tsx`

Substituir o hook `usePropostaAnterior` (que busca só a última) por `usePropostasCliente` que busca todas as propostas do cliente selecionado.

Quando o cliente for selecionado e houver propostas:
- Exibir uma lista/select com todas as propostas (número, título, data, valores)
- Ao selecionar uma proposta, carregar os valores dela no formulário
- Marcar a proposta como "aprovada" ao finalizar o contrato (atualizar `status` para `'assinado'` na proposta vinculada)

## 5. Histórico — exibir número da proposta

**Arquivo**: `ContratosHistorico.tsx`

- Exibir coluna "Nº" para propostas, mostrando o `numero_proposta`
- Diferenciar visualmente propostas de contratos na listagem

## Resumo de alterações

| Componente | Alteração |
|---|---|
| Banco de dados | Coluna `numero_proposta`, sequence, trigger |
| `GerarContratoForm.tsx` | Painel edição dados cliente, seletor de propostas do cliente |
| `GerarPropostaForm.tsx` | Painel edição dados cliente, exibir número ao salvar |
| `ContratosHistorico.tsx` | Coluna número da proposta |
| `useContratos.ts` | Novo hook `usePropostasCliente` substituindo `usePropostaAnterior` |


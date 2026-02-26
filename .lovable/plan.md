

# Plano: Número sequencial para contratos + exibição nos documentos do cliente

## Situação atual
- Propostas já têm `numero_proposta` sequencial via trigger, mas contratos não têm número de identificação
- A coluna "Nº" no histórico só mostra número para propostas (contratos mostram "-")
- `LeadContratosTab` já existe e lista contratos/propostas do cliente, mas não mostra número de identificação
- O `LeadDetailsDialog` de clientes já inclui a aba "Contratos" com `LeadContratosTab`

## Alterações

### 1. Migração — adicionar `numero_contrato` sequencial
Adicionar coluna `numero_contrato` (integer) à tabela `contratos_gerados`. Criar sequence `contratos_numero_seq` e modificar o trigger existente `set_numero_proposta` para também atribuir número a contratos (quando `tipo_contrato != 'proposta'`).

```sql
ALTER TABLE contratos_gerados ADD COLUMN numero_contrato integer;
CREATE SEQUENCE contratos_numero_seq START 1;

-- Atualizar a função para também gerar numero_contrato
CREATE OR REPLACE FUNCTION public.set_numero_proposta() ...
  -- Se proposta: atribui numero_proposta
  -- Se contrato: atribui numero_contrato
```

### 2. `ContratosHistorico.tsx`
- Atualizar a coluna "Nº" para mostrar `#P{numero_proposta}` para propostas e `#C{numero_contrato}` para contratos, nunca mais "-"

### 3. `LeadContratosTab.tsx`
- Adicionar coluna "Nº" mostrando o número de identificação (proposta ou contrato)
- Separar visualmente propostas de contratos com headers de seção

### 4. Atualizar types (`Contrato` interface)
- Adicionar `numero_contrato?: number` à interface `Contrato` em `src/types/contratos.ts`


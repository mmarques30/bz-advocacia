

# Corrigir Kanban: Leads nao aparecem na coluna "Novos"

## Problemas Identificados

**Problema 1 - Fonte de dados errada (linha 109):**
O KanbanView recebe `leadsGeral || []` que vem da tabela do banco (vazia). Deveria usar os dados do CSV convertidos.

**Problema 2 - Mismatch de status (linha 127):**
O CSV mapeia `CREATED` para `"Novo"` (via `mapEstagio`). Quando o Kanban faz `.toUpperCase()`, o resultado e `"NOVO"`, que nunca bate com a chave `"CREATED"` da coluna.

## Solucao

### `src/pages/Leads.tsx`

**Linha 108-111** - Alimentar Kanban com dados do CSV convertidos:
```text
Antes:  leads={leadsGeral || []}
Depois: leads={(filteredLeads || []).map(csvToLeadGeral)}
```

**Linha 127** - Corrigir chave da coluna "Novos":
```text
Antes:  { key: "CREATED", label: "Novos", ... }
Depois: { key: "NOVO", label: "Novos", ... }
```

As demais colunas (ENVIADO, QUALIFICADO, CONVERTIDO) ja batem corretamente.

Nenhum outro arquivo precisa ser alterado.


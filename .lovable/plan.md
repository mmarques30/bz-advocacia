

# Corrigir contagem de Clientes Ativos e Processos

## Problema identificado

O banco mostra:
- 184 clientes com estagio "fechado", mas apenas **94** tem `status_cliente = 'ativo'` e **90** sao `'inativo'`
- O KPI "Clientes Ativos" no Painel conta **todos** os 184 (filtra apenas por `estagio = 'fechado'`, ignorando `status_cliente`)
- Todos os 184 processos estao com status `em_andamento`, inclusive os vinculados a clientes inativos

## Correcoes

### 1. KPI "Clientes Ativos" no Dashboard (`src/hooks/useDashboardCompleto.ts`)

Alterar a query de `totalClientes` (linha 168-170) para considerar `status_cliente`:

**Antes:** Conta todos com `estagio = 'fechado'` (184)
**Depois:** Conta apenas com `estagio = 'fechado'` **E** `status_cliente = 'ativo'` (94)

### 2. Corrigir processos de clientes inativos (migracao SQL)

Executar uma migracao para atualizar os processos vinculados a clientes inativos, mudando o status de `em_andamento` para `concluido`:

```sql
UPDATE processos 
SET status = 'concluido'
WHERE lead_id IN (
  SELECT id FROM contact_submissions 
  WHERE status_cliente = 'inativo'
)
AND status = 'em_andamento';
```

Isso vai corrigir os ~90 processos que deveriam estar como concluidos, resultando em:
- ~94 processos ativos (em_andamento) -- correspondendo aos clientes ativos
- ~90 processos concluidos -- correspondendo aos clientes inativos

### 3. Gestao de Clientes - verificar filtro

A pagina de Gestao de Clientes (`/dashboard/clientes`) ja pode estar mostrando todos os 184 se nao filtrar por `status_cliente`. Verificar e corrigir se necessario.

## Resultado esperado

| KPI | Antes | Depois |
|-----|-------|--------|
| Clientes Ativos | 184 | 94 |
| Processos Ativos | 184 | ~94 |
| Processos Concluidos | 0 | ~90 |


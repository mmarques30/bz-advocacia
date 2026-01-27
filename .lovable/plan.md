
# Plano: Corrigir Status dos Processos Baseado na Situação do Cliente

## Problema Identificado

Após análise do banco de dados:
- **89 clientes ativos** → 184 processos vinculados (todos com status `em_andamento`)
- **92 clientes inativos** → 0 processos vinculados

Os clientes inativos não possuem processos no banco de dados. Isso indica que na planilha original, esses clientes não tinham números de processo válidos nas colunas de tribunais, ou os processos não foram importados.

## Solução em Duas Partes

### Parte 1: Script SQL para Corrigir Processos Existentes

Criar migração para atualizar automaticamente o status dos processos com base no status do cliente vinculado:

```sql
-- Atualiza processos para 'concluido' quando cliente é 'inativo'
UPDATE processos p
SET status = 'concluido'
FROM contact_submissions cs
WHERE p.lead_id = cs.id
  AND cs.status_cliente = 'inativo'
  AND p.status = 'em_andamento';

-- Atualiza processos para 'em_andamento' quando cliente é 'ativo'  
UPDATE processos p
SET status = 'em_andamento'
FROM contact_submissions cs
WHERE p.lead_id = cs.id
  AND cs.status_cliente = 'ativo'
  AND p.status = 'concluido';
```

### Parte 2: Verificar Hook de Importação

O hook `useImportClientesPlanilha.ts` já está corretamente implementado:

```typescript
function getProcessoStatus(situacaoCliente: 'ativo' | 'inativo'): string {
  return situacaoCliente === 'ativo' ? 'em_andamento' : 'concluido';
}
```

O mapeamento está correto:
- Cliente **ativo** → Processo **em_andamento**
- Cliente **inativo** → Processo **concluido**

## Ação Necessária

Como não há processos para clientes inativos no banco, o script SQL de correção não terá efeito no momento. Se você reimportar a planilha ou se houver processos que deveriam ter sido criados para clientes inativos, será necessário:

1. **Opção A**: Reimportar a planilha após limpar os dados existentes
2. **Opção B**: Verificar se a planilha original realmente continha números de processo nas colunas de tribunais para os clientes inativos

## Resumo da Situação Atual

| Status Cliente | Total Clientes | Processos Vinculados | Status Esperado Processo |
|---------------|----------------|---------------------|-------------------------|
| Ativo | 89 | 184 | em_andamento ✅ |
| Inativo | 92 | 0 | concluido (sem dados) |

O código de importação está correto. O problema parece ser que a planilha original não continha números de processo válidos para os clientes inativos.

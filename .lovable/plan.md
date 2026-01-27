
# Plano: Corrigir Importação - Remover Constraint de Telefone Único

## Problema Identificado

Existe um índice único (`idx_contact_submissions_telefone`) na coluna `telefone` da tabela `contact_submissions`. Como a planilha de importação não contém telefones, todos os clientes são inseridos com `telefone: ''`, causando conflito de unicidade.

## Solução

### 1. Migração SQL - Remover Índice Único do Telefone

O índice único no telefone não faz sentido para clientes importados sem dados de contato. A solução é:

```sql
-- Remover o índice único do telefone
DROP INDEX IF EXISTS idx_contact_submissions_telefone;

-- Criar índice normal (não único) para performance de busca
CREATE INDEX IF NOT EXISTS idx_contact_submissions_telefone ON contact_submissions(telefone);
```

**Justificativa**: Clientes podem ter telefone vazio/desconhecido. A unicidade deve ser validada apenas quando o telefone for informado, não como constraint de banco.

---

### 2. Atualização do Hook de Importação

Modificar `src/hooks/useImportClientesPlanilha.ts` para gerar um identificador temporário único quando o telefone estiver vazio (caso a constraint não possa ser removida):

**Abordagem A (preferida)**: Remover constraint + deixar telefone vazio

**Abordagem B (fallback)**: Gerar telefone placeholder único:
```typescript
telefone: `IMPORTADO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
```

---

## Resumo das Alterações

| Arquivo/Recurso | Ação | Descrição |
|-----------------|------|-----------|
| **Migração SQL** | Executar | Remover índice único e criar índice normal |
| `src/hooks/useImportClientesPlanilha.ts` | Manter | Código já está correto, problema era a constraint |

---

## Resultado Esperado

Após a correção:
- A importação funcionará sem erros de constraint
- ~180 clientes serão criados com sucesso
- ~347 processos serão vinculados aos clientes
- Telefones vazios serão permitidos (para preenchimento posterior)


# Plano: Tornar E-mail Opcional no Cadastro de Clientes

## Resumo

Duas alteracoes simples para permitir cadastro sem e-mail:

## Arquivos

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/components/leads/NewLeadDialog.tsx` | Modificar | Alterar validacao Zod do campo email de obrigatorio para opcional |
| Migracao SQL | Criar | Remover constraint NOT NULL da coluna `email` na tabela `contact_submissions` |

## Detalhamento

### 1. NewLeadDialog.tsx (linha 36)

Alterar a validacao do campo email:

**De:**
```
email: z.string().email("Email inválido"),
```

**Para:**
```
email: z.string().email("Email inválido").optional().or(z.literal("")),
```

Isso permite que o campo fique vazio ou contenha um email valido.

### 2. Migracao de banco de dados

```sql
ALTER TABLE contact_submissions ALTER COLUMN email DROP NOT NULL;
ALTER TABLE contact_submissions ALTER COLUMN email SET DEFAULT '';
```

Remove a obrigatoriedade da coluna `email` no banco, permitindo insercao de registros sem e-mail e viabilizando a migracao de dados antigos.

### Campos apos a mudanca

- **Obrigatorios**: Nome completo, Telefone
- **Opcionais**: E-mail, CPF, Tipo de processo, Origem, Mensagem

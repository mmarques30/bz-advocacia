
# Plano: Adicionar Campo CPF/CNPJ no Cadastro de Leads e Clientes

## Visão Geral

O usuário solicitou a inclusão do campo CPF ou CNPJ no formulário de cadastro de leads e clientes, pois essa informação é essencial para a geração de contratos.

## Análise da Situação Atual

### Banco de Dados
A tabela `contact_submissions` **já possui** o campo `cpf` (tipo text), portanto não é necessária nenhuma migração de banco de dados.

### Tipo Lead (TypeScript)
O tipo `Lead` em `src/types/leads.ts` **não possui** o campo `cpf` declarado, mas ele existe no banco. Precisamos adicionar ao tipo.

### Formulário
O formulário `NewLeadDialog.tsx` não inclui o campo CPF/CNPJ atualmente.

## Implementação

### 1. Atualizar o Tipo Lead
**Arquivo**: `src/types/leads.ts`

Adicionar os campos de documentação pessoal que já existem no banco:

```typescript
export interface Lead {
  // ... campos existentes
  cpf: string | null;           // CPF ou CNPJ
  rg: string | null;            // RG (já existe no banco)
  nacionalidade: string | null; // (já existe no banco)
  profissao: string | null;     // (já existe no banco)
  // ... resto dos campos
}
```

### 2. Atualizar o Schema do Formulário
**Arquivo**: `src/components/leads/NewLeadDialog.tsx`

Adicionar campo `cpf_cnpj` ao schema de validação:

```typescript
const leadFormSchema = z.object({
  nome_completo: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  telefone: z.string().min(10, "Telefone inválido"),
  cpf: z.string().optional(),  // Opcional, mas importante para contratos
  // ... demais campos
});
```

### 3. Adicionar Campo no Formulário Visual
**Arquivo**: `src/components/leads/NewLeadDialog.tsx`

Adicionar o campo de input para CPF/CNPJ após o telefone:

```tsx
<FormField
  control={form.control}
  name="cpf"
  render={({ field }) => (
    <FormItem>
      <FormLabel>CPF/CNPJ</FormLabel>
      <FormControl>
        <Input placeholder="000.000.000-00 ou 00.000.000/0000-00" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### 4. Atualizar Lógica de Submit
**Arquivo**: `src/components/leads/NewLeadDialog.tsx`

Incluir o campo `cpf` no objeto enviado para criação/atualização:

```typescript
await createLead.mutateAsync({
  // ... outros campos
  cpf: values.cpf || null,
});
```

### 5. Atualizar useEffect para Edição
**Arquivo**: `src/components/leads/NewLeadDialog.tsx`

Carregar o valor do CPF quando estiver editando:

```typescript
form.reset({
  // ... outros campos
  cpf: lead.cpf || "",
});
```

## Detalhes Técnicos

### Validação Flexível (CPF ou CNPJ)
O campo aceita tanto CPF (11 dígitos) quanto CNPJ (14 dígitos) sem validação rígida de formato, permitindo:
- CPF: 000.000.000-00
- CNPJ: 00.000.000/0000-00
- Ou formato livre (sem pontuação)

### Layout do Formulário
O campo CPF/CNPJ será posicionado na mesma linha do telefone, mantendo a organização visual em 2 colunas:

```
[Nome Completo                           ]
[Email              ] [Telefone          ]
[CPF/CNPJ           ] [Tipo de Processo  ]
...
```

## Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/types/leads.ts` | Adicionar campo `cpf` ao tipo `Lead` |
| `src/components/leads/NewLeadDialog.tsx` | Adicionar campo CPF/CNPJ no schema, form e submit |

## Resultado Esperado

1. Campo CPF/CNPJ visível no formulário de cadastro de leads e clientes
2. Valor salvo na tabela `contact_submissions` no campo `cpf`
3. Valor carregado corretamente ao editar um lead/cliente
4. Campo opcional (não bloqueia cadastro se vazio)
5. Pronto para uso na geração de contratos



## Corrigir erro ao salvar modelo de proposta

### Causa raiz

A tabela `templates` tem um CHECK constraint (`templates_tipo_check`) que restringe a coluna `tipo` para apenas: `documento`, `email`, `whatsapp`, `contrato`. O valor `'proposta'` **não está na lista**, então qualquer tentativa de inserir um modelo de proposta falha com violação de constraint.

Contratos funcionam porque `tipo = 'contrato'` é permitido pelo constraint.

### Correção

**1. Migration SQL** — Alterar o CHECK constraint para incluir `'proposta'`:
```sql
ALTER TABLE public.templates DROP CONSTRAINT templates_tipo_check;
ALTER TABLE public.templates ADD CONSTRAINT templates_tipo_check 
  CHECK (tipo = ANY (ARRAY['documento','email','whatsapp','contrato','proposta','procuracao','peticao','comunicacao']));
```
Isso adiciona `proposta` e os demais tipos que já são usados no frontend (`NewTemplateDialog` e `EditTemplateDialog` usam `procuracao`, `peticao`, `comunicacao`).

**2. Melhorar feedback de erro** — Em `useModelosDocumentos.ts`, exibir a mensagem real do erro no toast ao invés do genérico "Erro ao salvar modelo":
```ts
onError: (error: any) => {
  toast.error(error?.message || 'Erro ao salvar modelo');
}
```

### Arquivos editados
- 1 migration SQL (alterar CHECK constraint)
- `src/hooks/useModelosDocumentos.ts` (melhorar mensagens de erro)


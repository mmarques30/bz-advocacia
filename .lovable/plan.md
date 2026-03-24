

## Corrigir: admin não consegue atualizar perfil de outro usuário

### Causa raiz
A tabela `profiles` tem a policy de UPDATE:
```
"Users can update their own profile" → auth.uid() = id
```
Quando o admin edita o nome da Eliziane, o UPDATE roda com o ID dela mas o `auth.uid()` é do admin logado. A policy bloqueia silenciosamente (0 rows affected, sem erro).

### Correção

**1. Migration SQL** — Adicionar policy permitindo admins atualizarem qualquer perfil:
```sql
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update own or admin can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id 
  OR has_role(auth.uid(), 'admin'::app_role)
);
```

Nenhum arquivo de código precisa ser alterado. A lógica em `useUpdateUser` já faz o `.update().eq('id', userId)` corretamente — o problema é exclusivamente de permissão no banco.


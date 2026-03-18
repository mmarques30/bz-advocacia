

## Problema

O nome do usuário logado é lido de `user.user_metadata.full_name` (cache do auth) em 3 locais, em vez da tabela `profiles` (fonte de verdade). Após editar o nome, a interface não atualiza sem logout/login.

**Arquivos afetados:**
- `src/components/UserAvatar.tsx` (linha 41)
- `src/pages/Dashboard.tsx` (linha 27)
- `src/pages/configuracoes/Perfil.tsx` (linha 16)

## Plano

### 1. Criar hook `useProfile`
Novo hook `src/hooks/useProfile.ts` que:
- Busca `profiles.nome_completo`, `profiles.email`, `profiles.telefone` usando `auth.uid()`
- Usa React Query com key `['profile', userId]`
- Expõe função `refetch` para forçar atualização após edição

### 2. Atualizar os 3 pontos de exibição

**UserAvatar.tsx**: Substituir `user?.user_metadata?.full_name` por `profile?.nome_completo` do hook. Usar `nome_completo` para as iniciais e nome exibido no dropdown.

**Dashboard.tsx**: Substituir `user?.user_metadata?.full_name` por `profile?.nome_completo` na saudação.

**Perfil.tsx**: 
- Inicializar o formulário com dados do `useProfile` (não de `user_metadata`)
- Após salvar, além de `supabase.auth.updateUser`, também fazer `UPDATE profiles SET nome_completo = ...`
- Chamar `refetch` do hook para atualizar a UI em tempo real

### 3. Corrigir nome da Eliziane no banco
Migração SQL para corrigir o nome na tabela `profiles`:
```sql
UPDATE profiles SET nome_completo = 'Eliziane Zembruski Taborda' 
WHERE email ILIKE '%liziztaborda%';
```

Nota: não é possível alterar `auth.users` via migração (schema reservado), mas o hook vai ler de `profiles` tornando isso irrelevante.

### Arquivos alterados
- `src/hooks/useProfile.ts` — novo hook
- `src/components/UserAvatar.tsx` — usar useProfile
- `src/pages/Dashboard.tsx` — usar useProfile  
- `src/pages/configuracoes/Perfil.tsx` — usar useProfile + salvar em profiles + refetch
- Migração SQL — corrigir nome Eliziane


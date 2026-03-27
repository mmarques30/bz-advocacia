

## Permitir edição de número do processo e valor da causa para todos os usuários

### Problema
Atualmente, o botão "Editar" na aba Informações do processo só aparece para admins (`useCanEditProcesso` verifica `role = 'admin'`). Todos os usuários autenticados devem poder editar.

### Solução
Remover a restrição de admin no `useCanEditProcesso`, retornando `true` para qualquer usuário autenticado.

### Alteração

**`src/hooks/useUsuarios.ts`** (linhas 349-368)
- Simplificar `useCanEditProcesso` para retornar `true` quando há um usuário logado, sem verificar role admin.

### Arquivos editados
- `src/hooks/useUsuarios.ts`

Nenhuma alteração de banco necessária — RLS da tabela `processos` já permite UPDATE para todos os autenticados.


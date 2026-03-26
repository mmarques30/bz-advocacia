

## Controle de edição por role nos campos do processo

### Contexto
Atualmente o `ProcessoInformacoesTab` permite que **qualquer** usuário autenticado edite todos os campos (incluindo número do processo e valor da causa). Não há verificação de role.

### Alterações

**1. Criar hook `useCheckUserRole` em `src/hooks/useUsuarios.ts`**
- Nova função que retorna a role do usuário (`admin`, `moderator`, `user`, etc.)
- Reutiliza o padrão existente de `useCheckIsAdmin`, mas retorna a role completa
- Alternativa mais simples: criar `useCanEditProcesso` que retorna `true` se admin ou moderator

**2. Atualizar `src/components/processos/tabs/ProcessoInformacoesTab.tsx`**
- Importar `useCheckIsAdmin` (ou o novo hook) + verificar se é admin/moderator
- O botão "Editar" só aparece se o usuário tem role admin ou moderator
- Usuários com role `user` veem a ficha apenas em modo leitura
- Na função `handleSave`, antes de chamar `updateProcesso`:
  - Comparar `editData.numero_processo` com `processo.numero_processo`
  - Comparar `editData.valor` com `processo.valor`
  - Para cada campo alterado, inserir registro em `logs_sistema` com `valor_anterior` e `valor_novo`
- Exibir toast de sucesso após salvar (já existe via `useUpdateProcesso`)

**3. Detalhe do log de auditoria**
- Inserir diretamente na tabela `logs_sistema` via supabase client
- Campos: `acao: 'editar'`, `entidade_tipo: 'processos'`, `entidade_id: processo.id`, `campo_alterado`, `valor_anterior`, `valor_novo`
- Usar a tabela `processos_historico` que já existe para esse propósito (mais adequado que `logs_sistema`)

### Arquivos editados
- `src/hooks/useUsuarios.ts` — adicionar `useCheckCanEditProcesso`
- `src/components/processos/tabs/ProcessoInformacoesTab.tsx` — role check + auditoria


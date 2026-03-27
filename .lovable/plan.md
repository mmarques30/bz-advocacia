

## Restringir edição de número do processo e valor da causa

### Problema
`useCanEditProcesso` retorna `true` para qualquer usuário autenticado. Deve restringir para admin, advogado e assistente — excluindo `financeiro`.

### Alterações

**1. `src/hooks/useUsuarios.ts`** — `useCanEditProcesso` (linhas 349-357)
- Buscar roles do usuário na tabela `user_roles`
- Retornar `true` se possuir role `admin`, `advogado` ou `assistente`
- Retornar `false` para `financeiro` ou sem role

**2. `src/components/processos/tabs/ProcessoInformacoesTab.tsx`**
- Na view de leitura (linha 87-92): manter botão "Editar" condicional a `canEdit`
- Na view de edição (linhas 190-196, 281-289): quando `!canEdit`, renderizar campos `numero_processo` e `valor` como `disabled` com classe `bg-muted` e ícone de cadeado
- Isso cobre o caso de um usuário financeiro que eventualmente acesse a tela — os campos críticos ficam bloqueados enquanto outros campos editáveis permanecem disponíveis

**Nota**: Como a role `financeiro` não deveria ter acesso ao botão "Editar" (pois `canEdit` será `false`), o cadeado nos campos individuais é uma camada de segurança adicional caso a lógica de UI mude no futuro.

### Arquivos editados
- `src/hooks/useUsuarios.ts`
- `src/components/processos/tabs/ProcessoInformacoesTab.tsx`

Nenhuma alteração de banco necessária.




# Plano: Restringir Conclusao de Tarefas as Advogadas

## Resumo

Impedir que estagiarios marquem tarefas como concluidas. Apenas Juliana e Liziane (as advogadas) podem alterar o status para "concluido". Estagiarios continuam podendo criar, visualizar e atualizar tarefas normalmente (exceto concluir).

## Como Identificar a Advogada

O sistema ja possui os usuarios cadastrados. A identificacao sera feita comparando o email do usuario logado com os emails das advogadas:

- Juliana: julianalimaborges@hotmail.com
- Liziane: liziztaborda@hotmail.com

Sera criado um hook `useIsAdvogada()` que retorna `true` se o usuario logado e uma das duas.

## Alteracoes

### 1. Novo Hook: `src/hooks/useIsAdvogada.ts`

Hook simples que verifica se o usuario logado e uma advogada:

```
const ADVOGADAS_EMAILS = [
  'julianalimaborges@hotmail.com',
  'liziztaborda@hotmail.com'
];

useIsAdvogada() => boolean
```

Usa `supabase.auth.getUser()` para obter o email do usuario logado e comparar.

### 2. Dialog de Edicao (`DemandaDetailsDialog.tsx`)

- Importar `useIsAdvogada`
- No Select de Status (modo edicao): desabilitar a opcao "Concluido" para nao-advogadas
- Exibir tooltip ou texto explicativo: "Apenas advogadas podem concluir tarefas"
- Na funcao `onSubmit`: validacao adicional bloqueando status "concluido" para nao-advogadas

### 3. Lista de Subtarefas (`SubtarefasList.tsx`)

- Importar `useIsAdvogada`
- No `handleToggle`: se o usuario nao e advogada e esta tentando marcar como concluido, exibir toast de erro e bloquear
- Desabilitar o checkbox para "concluir" se nao for advogada (permitir apenas desmarcar)

### 4. Hook de Update (`useDemandas.ts`)

- Adicionar validacao client-side no `useUpdateDemanda`: se status = "concluido" e usuario nao e advogada, bloquear com toast

### 5. Hook de Subtarefas (`useSubtarefas.ts`)

- Adicionar mesma validacao no `useUpdateSubtarefaStatus`

## Arquivos Envolvidos

| Arquivo | Acao |
|---------|------|
| `src/hooks/useIsAdvogada.ts` | **Novo** - hook de verificacao |
| `src/components/demandas/DemandaDetailsDialog.tsx` | Bloquear opcao "concluido" para estagiarios |
| `src/components/demandas/SubtarefasList.tsx` | Bloquear checkbox de conclusao para estagiarios |
| `src/hooks/useDemandas.ts` | Validacao client-side no update |
| `src/hooks/useSubtarefas.ts` | Validacao client-side no update de subtarefa |

## Resultado

- Estagiarios podem criar e atualizar tarefas (status pendente, em andamento)
- Estagiarios NAO conseguem selecionar "Concluido" no formulario
- Estagiarios NAO conseguem marcar checkbox de subtarefa como concluida
- Apenas Juliana e Liziane veem e podem usar a opcao "Concluido"
- Mensagem clara explica a restricao quando necessario




# Correção: "999d" e clique nos processos sem atualização

## Problemas

1. **"999d"**: Processos sem `data_ultima_atualizacao` (valor NULL no banco) recebem o valor padrão `999` dias. Deveria exibir algo como "Sem registro" ou "N/D".

2. **Clique não abre detalhes**: Os itens da seção "Sem Atualização" são `div` simples sem ação de clique. Ao clicar, nada acontece. Deveria abrir o diálogo de detalhes do processo (`ProcessoDetailsDialog`).

## Solução

### 1. Arquivo `src/components/dashboard/VisaoOperacional.tsx`

- Importar `ProcessoDetailsDialog` e adicionar estado para controlar qual processo está aberto
- Tornar cada item clicável com `cursor-pointer` e `onClick` que abre o diálogo de detalhes
- Tratar o badge: quando `dias_sem_atualizacao >= 999`, exibir "S/ registro" em vez de "999d"

### 2. Arquivo `src/hooks/useDashboardCompleto.ts`

- Nenhuma alteração necessária. O valor `999` continua sendo útil para ordenação, apenas o componente visual vai tratar a exibição.

## Resultado esperado

- Badge mostra "S/ registro" para processos sem data de atualização, e "45d", "32d" etc. para os demais
- Ao clicar em um processo, abre o diálogo com as abas de detalhes (Informações, Andamentos, Tarefas, etc.)

## Arquivo alterado

| Arquivo | Alteração |
|---------|-----------|
| `src/components/dashboard/VisaoOperacional.tsx` | Adicionar estado + `ProcessoDetailsDialog`, tornar itens clicáveis, tratar exibição "999d" |


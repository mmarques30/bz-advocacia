

# Mostrar processos ativos sem atualização no card "Processos e Prazos"

## Objetivo

No card "Processos e Prazos" do painel, além dos próximos prazos, exibir uma lista de processos ativos (em_andamento) que estão sem atualização de status há mais de 30 dias.

## O que muda

### 1. Hook `useDashboardCompleto.ts`

- Alterar a query #5 (processos sem atualização) para trazer os dados completos em vez de apenas a contagem (`head: true`)
- Trazer campos: `id`, `numero_processo`, `tipo`, `autor`, `reu`, `data_ultima_atualizacao`, `status`
- Limitar a 5 resultados, ordenados pela data de última atualização (mais antigo primeiro)
- Criar uma nova interface `ProcessoSemAtualizacao` com esses campos
- Adicionar o array `processosSemAtualizacao` ao retorno do hook

### 2. Componente `VisaoOperacional.tsx`

- Receber a nova prop `processosSemAtualizacao`
- No card "Processos e Prazos" (`ProcessosPrazosCard`), adicionar uma nova seção abaixo dos "Próximos Prazos"
- Título da seção: "Sem Atualização" com ícone de alerta
- Cada item mostra: número do processo (ou tipo), partes (autor vs réu), e há quantos dias está sem atualização
- Badge amarelo/vermelho indicando o tempo sem atualização (ex: "45d sem update")
- Link "Ver todos" apontando para `/dashboard/processos`

### 3. Componente `Dashboard.tsx`

- Passar a nova prop `processosSemAtualizacao` para o componente `VisaoOperacional`

## Layout da nova seção (dentro do card existente)

```text
+------------------------------------------+
| Processos e Prazos           Ver todos > |
|                                          |
| [badges: Em andamento: X | Concluídos: X]|
|                                          |
| Próximos Prazos                          |
| - Prazo 1 ................... Amanhã     |
| - Prazo 2 ................... 3d         |
|                                          |
| Sem Atualização                          |
| - Proc 001234 (Divórcio) .... 45d        |
| - Proc 005678 (Inventário) .. 32d        |
+------------------------------------------+
```

## Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useDashboardCompleto.ts` | Nova interface `ProcessoSemAtualizacao`, query #5 traz dados completos, novo campo no retorno |
| `src/components/dashboard/VisaoOperacional.tsx` | Nova prop e seção "Sem Atualização" no card de processos |
| `src/pages/Dashboard.tsx` | Passar `processosSemAtualizacao` para `VisaoOperacional` |


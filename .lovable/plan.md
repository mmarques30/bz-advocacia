
# Adicionar Edicao e Exclusao na FaturamentoTable

## Problema

A `FaturamentoTable` (usada tanto em Lancamentos quanto em Projecao de Faturamento) exibe dados da tabela `transacoes_financeiras` de forma somente leitura -- sem botoes de editar ou excluir. A `DespesasTable` ja possui essas funcionalidades.

## Solucao

Adicionar coluna de acoes na `FaturamentoTable` com botoes de editar e excluir, reutilizando componentes ja existentes no projeto:

- **Editar**: Abrir o `EditTransacaoDialog` (ja existe em `src/components/financeiro/transacoes/EditTransacaoDialog.tsx`)
- **Excluir**: Dialog de confirmacao + `useDeleteTransacao` (ja existe em `src/hooks/useTransacoesFinanceiras.ts`)

## Alteracoes

### `src/components/financeiro/FaturamentoTable.tsx`

1. Adicionar imports:
   - `useDeleteTransacao` de `useTransacoesFinanceiras`
   - `EditTransacaoDialog` de `transacoes/EditTransacaoDialog`
   - `AlertDialog` para confirmacao de exclusao
   - Icones `Pencil`, `Trash2`, `MoreHorizontal`
   - `DropdownMenu` para menu de acoes
   - `toast` de sonner

2. Adicionar states:
   - `editingTransacao` (transacao selecionada para edicao)
   - `deleteDialogOpen` e `transacaoToDelete` (controle da exclusao)

3. Buscar dados completos da transacao: ajustar o `useFaturamentoDetalhado` para retornar os campos completos necessarios para o `EditTransacaoDialog` (ou buscar sob demanda)

4. Adicionar coluna "Acoes" na tabela com `DropdownMenu` contendo:
   - "Editar" -- abre `EditTransacaoDialog`
   - "Excluir" -- abre dialog de confirmacao

5. Renderizar `EditTransacaoDialog` e `AlertDialog` de exclusao

6. Invalidar queries de faturamento apos editar/excluir

### `src/hooks/useTransacoesFinanceiras.ts`

Adicionar invalidacao das queries `faturamento-detalhado` nos hooks `useUpdateTransacao` e `useDeleteTransacao` para que a tabela atualize automaticamente apos edicao/exclusao.

### `src/hooks/useFinanceiro.ts`

Ajustar `useFaturamentoDetalhado` para retornar o objeto completo da transacao (incluindo todos os campos que o `EditTransacaoDialog` precisa), em vez de apenas os campos resumidos.

## Resultado

- A tabela de faturamento tera um menu de acoes por linha (editar/excluir)
- Editar abre o mesmo dialog usado na aba de Transacoes
- Excluir exige confirmacao antes de remover
- Funciona identicamente em Lancamentos e Projecao (mesmo componente)

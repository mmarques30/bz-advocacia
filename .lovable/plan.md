## Problema

As duas telas mostram listas diferentes porque puxam de fontes diferentes:

- **Nova Despesa / Nova Despesa Fixa** → lê de `opcoes_sistema` (grupo `categoria_despesa`) no banco — 11 itens em ordem alfabética (Aluguel, Cartão de Crédito, Contabilidade, Custas Processuais, Estacionamento, Folha de Pagamento, Honorários de Terceiros, Impostos, Tecnologia, Viagens e Deslocamentos, Outros).
- **Editar Despesa Fixa** (screenshot 1) → lê do enum hardcoded `CATEGORIA_DESPESA_LABELS` em `src/types/financeiro.ts` — 10 itens defasados (Marketing, Material de Escritório, Telefonia, Software e Licenças, Energia que não existem mais no banco).

Resultado: ao editar, o usuário vê opções que não existem no cadastro novo, pode salvar valor inválido (não bate com `opcoes_sistema`) e a etiqueta exibida na lista/relatórios pode aparecer como código bruto.

## Fix

Tornar o banco a **única fonte de verdade** em todos os pontos que exibem ou selecionam categoria de despesa.

### 1. `EditDespesaFixaDialog.tsx`
Substituir o `<Select>` hardcoded por `SearchableCombobox` alimentado por `useOpcoesSistema("categoria_despesa", true)` — mesmo padrão usado em `NewDespesaFixaDialog`.

### 2. `DespesaDetailsDialog.tsx` (edição da despesa avulsa)
Mesma troca: enum → `SearchableCombobox` com `useOpcoesSistema`.

### 3. Filtros e exibição
Para garantir que toda lista exibida (tabela, filtros, widgets, relatório do contador) mostre o label correto mesmo quando a categoria não está mais no enum:

- `DespesasFilters.tsx`, `DespesasGlobalFilters.tsx` → trocar `Object.entries(CATEGORIA_DESPESA_LABELS)` por opções vindas de `useOpcoesSistema`.
- `DespesasTable.tsx`, `DespesasWidgets.tsx`, `DespesasFixasManager.tsx`, `RelatorioContador.tsx` → usar helper que faz lookup em `opcoes_sistema` (com fallback para `CATEGORIA_DESPESA_LABELS` e por último o código bruto).

Criar/ajustar `src/lib/categoriaDespesa.ts` para expor `getCategoriaLabel(valor, opcoes)` consumindo o cache do `useOpcoesSistema`.

### 4. Enum legado
Manter `CATEGORIA_DESPESA_LABELS` em `types/financeiro.ts` apenas como fallback (para dados antigos cujo código não está mais em `opcoes_sistema`), com comentário explicando que **não deve ser usado como fonte para selects**.

## Fora do escopo

- Não vou criar/remover categorias no banco (a lista de 11 já foi consolidada).
- Não vou mexer em importação de despesas nem cálculo financeiro.

## Arquivos afetados

- `src/components/financeiro/despesas/EditDespesaFixaDialog.tsx`
- `src/components/financeiro/despesas/DespesaDetailsDialog.tsx`
- `src/components/financeiro/despesas/DespesasFilters.tsx`
- `src/components/financeiro/despesas/DespesasTable.tsx`
- `src/components/financeiro/despesas/DespesasFixasManager.tsx`
- `src/components/financeiro/DespesasGlobalFilters.tsx`
- `src/components/financeiro/DespesasWidgets.tsx`
- `src/components/financeiro/relatorios/RelatorioContador.tsx`
- `src/lib/categoriaDespesa.ts`
- `src/types/financeiro.ts` (comentário no enum)

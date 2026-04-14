

## Reestruturação do Módulo Financeiro

### Resumo
Corrigir bugs, expandir edição de parcelas, adicionar duplicação/retroatividade, simplificar filtros e adicionar "Contratos" ao sidebar. Todas as abas e sub-abas existentes são preservadas.

---

### 1. BUG: Reset de formulário após submit

**Arquivos**: `NewTransacaoDialog.tsx`, `NewEntradaFaturamentoDialog.tsx` (EntradaSimplesForm)

- `NewTransacaoDialog`: adicionar `key` baseado em contador no form para forçar remontagem dos Selects após cada submit. Incrementar o contador no `onSuccess`.
- `EntradaSimplesForm`: mesmo padrão — adicionar `key` no form com contador incrementado em `onSuccess`.

### 2. BUG: Parcelas com valores diferentes

**Arquivo**: `NewAcordoDialog.tsx`

- O preview já calcula valores arredondados com última parcela absorvendo diferença. Verificar que `handleSubmit` não tem nenhuma validação forçando igualdade.
- Remover qualquer `max` constraint no campo `valorEntrada` que limite edição.
- Permitir edição manual de valores individuais no preview antes de salvar (tornar cada célula de valor editável no preview).

### 3. Parcelas editáveis (expandir EditParcelaValorDialog)

**Arquivo**: `EditParcelaValorDialog.tsx` → renomear para `EditParcelaDialog.tsx`

Expandir o dialog para incluir:
- **Valor** (já existe)
- **Data de vencimento** (novo campo date)
- **Status**: Select com opções Pendente / Recebido / Atrasado / Cancelado
- **Data de recebimento**: campo date condicional (aparece quando status = "Recebido")

**Arquivo**: `useParcelas.ts` — `useUpdateParcela` já aceita `Partial<ParcelaFinanceira>`, então suporta os novos campos sem alteração no hook.

**Arquivo**: `AcordoDetailsDialog.tsx` — mudar o menu "Editar Valor Esperado" para "Editar Parcela" e passar todos os campos necessários ao dialog expandido.

### 4. Lançamento retroativo (data de competência)

**Arquivo**: `NewEntradaFaturamentoDialog.tsx` (EntradaSimplesForm)
- Renomear "Data de Recebimento" para "Data de Recebimento"
- Adicionar campo "Data de Competência" (date input) — separado da data de recebimento
- Salvar a data de competência como `data_primeiro_vencimento` no acordo (já existe no schema)

**Arquivo**: `NewDespesaDialog.tsx`
- Renomear campo "Data" existente para "Data de Competência"
- Adicionar campo "Data de Lançamento" (default: hoje)
- Requer **migration** para adicionar coluna `data_lancamento` na tabela `despesas`

### 5. Campo "Conta" obrigatório em todos os formulários

- `NewDespesaDialog`: ✅ já tem
- `NewEntradaFaturamentoDialog`: ✅ já tem
- `NewAcordoDialog`: ✅ já tem
- `NewTransacaoDialog`: ❌ envia `conta: null` — adicionar Select com `CONTA_LABELS`, valor default "escritorio"
- `EditTransacaoDialog`: verificar e adicionar campo Conta se ausente

### 6. Categorias de despesas

**Ação**: Inserir dados na tabela `opcoes_sistema` (tipo `categoria_despesa`) com as categorias: Aluguel, Folha de Pagamento, Marketing, Cartão de Crédito, Telefonia, Energia, Estacionamento, Contabilidade, Impostos, Tecnologia/IA, Custas Processuais, Outros.

O `NewDespesaDialog` já lê de `useOpcoesSistema('categoria_despesa')` com fallback.

### 7. Duplicar lançamento

**Arquivo**: `TransacoesTable.tsx`
- Adicionar item "Duplicar" no DropdownMenu de cada linha
- Ao clicar, abre `NewTransacaoDialog` pré-preenchido com dados da transação (exceto data)
- Adicionar props `initialData` ao `NewTransacaoDialog`

**Arquivo**: `FaturamentoTable.tsx`
- Mesmo padrão — adicionar "Duplicar" no menu de ações

### 8. Filtro padrão por ano corrente

**Arquivo**: `Financeiro.tsx`
- Alterar estado inicial: `transacoesFilters` para `{ anos: [new Date().getFullYear()] }`

**Arquivo**: `TransacoesFilters.tsx`
- Substituir o multi-select com checkboxes por um dropdown simples: 2024 / 2025 / 2026 / Todos
- Manter o seletor de período personalizado

### 9. Contratos no sidebar

**Arquivo**: `AppSidebar.tsx`
- Adicionar `{ title: "Contratos", url: "/dashboard/financeiro/acordos" }` no submenu Financeiro, entre "Análises" e "Pagamentos"

---

### Migration necessária

```sql
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS data_lancamento date DEFAULT CURRENT_DATE;
```

### Dados a inserir (opcoes_sistema)

12 registros com tipo `categoria_despesa` para as categorias padrão do escritório.

### Arquivos modificados (resumo)

| Arquivo | Alteração |
|---------|-----------|
| `AppSidebar.tsx` | Adicionar "Contratos" no submenu |
| `Financeiro.tsx` | Filtro padrão ano corrente |
| `EditParcelaValorDialog.tsx` | Expandir para editar valor + vencimento + status |
| `AcordoDetailsDialog.tsx` | Menu "Editar Parcela" |
| `NewTransacaoDialog.tsx` | Campo Conta + key reset + aceitar initialData |
| `EditTransacaoDialog.tsx` | Campo Conta |
| `TransacoesTable.tsx` | Ação "Duplicar" |
| `FaturamentoTable.tsx` | Ação "Duplicar" |
| `TransacoesFilters.tsx` | Dropdown simples de ano |
| `NewEntradaFaturamentoDialog.tsx` | Data de competência + key reset |
| `NewDespesaDialog.tsx` | Data de competência + data de lançamento |
| `NewAcordoDialog.tsx` | Remover constraints, preview editável |


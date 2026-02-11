
# Plano: Associar Lancamentos Financeiros a Contas/Responsaveis

## Resumo

Adicionar um campo "conta" (responsavel) a todos os lancamentos financeiros, permitindo controle individualizado por Juliana, Liziane ou Escritorio (compartilhada). Isso permite filtrar receitas, despesas e transacoes por conta, e visualizar KPIs segmentados.

## Contas previstas

- **Juliana** - lancamentos pessoais da advogada Juliana
- **Liziane** - lancamentos pessoais da advogada Liziane
- **Escritorio** - despesas e receitas compartilhadas do escritorio

## Alteracoes

### 1. Migracao de banco de dados

Adicionar coluna `conta` (text, nullable, default 'escritorio') nas tres tabelas financeiras:
- `acordos_financeiros` - para associar acordos/receitas a uma conta
- `despesas` - para associar despesas a uma conta
- `transacoes_financeiras` - para associar transacoes importadas a uma conta

Adicionar as opcoes de conta na tabela `opcoes_sistema` (grupo: 'conta_financeira') para que possam ser gerenciadas pela area administrativa.

### 2. Tipos TypeScript

Atualizar os tipos em `src/types/financeiro.ts`:
- Adicionar `conta` ao tipo `AcordoFinanceiro`
- Adicionar `conta` ao tipo `Despesa`
- Adicionar constante `CONTA_LABELS` com os labels das contas
- Adicionar `conta` ao tipo `KPIsFinanceiros` (nao necessario, filtro externo)

Atualizar `src/types/transacoes.ts`:
- Adicionar `conta` ao tipo `TransacaoFinanceira`
- Adicionar `conta` ao tipo `TransacoesFilters`

### 3. Filtros - Adicionar seletor de conta

Adicionar dropdown "Conta" nos seguintes filtros:
- `FaturamentoFilters.tsx` - adicionar campo `conta` ao `FaturamentoFiltersState`
- `DespesasGlobalFilters.tsx` - adicionar campo `conta` ao `DespesasGlobalFiltersState`
- `TransacoesFilters.tsx` - adicionar campo `conta` ao `TFilters`

### 4. Formularios - Adicionar campo de conta

Adicionar campo "Conta" nos formularios de criacao:
- `NewAcordoDialog.tsx` - dropdown de conta ao criar acordo
- `NewEntradaFaturamentoDialog.tsx` - dropdown de conta ao criar entrada avulsa
- `NewDespesaDialog.tsx` - dropdown de conta ao criar despesa
- `ImportFaturamentoDialog.tsx` - dropdown de conta ao importar
- `ImportDespesasDialog.tsx` - dropdown de conta ao importar

### 5. Hooks - Filtrar por conta

Atualizar hooks para respeitar o filtro de conta:
- `useFinanceiro.ts` - filtrar acordos, parcelas e KPIs por conta
- `useDespesas.ts` - filtrar despesas por conta
- `useTransacoesFinanceiras.ts` - filtrar transacoes por conta

### 6. Tabelas e visualizacoes

Adicionar coluna "Conta" nas tabelas:
- `FaturamentoTable.tsx` - exibir conta do acordo
- `DespesasTable.tsx` - exibir conta da despesa
- `TransacoesTable.tsx` - exibir conta da transacao

## Arquivos Envolvidos

| Arquivo | Acao |
|---------|------|
| Migracao SQL | ALTER TABLE + seed opcoes_sistema |
| `src/types/financeiro.ts` | Adicionar `conta` aos tipos + CONTA_LABELS |
| `src/types/transacoes.ts` | Adicionar `conta` ao TransacaoFinanceira e TransacoesFilters |
| `src/components/financeiro/FaturamentoFilters.tsx` | Adicionar filtro de conta |
| `src/components/financeiro/DespesasGlobalFilters.tsx` | Adicionar filtro de conta |
| `src/components/financeiro/transacoes/TransacoesFilters.tsx` | Adicionar filtro de conta |
| `src/components/financeiro/NewAcordoDialog.tsx` | Adicionar campo conta |
| `src/components/financeiro/NewEntradaFaturamentoDialog.tsx` | Adicionar campo conta |
| `src/components/financeiro/despesas/NewDespesaDialog.tsx` | Adicionar campo conta |
| `src/hooks/useFinanceiro.ts` | Filtrar por conta nos KPIs e queries |
| `src/hooks/useDespesas.ts` | Filtrar por conta |
| `src/hooks/useTransacoesFinanceiras.ts` | Filtrar por conta |
| `src/components/financeiro/FaturamentoTable.tsx` | Exibir coluna conta |
| `src/components/financeiro/despesas/DespesasTable.tsx` | Exibir coluna conta |
| `src/components/financeiro/transacoes/TransacoesTable.tsx` | Exibir coluna conta |

## Detalhes Tecnicos

**Migracao SQL:**
```text
-- Adicionar coluna conta nas tabelas financeiras
ALTER TABLE acordos_financeiros ADD COLUMN conta text DEFAULT 'escritorio';
ALTER TABLE despesas ADD COLUMN conta text DEFAULT 'escritorio';
ALTER TABLE transacoes_financeiras ADD COLUMN conta text DEFAULT 'escritorio';

-- Seed opcoes_sistema para contas
INSERT INTO opcoes_sistema (grupo, valor, label, ordem) VALUES
  ('conta_financeira', 'juliana', 'Conta Juliana', 1),
  ('conta_financeira', 'liziane', 'Conta Liziane', 2),
  ('conta_financeira', 'escritorio', 'Conta Escritório', 3);
```

**Constante CONTA_LABELS:**
```text
export const CONTA_LABELS: Record<string, string> = {
  juliana: 'Conta Juliana',
  liziane: 'Conta Liziane',
  escritorio: 'Conta Escritório',
};
```

**Filtro de conta nos hooks (exemplo KPIs):**
```text
// Se filtro de conta definido, filtrar acordos e parcelas
if (filters?.conta && filters.conta !== 'todos') {
  // Buscar acordo_ids da conta
  const { data: acordosDaConta } = await supabase
    .from('acordos_financeiros')
    .select('id')
    .eq('conta', filters.conta);
  
  // Filtrar parcelas apenas dos acordos dessa conta
  parcelas = parcelas.filter(p => acordoIds.includes(p.acordo_id));
}
```

**Dropdown de conta nos filtros:**
```text
<Select value={filters.conta} onValueChange={(v) => handleChange("conta", v)}>
  <SelectTrigger className="w-[160px]">
    <SelectValue placeholder="Conta" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="todos">Todas as Contas</SelectItem>
    <SelectItem value="juliana">Conta Juliana</SelectItem>
    <SelectItem value="liziane">Conta Liziane</SelectItem>
    <SelectItem value="escritorio">Conta Escritório</SelectItem>
  </SelectContent>
</Select>
```

## Resultado

- Cada lancamento financeiro (acordo, despesa, transacao importada) pode ser associado a uma conta especifica
- Filtros permitem visualizar o financeiro de cada advogada separadamente ou do escritorio
- KPIs, graficos e tabelas respeitam o filtro de conta selecionado
- Contas sao gerenciaveis pela area administrativa (via opcoes_sistema)
- Registros existentes assumem "Escritorio" como conta padrao


## Resumo dos achados

### 1. Importação Caixa B&Z — ✅ Importada, mas com observações
Verificação no banco:
- `transacoes_financeiras`: **1.187 registros** (629 receitas + 490 despesas + parciais)
- Receitas totais: **R$ 1.477.167** distribuídas entre escritório, juliana e liziane
- Despesas totais: **R$ 375.477**
- Período: dados presentes nas contas `escritorio`, `juliana`, `liziane`

⚠️ Atenção: a conta foi importada como **`liziane`** (sem o "E" inicial). O sistema usa `eliziane` em outros lugares (CONTA_LABELS). Isso pode causar registros não aparecerem em filtros que esperam `eliziane`. Vamos padronizar para `eliziane` via UPDATE.

### 2. Erro ao editar despesa — FK violation 🐛
Causa raiz em `src/hooks/useDespesas.ts` (linha 338-343):

Quando o usuário edita uma despesa importada (que vive em `transacoes_financeiras`), o código faz:
```ts
const curto = despesa.categoria.split("_")[0];  // "outros"
payload.subcategoria_codigo = curto;
```

Mas a tabela `subcategorias_financeiras` só aceita 4 valores: `clientes`, `eliziane`, `juliana`, `operacional`. Qualquer outra categoria ("outros", "aluguel", "marketing", etc.) viola a FK `transacoes_financeiras_subcategoria_codigo_fkey`.

**Fix**: parar de gravar `subcategoria_codigo` no UPDATE. A subcategoria representa de QUEM é o lançamento (sócia/escritório), não a categoria contábil. Vamos remover esse campo do payload de update — manter apenas `descricao`, `valor`, `data_transacao` e `conta`. Categoria contábil já é representada por `categoria_codigo` quando aplicável.

### 3. Nome do cliente não aparece na tabela de Contratos 🐛
Causa em `src/hooks/financeiro/acordos.ts` (linha 52-56 e 81-85):

```ts
cliente: acordo.cliente ? acordo.cliente[0] : undefined,
```

A query usa embed por FK única (`!cliente_id`) — o PostgREST retorna **objeto**, não array. Aplicar `[0]` num objeto retorna `undefined`. Por isso aparece sempre "Cliente" (fallback).

**Fix**: usar `acordo.cliente` direto (sem `[0]`). Mesma coisa para `processo`.

### 4. Campo "Percentual de Êxito" no Novo Contrato ✨
Adicionar ao `NewAcordoDialog.tsx`:
- Checkbox "Possui percentual de êxito a receber no final?"
- Quando marcado, exibir 2 campos:
  - **Percentual (%)** — ex: 30
  - **Valor base estimado (R$)** — base sobre a qual calcular (ex: valor da causa)
- Cálculo automático: `valor_exito = base * (percentual / 100)`
- Ao criar o contrato, gerar uma **parcela adicional condicional** com:
  - status `pendente` 
  - data de vencimento opcional (campo "Previsão de êxito")
  - descrição "Honorários de êxito (X%)"
- Salvar também na tabela `creditos_condicionais` (já existe, é exatamente o caso de uso) com `evento_gatilho="exito"`, vinculando ao `acordo_id` recém criado.

Isso já lança automaticamente no financeiro como crédito previsto, sem inflar projeções até a ativação.

### 5. Erros de build pré-existentes (corrigir junto)
- `useOpcoesSistema.ts`: `GrupoOpcao` não inclui `'fase_processo'` → adicionar.
- `useLeadsCsv.ts`: `CsvLead` não tem `nome_completo` → `LeadsCsvTable` deve usar `l.nome` (campo correto).

## Plano de implementação

1. **Banco**: padronizar `liziane` → `eliziane` em `transacoes_financeiras.conta` e `subcategoria_codigo` (insert tool).
2. **`src/hooks/useDespesas.ts`**: remover `subcategoria_codigo` do `despesaToTransacaoPayload`. Adicionar `categoria_codigo` somente se for um valor mapeável conhecido (senão omitir).
3. **`src/hooks/financeiro/acordos.ts`**: trocar `acordo.cliente[0]` por `acordo.cliente` e `acordo.processo[0]` por `acordo.processo` (linhas 54-55 e 83-84).
4. **`src/components/financeiro/NewAcordoDialog.tsx`**: adicionar bloco de "Percentual de êxito" (checkbox + 2 inputs + data prevista) com cálculo em tempo real.
5. **`src/hooks/useFinanceiro.ts` / `useCreateAcordo`**: aceitar campos opcionais `exito_percentual`, `exito_base`, `exito_data_prevista` e, se presentes, criar registro em `creditos_condicionais` após inserir o acordo.
6. **`src/hooks/useOpcoesSistema.ts`**: incluir `'fase_processo'` em `GrupoOpcao`.
7. **`src/components/leads/LeadsCsvTable.tsx`**: trocar `l.nome_completo` → `l.nome` (linhas 145 e 163).

Sem mudanças de schema necessárias — `creditos_condicionais` já existe com a estrutura adequada.

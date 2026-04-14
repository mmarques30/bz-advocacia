

## Inserção de Dados Financeiros — Jan, Fev, Mar 2026 (+ Abril parcial)

### Mapeamento para tabela `transacoes_financeiras`

Com base na estrutura existente:
- **categoria_codigo**: `pj` (despesas escritório) ou `pf` (despesas pessoais e receitas)
- **subcategoria_codigo**: `operacional` (despesas PJ), `eliziane`, `juliana` (conforme conta)
- **tipo_codigo**: `receita` ou `despesa`
- **conta**: `escritorio`, `juliana`, ou `liziane` (Eliziane)
- **descricao**: Nome do lançamento com categoria entre parênteses para despesas

A tabela `transacoes_financeiras` não tem coluna `created_by`, então esse campo será ignorado.

### Execução

Serão inseridos **~105 registros** via ferramenta de inserção SQL, divididos em 6 lotes:

1. **Janeiro despesas** (15 registros) — PJ escritório + PF Juliana
2. **Janeiro receitas** (18 registros) — Eliziane + Juliana
3. **Fevereiro despesas** (18 registros) — PJ + PF Eliziane + PF Juliana
4. **Fevereiro receitas** (19 registros) — Eliziane + Juliana
5. **Março despesas** (23 registros) — PJ + PF Eliziane + PF Juliana
6. **Março receitas + Abril** (19 registros) — Eliziane + Juliana + Abril

### Nenhuma alteração de código ou schema
Apenas inserção de dados nas tabelas existentes.


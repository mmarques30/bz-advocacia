

## Diagnóstico

O gráfico "Despesas por Categoria" está vazio porque o hook `useDespesasPJPorCategoria` (em `src/hooks/useVisaoGeralFinanceiro.ts`, linhas 233-256) filtra apenas `categoria_codigo === "pj"`, mas a migration anterior **renomeou** as despesas para códigos contábeis específicos (`aluguel`, `marketing`, `software`, `impostos`, `salarios`, `honorarios`, `telefonia`, `energia`, `outros`). 

Distribuição atual em `transacoes_financeiras`:
- **2026**: 57 despesas, **0 em `pj`** — todas já reclassificadas → gráfico vazio
- **2025**: 163 despesas em `pj` (não tinham categoria entre parênteses) + 283 em `pf` (despesas pessoais)

Resultado: no ano 2026 (default da tela), o filtro retorna zero linhas.

## Correção

### 1. `src/hooks/useVisaoGeralFinanceiro.ts` (linhas 233-256)

Trocar a estratégia do hook para:

- **Incluir todas as despesas PJ**: aceitar `categoria_codigo IN ('pj', 'aluguel', 'marketing', 'software', 'impostos', 'salarios', 'honorarios', 'telefonia', 'energia', 'outros')` — basicamente, tudo que **não é** `pf` (despesa pessoal das sócias).
- **Resolver o label**: quando `categoria_codigo` for um código contábil válido, usar `resolveCategoriaLabel(categoria_codigo)` (helper já existente em `src/lib/categoriaDespesa.ts`). Quando for `pj` puro, cair no `extrairCategoriaDaDescricao(descricao)` legado.
- Manter ordenação por valor desc.

Pseudocódigo:
```ts
const despesasPJ = transacoes.filter(t =>
  t.tipo_codigo === "despesa" && t.categoria_codigo !== "pf"
);
for (const d of despesasPJ) {
  const cat = (d.categoria_codigo && d.categoria_codigo !== "pj")
    ? resolveCategoriaLabel(d.categoria_codigo)
    : extrairCategoriaDaDescricao(d.descricao || "");
  categorias.set(cat, (categorias.get(cat) || 0) + Number(d.valor));
}
```

### 2. `src/components/financeiro/visao-geral/DespesasPorCategoriaChart.tsx`

Ampliar o mapa `COLORS` para cobrir os novos labels que agora vão aparecer ("Software/Licenças", "Honorários de Terceiros", "Telefonia/Internet", "Energia/Água", "Salários/Encargos", "Aluguel e Condomínio"). Usar paleta consistente com tokens de design. Fallback para "Outros" continua.

### 3. Validação

Após a mudança, no ano 2026 o gráfico deve mostrar 9 categorias (Outros, Software/Licenças, Marketing, Aluguel, Impostos, Salários, Honorários, Telefonia, Energia). No ano 2025 deve mostrar as despesas hoje em `pj` agrupadas por keyword (Cartão de Crédito, Aluguel, etc. via `extrairCategoriaDaDescricao`).

## Áreas tocadas
- `src/hooks/useVisaoGeralFinanceiro.ts` (1 função)
- `src/components/financeiro/visao-geral/DespesasPorCategoriaChart.tsx` (mapa COLORS)
- Sem mudanças de banco, sem mudanças de schema.




## Plano: Extrair categoria contábil das descrições

### Diagnóstico final
1. ✅ **Datas corretas** — período é mesmo 2023 a mar/2026.
2. 🐛 **Categoria contábil perdida na importação** — está dentro da descrição como `"Nexus (Contabilidade)"`, `"Claro (Telefonia)"`, `"Auxiliadora Predial (Aluguel)"`. O campo `categoria_codigo` só guarda `pf`/`pj`, inutilizando o gráfico de despesas por categoria.
3. ❓ **Gap em 2024** — mar a dez/24 têm só 4-10 lançamentos/mês. Pode ser real (escritório em outro sistema na época) ou abas não importadas. Vou perguntar antes de mexer.

### O que vou fazer

**Passo 1 — Mapear categorias do XLSX**
Reler o arquivo `Caixa_BeZ_-_2025_5.xlsx` em modo default (com pandas) para listar todas as categorias únicas que aparecem entre parênteses nas descrições (Aluguel, Marketing, Telefonia, Impostos, Energia, Folha de Pagamento, Tecnologia/IA, Custas Processuais, Cartão de Crédito, Estacionamento, Contabilidade, Serviços, Outros, etc.).

**Passo 2 — Criar mapa categoria → enum do sistema**
Verificar o enum `CategoriaDespesa` em `src/types/financeiro.ts` e mapear cada categoria PT-BR encontrada para o código correspondente (ex: "Aluguel" → `aluguel_condominio`, "Telefonia" → `telefonia_internet`). Categorias sem match no enum ficam como `outros`.

**Passo 3 — UPDATE em lote no banco**
Rodar `UPDATE transacoes_financeiras` que:
- Extrai conteúdo entre `(...)` no final da `descricao` via regex
- Mapeia para `categoria_codigo` correto via `CASE WHEN`
- Limpa a descrição removendo o sufixo `" (Categoria)"`
- Aplica só nas 503 despesas afetadas

**Passo 4 — Validar**
Após o update, conferir distribuição por categoria e amostrar 10 linhas para confirmar que descrição ficou limpa e categoria está correta.

### Pergunta única antes de executar
O gap em **2024 (março a dezembro)** é esperado, ou existe alguma aba/planilha histórica que não foi importada e precisa ser?

### Arquivos / áreas tocadas
- Apenas dados em `transacoes_financeiras` (UPDATE via insert tool).
- Sem mudanças de schema.
- Sem mudanças de código (o frontend já lê `categoria_codigo` corretamente — só está vazio de conteúdo útil hoje).



# Plano: Correção do Gráfico "Receitas vs Despesas" e Seleção Múltipla de Anos

## Visão Geral do Problema

O gráfico "Receitas vs Despesas" não exibe dados quando um ano específico é selecionado, e o sistema atual só permite selecionar um único ano por vez. 

### Problemas Identificados:
1. **Bug no filtro de ano**: Quando um ano é selecionado no filtro, a lógica define `dataInicio` e `dataFim` mas deixa `ano: undefined` - porém o hook `useResumoMensal` usa `filters.ano` para buscar dados
2. **Falta de flexibilidade**: O filtro só permite selecionar um ano ou "Todos" - não há opção de selecionar múltiplos anos
3. **Lista de anos estática**: Atualmente usa apenas os últimos 4 anos fixos

## Solução Proposta

### Arquitetura da Mudança

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    TransacoesFilters.tsx                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Multi-Select de Anos (usando Popover + Checkbox)            │   │
│  │ - Carrega anos dinamicamente do banco de dados              │   │
│  │ - Permite marcar/desmarcar múltiplos anos                   │   │
│  │ - "Todos" desmarca todos e retorna dados completos          │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    TransacoesFilters (tipo)                         │
│  ano: number | undefined  →  anos: number[] | undefined             │
│  (mantém dataInicio/dataFim para calendário personalizado)          │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Hooks Afetados                                   │
│  ┌────────────────────┐  ┌────────────────────────────────────┐    │
│  │ useTransacoes      │  │ useKPIsTransacoes                  │    │
│  │ useResumoMensal    │  │ useResumoAnual (novo param: anos)  │    │
│  │ useReceitasPorResp │  │                                    │    │
│  └────────────────────┘  └────────────────────────────────────┘    │
│  Alteração: .in("ano", anos) em vez de .eq("ano", ano)              │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    TransacoesCharts.tsx                             │
│  Lógica de visualização:                                            │
│  - 0 anos ou "Todos" → Gráfico por ANO (resumo anual)               │
│  - 1 ano selecionado → Gráfico por MÊS (12 meses do ano)            │
│  - 2+ anos → Gráfico por ANO (comparando anos selecionados)         │
└─────────────────────────────────────────────────────────────────────┘
```

## Etapas de Implementação

### 1. Atualizar Tipo `TransacoesFilters`
**Arquivo**: `src/types/transacoes.ts`

Alterar o campo `ano` de `number | undefined` para `anos: number[] | undefined` para suportar seleção múltipla.

### 2. Criar Hook para Buscar Anos Disponíveis
**Arquivo**: `src/hooks/useTransacoesFinanceiras.ts`

Adicionar um novo hook `useAnosDisponiveis` que busca os anos únicos existentes na tabela `transacoes_financeiras`:

```typescript
export function useAnosDisponiveis() {
  return useQuery({
    queryKey: ["anos-disponiveis-transacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transacoes_financeiras")
        .select("ano")
        .limit(10000);
      
      if (error) throw error;
      
      const anosUnicos = [...new Set((data || []).map(t => t.ano))];
      return anosUnicos.sort((a, b) => b - a); // Ordenar decrescente
    },
  });
}
```

### 3. Atualizar Hooks de Dados para Suportar Múltiplos Anos
**Arquivo**: `src/hooks/useTransacoesFinanceiras.ts`

Modificar `useTransacoes`, `useKPIsTransacoes`, `useResumoMensal`, `useResumoAnual` e `useReceitasPorResponsavel` para usar `.in("ano", anos)` quando houver array de anos:

```typescript
// Exemplo em useTransacoes
if (filters.anos && filters.anos.length > 0 && !filters.dataInicio && !filters.dataFim) {
  query = query.in("ano", filters.anos);
}
```

### 4. Criar Componente Multi-Select para Anos
**Arquivo**: `src/components/financeiro/transacoes/TransacoesFilters.tsx`

Substituir o `Select` simples por um Popover com Checkboxes para permitir seleção múltipla:

- Usar `Popover` + `PopoverContent` para o dropdown
- Listar anos disponíveis com `Checkbox` para cada um
- Botão "Todos" que desmarca todos os anos (mostra visão anual completa)
- Exibir no trigger quais anos estão selecionados (ex: "2024, 2025" ou "Todos")

### 5. Corrigir Lógica do Gráfico
**Arquivo**: `src/components/financeiro/transacoes/TransacoesCharts.tsx`

Atualizar a lógica de exibição:

```typescript
// Determinar modo de visualização
const anosLength = filters?.anos?.length || 0;

// 0 anos OU nenhum filtro → mostrar gráfico anual completo
// 1 ano → mostrar gráfico mensal daquele ano
// 2+ anos → mostrar gráfico anual comparando os anos selecionados
const showMonthlyChart = anosLength === 1;
const anoParaMensal = showMonthlyChart ? filters.anos[0] : undefined;
```

### 6. Atualizar Hook `useResumoAnual` para Aceitar Filtro de Anos
**Arquivo**: `src/hooks/useTransacoesFinanceiras.ts`

Modificar para aceitar parâmetro opcional de anos:

```typescript
export function useResumoAnual(anos?: number[]) {
  return useQuery({
    queryKey: ["resumo-anual-transacoes", anos],
    queryFn: async () => {
      let query = supabase
        .from("transacoes_financeiras")
        .select("ano, tipo_codigo, valor");
      
      if (anos && anos.length > 0) {
        query = query.in("ano", anos);
      }
      
      const { data, error } = await query.limit(10000);
      // ... restante da lógica
    },
  });
}
```

### 7. Atualizar KPIs para Refletir Anos Selecionados
**Arquivo**: `src/components/financeiro/transacoes/TransacoesKPIs.tsx`

Ajustar o label dinâmico para mostrar os anos selecionados:

```typescript
const getFilterLabel = () => {
  if (filters?.dataInicio && filters?.dataFim) {
    return `${format(filters.dataInicio)} - ${format(filters.dataFim)}`;
  }
  if (filters?.anos && filters.anos.length > 0) {
    if (filters.anos.length <= 2) {
      return filters.anos.join(", ");
    }
    return `${filters.anos.length} anos`;
  }
  return "Tudo";
};
```

### 8. Atualizar a Página Financeiro.tsx
**Arquivo**: `src/pages/Financeiro.tsx`

Ajustar o estado inicial dos filtros para usar o novo formato:

```typescript
const [transacoesFilters, setTransacoesFilters] = useState<TFilters>({
  anos: undefined, // undefined = todos os anos
});
```

## Detalhes Técnicos

### Mudança no Tipo TransacoesFilters

```typescript
// ANTES
export interface TransacoesFilters {
  ano?: number;
  dataInicio?: Date;
  dataFim?: Date;
  tipo_codigo?: string;
  categoria_codigo?: string;
  subcategoria_codigo?: string;
}

// DEPOIS
export interface TransacoesFilters {
  anos?: number[];  // Array de anos selecionados
  dataInicio?: Date;
  dataFim?: Date;
  tipo_codigo?: string;
  categoria_codigo?: string;
  subcategoria_codigo?: string;
}
```

### Lógica de Query com Múltiplos Anos

```typescript
// Em todos os hooks que filtram por ano:
if (filters.anos && filters.anos.length > 0 && !filters.dataInicio && !filters.dataFim) {
  query = query.in("ano", filters.anos);
}
// Se dataInicio/dataFim estão definidos, usa período personalizado
// Se anos está vazio ou undefined, retorna todos os dados
```

### Interface do Multi-Select

O componente terá:
- Botão trigger mostrando "2025, 2024" ou "Todos" ou "3 anos"
- Popover com lista de checkboxes para cada ano
- Opção "Limpar" para selecionar "Todos"
- Anos carregados dinamicamente do banco

## Arquivos a Serem Modificados

| Arquivo | Modificação |
|---------|-------------|
| `src/types/transacoes.ts` | Alterar `ano` para `anos: number[]` |
| `src/hooks/useTransacoesFinanceiras.ts` | Adicionar `useAnosDisponiveis`, atualizar todos os hooks de query |
| `src/components/financeiro/transacoes/TransacoesFilters.tsx` | Substituir Select por Multi-Select com Popover |
| `src/components/financeiro/transacoes/TransacoesCharts.tsx` | Corrigir lógica de visualização mensal/anual |
| `src/components/financeiro/transacoes/TransacoesKPIs.tsx` | Atualizar labels para múltiplos anos |
| `src/pages/Financeiro.tsx` | Atualizar estado inicial dos filtros |

## Resultado Esperado

1. **Ao selecionar "Todos"**: Gráfico mostra colunas por ano com todos os dados históricos
2. **Ao selecionar 1 ano (ex: 2025)**: Gráfico mostra os 12 meses daquele ano com dados corretos
3. **Ao selecionar 2+ anos**: Gráfico mostra colunas comparando os anos selecionados
4. **KPIs e tabela**: Sempre refletem os anos selecionados
5. **Anos no filtro**: Carregados automaticamente do banco de dados

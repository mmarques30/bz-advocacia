
# Corrigir Filtros do Calendario e Prazos

## Problema

Os filtros "Todos", "Prazos", "Tarefas" e "Rotinas" no calendario nao afetam a visualizacao do calendario em si -- apenas a lista abaixo muda. Os marcadores coloridos no calendario continuam mostrando todos os tipos independente do filtro selecionado. Alem disso, o dialog ao clicar em um dia tambem nao respeita o filtro.

## Causa raiz

- `itensPorData` (que alimenta os modifiers do calendario) e calculado a partir de `todosItens` (sem filtro)
- Os modifiers `diasUrgentes`, `diasAlerta`, etc. tambem usam `itensPorData` sem filtro
- O dialog `itensDoDialog` busca de `itensPorData` sem filtro

## Correcao

### Arquivo: `src/pages/processos/Calendario.tsx`

**1. Criar `itensFiltradosPorTipo`** -- uma lista intermediaria que filtra apenas pelo tipo (sem filtro de status), para alimentar o calendario e o dialog:

```typescript
const itensFiltradosPorTipo = useMemo(() => {
  if (filtroTipo === "todos") return todosItens;
  const tipoSingular = filtroTipo.slice(0, -1); // "prazos" -> "prazo"
  return todosItens.filter(item => item.tipo === tipoSingular);
}, [todosItens, filtroTipo]);
```

**2. Alterar `itensPorData`** para usar `itensFiltradosPorTipo` em vez de `todosItens`:

```typescript
const itensPorData = useMemo(() => {
  const mapa = new Map<string, CalendarioItem[]>();
  itensFiltradosPorTipo.forEach((item) => { ... });
  return mapa;
}, [itensFiltradosPorTipo]);
```

**3. Alterar `itensFiltrados`** (lista abaixo) para filtrar a partir de `itensFiltradosPorTipo` aplicando o filtro de status:

```typescript
const itensFiltrados = useMemo(() => {
  return itensFiltradosPorTipo.filter((item) => {
    // aplicar apenas filtro de status
    ...
  });
}, [itensFiltradosPorTipo, filtroStatus]);
```

Isso garante que tanto o calendario (cores/marcadores), o dialog (ao clicar no dia) e a lista (abaixo) reflitam o filtro de tipo selecionado.

### Resultado esperado

- Selecionar "Prazos": calendario mostra apenas dias com prazos, lista mostra apenas prazos
- Selecionar "Tarefas": calendario mostra apenas dias com tarefas, lista mostra apenas tarefas
- Selecionar "Rotinas": calendario mostra apenas dias com rotinas, lista mostra apenas rotinas
- Selecionar "Todos": comportamento atual (mostra tudo)

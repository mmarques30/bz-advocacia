

# Plano: Busca por Cliente e Dropdown no Header de Processos

## Resumo

Tres mudancas no header da pagina de Processos (`/dashboard/processos`):

1. **Reduzir o campo de busca** -- remover `flex-1` e limitar a largura maxima
2. **Busca por nome do cliente e numero do processo** -- o campo de busca atual so filtra por `numero_processo` e `tipo`; passar a incluir o nome do cliente vinculado
3. **Dropdown de filtro por cliente** -- adicionar um Select no header para filtrar processos por cliente especifico

---

## Arquivos a Modificar

| Arquivo | Descricao |
|---------|-----------|
| `src/components/processos/ProcessosHeader.tsx` | Reduzir campo de busca, adicionar dropdown de cliente |
| `src/hooks/useProcessos.ts` | Alterar a logica de busca para incluir nome do cliente |

---

## Detalhamento Tecnico

### 1. ProcessosHeader.tsx

- Campo de busca: trocar `flex-1 min-w-[300px]` por `max-w-xs` (largura reduzida)
- Placeholder atualizado: "Buscar por numero ou cliente..."
- Adicionar dropdown `Select` de clientes entre o campo de busca e o botao de filtros
  - Busca clientes com `estagio = 'fechado'` (mesmo padrao do `ProcessosFilters`)
  - Opcao "Todos os clientes" como default
  - Ao selecionar, atualiza `filters.cliente_id`

### 2. useProcessos.ts

A busca atual faz:
```
numero_processo.ilike.%search%,tipo.ilike.%search%
```

Como o hook ja faz select com join na tabela `contact_submissions`, a busca por nome do cliente sera feita **client-side** apos receber os dados, ja que o Supabase nao suporta `.or()` em colunas de tabelas relacionadas diretamente.

Alternativa: fazer a busca em duas etapas:
1. Buscar IDs de clientes cujo nome contem o termo de busca
2. Incluir `lead_id.in.(ids)` no OR da query

Essa segunda abordagem sera usada para manter a filtragem no servidor.


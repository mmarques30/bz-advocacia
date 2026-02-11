
# Plano: Adicionar Dropdown de Filtro por Nome de Cliente no Header de Clientes

## Problema

O header da pagina de Clientes (`LeadsHeader.tsx`) nao possui um dropdown para filtrar clientes por nome. O dropdown de filtro por cliente foi implementado apenas na pagina de Processos (`ProcessosHeader.tsx`).

## Solucao

Adicionar um `Select` dropdown no `LeadsHeader.tsx` que aparece apenas quando `isClienteTab` e `true`, permitindo filtrar a lista de clientes por nome.

## Arquivos a Modificar

| Arquivo | Descricao |
|---------|-----------|
| `src/components/leads/LeadsHeader.tsx` | Adicionar props e dropdown de filtro por cliente |
| `src/pages/Clientes.tsx` | Passar as novas props e aplicar filtro por cliente selecionado |

## Detalhamento Tecnico

### 1. LeadsHeader.tsx

- Adicionar props opcionais:
  - `clienteFilterId?: string | null` -- ID do cliente selecionado
  - `onClienteFilterChange?: (id: string | null) => void` -- callback ao trocar
- Buscar lista de clientes (`contact_submissions` com `estagio = 'fechado'`) usando `useEffect` + query do Supabase
- Renderizar um `Select` entre o botao "Importar" e o campo de busca, somente quando `isClienteTab` for `true`
  - Opcao padrao: "Todos os clientes"
  - Demais opcoes: nome de cada cliente, ordenado alfabeticamente

### 2. Clientes.tsx

- Adicionar estado `clienteFilterId` (string | null)
- Passar `clienteFilterId` e `onClienteFilterChange` para o `LeadsHeader`
- Filtrar os resultados de `useLeads` localmente pelo `clienteFilterId` antes de passar para a tabela/kanban (ou adicionar ao objeto de filtros se o hook suportar)

## Resultado

Na pagina de Gestao de Clientes, ao lado do botao Importar, aparecera um dropdown "Todos os clientes" que permite selecionar um cliente especifico para filtrar a lista.

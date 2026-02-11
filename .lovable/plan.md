
# Adicionar filtros rapidos de Nome e Origem na barra de Leads

## O que muda

Na barra do header de Leads (`LeadsHeader`), adicionar dois selects (dropdowns) logo apos o botao "Importar":

1. **Filtro por Nome** - Select com lista dos nomes dos leads disponiveis, permitindo filtrar por um lead especifico
2. **Filtro por Origem** - Select com as origens cadastradas (Google, Facebook, Instagram, etc.), usando as constantes ja existentes em `ORIGEM_LABELS`

Alem disso, reduzir a largura maxima da barra de pesquisa de `max-w-md` para `max-w-xs`.

## Alteracoes

### 1. `src/components/leads/LeadsHeader.tsx`

- Adicionar props `origemFilter` e `onOrigemFilterChange` para o filtro de origem
- Adicionar props `nomeFilter` e `onNomeFilterChange` para o filtro de nome
- Buscar nomes unicos dos leads no banco (`contact_submissions`) para popular o select de nomes (quando nao for aba de clientes)
- Renderizar dois `Select` apos o botao Importar:
  - Select "Todos os nomes" com lista de nomes
  - Select "Todas as origens" com opcoes de `ORIGEM_LABELS`
- Reduzir barra de pesquisa de `max-w-md` para `max-w-xs`

### 2. `src/pages/Leads.tsx`

- Adicionar estados `nomeFilter` e `origemFilter` (ambos `string | null`)
- Passar esses estados como props para `LeadsHeader`
- Integrar os filtros com o estado de `filters` existente: quando `origemFilter` muda, atualizar `filters.origem`; quando `nomeFilter` muda, atualizar `filters.search`

## Detalhes tecnicos

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/leads/LeadsHeader.tsx` | Adicionar 2 selects (nome e origem), buscar nomes do banco, reduzir largura da pesquisa |
| `src/pages/Leads.tsx` | Adicionar estados dos filtros rapidos e conectar ao LeadsHeader |

Os selects seguem o mesmo padrao visual ja usado no filtro de clientes existente no componente (linhas 102-118).



## Identificação e filtro de clientes sem WhatsApp

### Alterações

**1. `src/components/clientes/ClientesFilters.tsx`**
- Adicionar `semWhatsapp: boolean` ao `ClientesFiltersType`
- Adicionar seção "Dados Cadastrais" antes dos demais filtros com checkbox "Sem WhatsApp cadastrado"
- Incluir no `handleClearFilters` e no count de filtros ativos

**2. `src/pages/Clientes.tsx`**
- Adicionar `semWhatsapp: false` ao estado inicial de filtros
- Aplicar filtro client-side no `filteredLeads`: quando `semWhatsapp === true`, filtrar leads onde `!lead.telefone || lead.telefone.trim() === ''`
- Incluir `clientesFilters.semWhatsapp` no cálculo de `activeFiltersCount`

**3. `src/components/leads/ClientesTable.tsx`**
- Importar `AlertTriangle` do lucide-react e `Tooltip/TooltipTrigger/TooltipContent/TooltipProvider` do ui
- Na coluna Nome: exibir ícone `AlertTriangle` (amarelo, pequeno) ao lado do nome quando `!lead.telefone`, com tooltip "WhatsApp não cadastrado"
- Na coluna WhatsApp: quando telefone vazio, em vez de `-`, exibir o botão `MessageCircle` desabilitado (opacity reduzida) com tooltip "WhatsApp não cadastrado — edite o cliente para adicionar"

### Arquivos editados
- `src/components/clientes/ClientesFilters.tsx`
- `src/pages/Clientes.tsx`
- `src/components/leads/ClientesTable.tsx`

Nenhuma alteração de banco necessária.


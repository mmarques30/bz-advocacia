

## Corrigir campo "Processo Relacionado" nos formulários de demandas

### Problema
- **NewDemandaDialog**: Não permite buscar processo diretamente; exige selecionar cliente antes.
- **DemandaDetailsDialog**: Tem autocomplete mas não busca por nome do cliente e não tem debounce.

### Solução

Criar um componente reutilizável `ProcessoSearchInput` e usá-lo em ambos os dialogs.

#### 1. Novo componente `src/components/demandas/ProcessoSearchInput.tsx`
- Input com ícone de busca e botão de limpar
- Debounce de 300ms no termo de busca
- Query busca na tabela `processos` com join em `contact_submissions` (nome_completo), filtrando por `numero_processo.ilike` OR via subquery no nome do cliente
- Dropdown mostra: número do processo + nome do cliente
- Props: `value` (processo_id), `onChange` (processo_id), `disabled`
- Ao abrir com valor pré-existente, carrega o label do processo selecionado
- Clique fora fecha o dropdown

#### 2. Atualizar `NewDemandaDialog`
- Remover o fluxo de busca por cliente (estados `clienteSearch`, `selectedClienteId`, `selectedClienteNome`, query de clientes)
- Substituir toda a seção "Cliente / Processo Relacionado" pelo `ProcessoSearchInput`
- Manter o `lead_id` implícito via `processo.lead_id` (já salva apenas `processo_id`)

#### 3. Atualizar `DemandaDetailsDialog`
- Remover os estados locais de busca de processo (`processoSearch`, `showProcessoDropdown`, `selectedProcessoLabel`, `processoDropdownRef`, queries)
- Substituir o bloco de busca (linhas 358-430) pelo `ProcessoSearchInput`
- Na visualização (não edição), manter a exibição atual do processo

### Arquivos
- `src/components/demandas/ProcessoSearchInput.tsx` — novo
- `src/components/demandas/NewDemandaDialog.tsx` — simplificar
- `src/components/demandas/DemandaDetailsDialog.tsx` — simplificar


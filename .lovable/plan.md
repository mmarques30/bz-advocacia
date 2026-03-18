

## Problema Identificado

O campo "Processo Relacionado" no **DemandaDetailsDialog** (modo edição, linhas 314-329) usa um `<Select>` simples que carrega até 100 processos sem busca. Não é possível digitar para filtrar.

O **NewDemandaDialog** já tem um fluxo correto: busca cliente por nome → seleciona processo do cliente. Mas o dialog de edição não replica esse padrão.

## Plano

### 1. Migração: Criar índice para busca por número do processo
- `CREATE INDEX IF NOT EXISTS idx_processos_numero ON processos (numero_processo);`

### 2. Substituir Select por Combobox com busca no DemandaDetailsDialog
No formulário de edição (linhas 314-329), substituir o `<Select>` por um campo de busca com autocomplete que:
- Permite digitar parte do número do processo ou nome do cliente (via `lead_id` → `contact_submissions.nome_completo`)
- Busca na tabela `processos` com join em `contact_submissions` para mostrar "Número - Cliente"
- Usa um dropdown customizado (mesmo padrão do campo de cliente no NewDemandaDialog)
- Mantém opção "Nenhum processo" para desvincular

### 3. Detalhes técnicos
- Query de busca: `processos` com `.select('id, numero_processo, tipo, lead_id, contact_submissions!lead_id(nome_completo)')` filtrando por `ilike` no `numero_processo` ou no nome do cliente
- Estado local: `processoSearch`, `showProcessoDropdown`, `selectedProcessoLabel`
- Pré-carregar o processo atual da demanda para exibir o label correto ao abrir
- Salvar `processo_id` no submit (sem mudança no hook `useUpdateDemanda`)

### Arquivos alterados
- `src/components/demandas/DemandaDetailsDialog.tsx` — substituir Select por combobox com busca
- Migração SQL — índice em `processos.numero_processo`


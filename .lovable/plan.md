

## Adicionar data de nascimento e funcionalidade de aniversário

### Resumo
Adicionar campo `data_nascimento` ao cadastro de leads/clientes, com filtro de aniversariantes, ícone de bolo na tabela, contagem no dashboard e banner de parabéns na aba de mensagens.

### Alterações

**1. Migração de banco de dados**
- Adicionar coluna `data_nascimento DATE NULL` à tabela `contact_submissions`

**2. `src/types/leads.ts`**
- Adicionar `data_nascimento: string | null` à interface `Lead`

**3. `src/components/leads/NewLeadDialog.tsx`**
- Adicionar campo `data_nascimento` ao schema zod (string opcional, formato date)
- Adicionar input de data (DatePicker ou input type="date") na seção de dados pessoais, após CPF
- Incluir campo no `reset()` e no `onSubmit` (create/update)

**4. `src/components/clientes/ClientesFilters.tsx`**
- Adicionar campo `aniversariantes` ao tipo `ClientesFiltersType` com valores: `'hoje' | 'semana' | 'mes' | null`
- Renderizar seção "Aniversariantes" com 3 checkboxes (Hoje / Esta semana / Este mês)

**5. `src/pages/Clientes.tsx`**
- Adicionar lógica de filtragem client-side por dia/mês de `data_nascimento` (ignorando ano)
- Contabilizar `aniversariantes` no `activeFiltersCount`

**6. `src/components/leads/ClientesTable.tsx`**
- Importar ícone `Cake` do lucide-react
- Na coluna de nome, verificar se dia/mês de `data_nascimento` === hoje → exibir ícone de bolo com tooltip "Aniversariante hoje"

**7. `src/hooks/useDashboardPrincipal.ts`**
- Adicionar query para contar clientes com `estagio = 'fechado'` cujo dia/mês de `data_nascimento` === hoje
- Adicionar `aniversariantesHoje: number` ao `DashboardPrincipalData`

**8. `src/pages/Dashboard.tsx`**
- No KPI "Clientes ativos", adicionar linha de contexto clicável "X aniversariantes hoje" que navega para `/dashboard/clientes?aniversariantes=hoje`

**9. `src/pages/Clientes.tsx`** (complemento)
- Ler `searchParams.get("aniversariantes")` e setar filtro correspondente no mount

**10. `src/components/leads/LeadMensagensTab.tsx`**
- Receber `dataNascimento` como prop
- Verificar se hoje é aniversário do cliente
- Se sim, renderizar banner no topo com botão "Enviar parabéns" que auto-seleciona template de tipo `aniversario` (ou categoria `aniversario`)

**11. `src/types/whatsapp.ts`**
- Adicionar `'aniversario'` ao tipo `TemplateTipo`

**12. `src/components/leads/LeadDetailsDialog.tsx`**
- Passar `dataNascimento` para `LeadMensagensTab`

### Arquivos editados
- Migração SQL (nova coluna)
- `src/types/leads.ts`
- `src/types/whatsapp.ts`
- `src/components/leads/NewLeadDialog.tsx`
- `src/components/clientes/ClientesFilters.tsx`
- `src/pages/Clientes.tsx`
- `src/components/leads/ClientesTable.tsx`
- `src/hooks/useDashboardPrincipal.ts`
- `src/pages/Dashboard.tsx`
- `src/components/leads/LeadMensagensTab.tsx`
- `src/components/leads/LeadDetailsDialog.tsx`


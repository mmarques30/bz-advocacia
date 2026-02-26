

# Plano: Adicionar ordenação por data nas abas de Leads

## Alterações

### 1. `src/pages/Leads.tsx` — ManualLeadsTab
- Adicionar estado `sortOrder` com opções: `mais_recente`, `mais_antiga`, `nome_az`, `nome_za`
- Adicionar um `<Select>` de ordenação ao lado dos filtros existentes
- Aplicar `useMemo` para ordenar `filteredLeads` conforme `sortOrder` (por `created_at` ou `nome_completo`)

### 2. `src/pages/Leads.tsx` — CsvLeadsTab
- Mesmo estado `sortOrder` e `<Select>` de ordenação
- Ordenar `filteredLeads` por `dataRaw` (Date) ou `nome`

### Opções do Select de ordenação
- "Mais recentes" (padrão) — data desc
- "Mais antigos" — data asc
- "Nome A-Z" — nome asc
- "Nome Z-A" — nome desc

### Detalhes técnicos
- Ordenação aplicada client-side via `useMemo` sobre os arrays já filtrados
- Nenhuma alteração em hooks de dados ou componentes de tabela
- O select terá ícone `ArrowUpDown` e largura `w-[180px]`




# Unificar Leads em Uma Unica Aba (leads_geral)

## Situacao Atual

- **Aba "Leads Meta Ads"**: Le dados de um CSV do Google Sheets via `useLeadsCsv` (fetch externo)
- **Aba "Leads do Sistema"**: Le dados da tabela `contact_submissions` via `useLeads`
- A tabela `leads_geral` existe no banco mas esta vazia — sera populada pelo n8n
- O layout atual tem Tabs separadas; o usuario quer **uma unica visao**

## Solucao

Remover as duas abas e criar uma visao unificada que:
1. Le dados da tabela `leads_geral` (banco de dados, integrada via n8n)
2. Mantém o header com toggle tabela/kanban, busca e filtros
3. Ao clicar num lead, abre um dialog de detalhes com as informacoes de `leads_geral`

### Arquivos a Criar

**`src/hooks/useLeadsGeral.ts`**
- Hook que faz `SELECT * FROM leads_geral` ordenado por `created_time DESC`
- Suporta filtro de busca por `full_name`, `phone_number`
- Retorna dados mapeados para um tipo `LeadGeral`
- Inclui mutation para atualizar `lead_status` (para o kanban)

**`src/components/leads/LeadGeralDetailsDialog.tsx`**
- Dialog que exibe os detalhes de um lead da tabela `leads_geral`
- Campos: nome, telefone, WhatsApp, plataforma, campanha, tipo de servico, bem a inventariar, preferencia de contato, status, observacoes, datas
- Botao de WhatsApp integrado
- Campo de observacoes editavel

### Arquivos a Modificar

**`src/pages/Leads.tsx`**
- Remover as `Tabs` (csv e sistema)
- Manter o `LeadsCsvSummary` no topo (agora alimentado pelos dados de `leads_geral`)
- Manter o header com toggle tabela/kanban
- Usar `useLeadsGeral` como fonte unica de dados
- Adaptar a tabela existente (`LeadsCsvTable`) para aceitar callback de clique que abre o `LeadGeralDetailsDialog`
- Manter os componentes de kanban adaptados para `leads_geral`

**`src/components/leads/LeadsCsvTable.tsx`**
- Adicionar prop `onViewDetails` para abrir o dialog de detalhes ao clicar no botao "Ver detalhes" (olho)
- Receber os dados ja no formato `LeadGeral[]` ao inves de `CsvLead[]`

**`src/components/leads/LeadsCsvSummary.tsx`**
- Manter como esta, recebendo summary calculado a partir de `leads_geral`

**`src/hooks/useLeadsCsv.ts`**
- Alterar para ler de `leads_geral` (banco) ao inves do CSV externo
- Manter a interface `CsvLead` e `CsvSummary` para nao quebrar os componentes

### Detalhes Tecnicos

**Mapeamento leads_geral → CsvLead:**
```text
full_name       → nome
phone_number    → telefone
platform        → plataforma (fb/ig/organic)
campaign_name   → campanha
lead_status     → estagio / situacao
created_time    → data
tipo_servico    → tipoServico
is_organic      → usado no mapeamento de plataforma
contato_whatsapp → whatsappStatus
```

**Kanban com leads_geral:**
- Colunas baseadas em `lead_status` (ex: CREATED, ENVIADO, QUALIFICADO, CONVERTIDO)
- Drag-and-drop atualiza `lead_status` na tabela `leads_geral`
- Nao interfere com `contact_submissions`

**Dialog de detalhes:**
- Exibe todos os campos relevantes de `leads_geral`
- Campos de campanha/anuncio agrupados numa secao "Meta Ads"
- Botao de WhatsApp funcional
- Campo de observacoes editavel com save

**RLS:** A tabela `leads_geral` atualmente nao tem RLS. Sera necessario habilitar RLS e criar policy para usuarios autenticados terem acesso completo (SELECT, INSERT, UPDATE, DELETE).

### O que NAO muda
- Pagina de Clientes (`src/pages/Clientes.tsx`) continua usando `contact_submissions`
- `LeadDetailsDialog` original permanece para uso na aba de clientes
- Nenhuma alteracao na conexao n8n ou na estrutura da tabela `leads_geral`


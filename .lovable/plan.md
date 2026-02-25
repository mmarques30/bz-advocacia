

# Corrigir Dialog de Detalhes do Lead (Lupa/Olho)

## Problema

O botao de detalhes (olho) na tabela passa o `id` do lead CSV para `setSelectedLeadId`. Porem, o dialog busca o lead na tabela `leads_geral` do banco de dados (via `useLeadsGeral`), que esta **vazia** porque o n8n ainda nao foi conectado. Resultado: `selectedLead` e sempre `null` e o dialog nao mostra nada.

## Solucao

Usar os dados do CSV diretamente para alimentar o dialog de detalhes, sem depender da tabela `leads_geral`.

### Alteracoes em `src/pages/Leads.tsx`

- Ao clicar no olho, em vez de buscar o lead em `leadsGeral`, buscar no array `csvData.leads` (que ja tem os dados do Google Sheets)
- Converter o `CsvLead` encontrado para o formato `LeadGeral` que o dialog espera (mapeando `nome` → `full_name`, `telefone` → `phone_number`, etc.)
- Remover a dependencia de `useLeadsGeral` para a tabela view (manter apenas para o kanban, que usa dados do banco)

### Alteracoes em `src/components/leads/LeadGeralDetailsDialog.tsx`

- Nenhuma alteracao necessaria — o dialog ja aceita o tipo `LeadGeral | null` e trata campos opcionais com fallback

### Mapeamento CsvLead → LeadGeral

```text
CsvLead.id           → id
CsvLead.nome         → full_name
CsvLead.telefone     → phone_number
CsvLead.plataforma   → platform
CsvLead.campanha     → campaign_name
CsvLead.estagio      → lead_status
CsvLead.data         → created_time (converter de DD/MM/YYYY para ISO)
CsvLead.tipoServico  → tipo_servico
CsvLead.whatsappStatus → contato_whatsapp
```

Os demais campos de `LeadGeral` que nao existem no CSV (`ad_name`, `form_name`, `bem_inventariar`, etc.) ficarao como `null`, e o dialog ja trata isso corretamente.


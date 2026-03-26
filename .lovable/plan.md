

## Adicionar seleção em lote na aba Leads Anúncios

### Abordagem
Adicionar suporte a checkbox de seleção múltipla no `LeadsTable` (ativado via prop `enableBulkSelect`), com barra de ações em lote para alteração de estágio. A funcionalidade só aparece quando `isAdsTab = true`.

### Alterações

**1. `src/components/leads/LeadsTable.tsx`**
- Adicionar prop opcional `enableBulkSelect?: boolean`
- Estado local `selectedIds: Set<string>` para rastrear seleção
- Checkbox "selecionar todos" no header + checkbox por linha
- Quando `selectedIds.size > 0`, renderizar barra de ações acima da tabela:
  - Badge "X leads selecionados"
  - Dropdown "Alterar status" com as opções: Novo, Enviado, Qualificado, Convertido, Perdido (usando `LEAD_STATUS_LABELS`)
  - Botão "Cancelar seleção"
- Ao confirmar alteração em lote:
  - Chamar `supabase.from('contact_submissions').update({ estagio }).in('id', [...selectedIds])`
  - Para cada lead, inserir em `lead_interacoes` com `tipo = 'alteracao_em_lote'`
  - Toast de sucesso com contagem
  - Invalidar query de leads
  - Limpar seleção

**2. `src/pages/Leads.tsx`**
- Passar `enableBulkSelect={true}` ao `LeadsTable` quando `isAdsTab` for true (na chamada dentro de `LeadsTab`)

### Arquivos editados
- `src/components/leads/LeadsTable.tsx`
- `src/pages/Leads.tsx`

Nenhuma alteração de banco necessária — usa tabelas existentes (`contact_submissions`, `lead_interacoes`).


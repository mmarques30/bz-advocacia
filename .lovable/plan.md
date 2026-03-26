

## Adicionar campo "Tipo" nos modelos e botão "Primeiro Contato" nos leads

### 1. Migration: adicionar coluna `tipo` em `whatsapp_templates`
```sql
ALTER TABLE public.whatsapp_templates 
ADD COLUMN tipo text DEFAULT 'geral';
```
Valores possíveis: `primeiro_contato`, `follow_up`, `proposta`, `geral`.

### 2. Atualizar tipo `WhatsAppTemplate` em `src/types/whatsapp.ts`
- Adicionar `export type TemplateTipo = 'primeiro_contato' | 'follow_up' | 'proposta' | 'geral';`
- Adicionar campo `tipo: TemplateTipo` na interface `WhatsAppTemplate`

### 3. Atualizar dialog de criação/edição `WhatsAppTemplateDialog.tsx`
- Adicionar select de "Tipo" com opções: Primeiro contato, Follow-up, Proposta, Geral
- Incluir `tipo` no `handleSave`

### 4. Atualizar listagem `src/pages/comunicacao/Templates.tsx`
- Exibir coluna "Tipo" na tabela
- Opcionalmente filtrar por tipo

### 5. Atualizar `useWhatsAppTemplates` hook
- Aceitar filtro `tipo` nas queries

### 6. Adicionar botão "Primeiro Contato" no `LeadDetailsDialog.tsx`
- Quando `lead.estagio === 'novo'`, exibir botão no header do dialog
- Ao clicar: buscar template com `tipo = 'primeiro_contato'` e `ativo = true`
- Substituir variáveis `{{nome_cliente}}` e `{{tipo_processo}}` com dados do lead
- Chamar `openWhatsAppLink` com telefone e mensagem processada
- Registrar interação em `lead_interacoes`
- Se não houver template desse tipo, exibir toast orientando criar em Administrativo > Modelos

### 7. Adicionar botão no `LeadCard.tsx` (kanban)
- Para leads com `estagio === 'novo'`, exibir ícone de WhatsApp como ação rápida no card

### Arquivos editados
- **Migration**: adicionar coluna `tipo`
- `src/types/whatsapp.ts` — novo tipo + campo
- `src/hooks/useWhatsAppTemplates.ts` — filtro por tipo
- `src/components/comunicacao/WhatsAppTemplateDialog.tsx` — select de tipo
- `src/pages/comunicacao/Templates.tsx` — coluna tipo na tabela
- `src/components/leads/LeadDetailsDialog.tsx` — botão primeiro contato
- `src/components/leads/LeadCard.tsx` — ação rápida (opcional)


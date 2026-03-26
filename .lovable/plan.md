

## Adicionar aba "Mensagens" no dialog de detalhes do lead

### Alterações

**1. Criar componente `src/components/leads/LeadMensagensTab.tsx`**
- Busca histórico de mensagens de `lead_interacoes` filtrado por `lead_id` e `tipo = 'whatsapp'` (usa `useLeadInteracoes`)
- Exibe mensagens em formato chat (timestamp, direção, conteúdo)
- Seção de composição:
  - Select com templates ativos de `whatsapp_templates` (usa `useWhatsAppTemplates`)
  - Textarea editável pré-preenchida ao selecionar template
  - Botão "Enviar via WhatsApp" que chama `openWhatsAppLink` com o telefone do lead
  - Ao clicar enviar, registra em `lead_interacoes` (insert direto via supabase) com `tipo='whatsapp'`, `canal='whatsapp'`, `direcao='saida'`
  - Se telefone não cadastrado, exibe aviso com sugestão de editar o lead

**2. Editar `src/components/leads/LeadDetailsDialog.tsx`**
- Importar `LeadMensagensTab` e ícone `MessageCircle`
- Adicionar `<TabsTrigger value="mensagens">Mensagens</TabsTrigger>` ao TabsList (ajustar grid-cols)
- Adicionar `<TabsContent value="mensagens">` renderizando `<LeadMensagensTab leadId={lead.id} telefone={lead.telefone} />`
- Preservar todas as abas e lógica existente intactas

### Arquivos
- **Criado**: `src/components/leads/LeadMensagensTab.tsx`
- **Editado**: `src/components/leads/LeadDetailsDialog.tsx`

Nenhuma alteração de banco necessária — `lead_interacoes` já existe com as colunas necessárias e RLS permite INSERT para autenticados.


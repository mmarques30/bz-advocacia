

# Plano: Assistente IA com Chat Flutuante (Estilo Minimal Chat Box)

## Resumo
Criar um chat flutuante no canto inferior direito, com design minimalista nas cores da marca (bronze/cinza), alimentado por IA que consulta dados reais do banco de dados. Histórico de conversas salvo por usuário.

## Arquitetura

```text
[Botão flutuante] → [Chat Box animado]
       ↓
[Frontend envia mensagem + histórico]
       ↓
[Edge Function "ai-chat"]
  1. Identifica intenção da pergunta
  2. Consulta tabelas relevantes (leads, processos, financeiro, demandas, etc.)
  3. Monta contexto com dados reais
  4. Envia para Lovable AI (Gemini Flash) com system prompt gaúcho/profissional
  5. Retorna resposta em streaming
       ↓
[Frontend renderiza tokens em tempo real]
[Histórico salvo em tabela chat_messages]
```

## Alterações

### 1. Migração: tabela `chat_messages`
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL, -- 'user' ou 'assistant'
  content TEXT NOT NULL,
  conversation_id UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
-- Políticas: usuário só vê/insere suas próprias mensagens
```

### 2. Edge Function `supabase/functions/ai-chat/index.ts`
- Recebe `{ message, conversationId }` do frontend
- Com `SUPABASE_SERVICE_ROLE_KEY`, consulta:
  - `contact_submissions` (leads/clientes) — resumo de totais, por status, por estágio
  - `processos` — quantidade por status, prazos próximos
  - `demandas_internas` — tarefas pendentes, por responsável, atrasadas
  - `financeiro` + `parcelas_financeiras` + `acordos_financeiros` — valores pendentes, atrasados
  - `transacoes_financeiras` — fluxo de caixa resumido
  - `processos_prazos` — prazos nos próximos 7 dias
- Monta system prompt com:
  - Dados contextuais em formato resumido
  - Personalidade: profissional, direta, sem emojis em excesso, bullets, pontualmente gaúcha ("bah", "guria", "tchê")
  - Perguntas pré-definidas como referência
- Chama Lovable AI Gateway com streaming
- Salva mensagem do user e do assistant em `chat_messages`

### 3. Componente `src/components/AIChatBox.tsx`
- Botão flutuante (ícone MessageSquare) no canto inferior direito, cor `bg-primary`
- Ao abrir: caixa de chat com animação suave (CSS transitions, sem framer-motion para manter leve)
- Header com título "Assistente B&Z" e botão fechar
- Área de mensagens com scroll
- Perguntas pré-definidas (chips clicáveis) quando não há mensagens:
  - "Quantos leads entraram este mês?"
  - "Quais tarefas estão atrasadas?"
  - "Resumo financeiro do mês"
  - "Quais prazos vencem esta semana?"
  - "Como estão as conversões de leads?"
- Input de texto + botão enviar
- Streaming token-by-token
- Markdown rendering via formatação simples (bold, bullets, line breaks)

### 4. `src/components/DashboardLayout.tsx`
- Adicionar `<AIChatBox />` dentro do layout, visível em todas as páginas protegidas

### 5. `supabase/config.toml`
- Adicionar `[functions.ai-chat]` com `verify_jwt = false` (autenticação validada no código)

### Perguntas pré-definidas (sugestões rápidas)
- "Quantos leads novos entraram este mês?"
- "Quais tarefas estão atrasadas?"
- "Resumo financeiro do mês atual"
- "Quais prazos vencem nos próximos 7 dias?"
- "Como está a taxa de conversão de leads?"
- "Quais clientes têm pagamentos pendentes?"

### Cores e estilo
- Botão: `bg-primary` (bronze)
- Header do chat: `bg-primary text-primary-foreground`
- Mensagens do assistant: `bg-muted`
- Mensagens do user: `bg-primary text-primary-foreground`
- Borda e sombra: `border-border shadow-elegant`


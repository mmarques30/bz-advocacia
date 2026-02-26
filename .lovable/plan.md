

# Plano: Melhorar o botão flutuante e adicionar histórico de conversas

## 1. Botão flutuante: trocar ícone por "BZ"
- Linha 193-202: Substituir o `<MessageSquare>` por texto bold "BZ" estilizado (font-bold text-lg)

## 2. Histórico de conversas persistente
Atualmente o `conversationId` é gerado novo a cada render (linha 41), então o histórico nunca é recuperado entre sessões.

### Alterações em `AIChatBox.tsx`:
- Adicionar estado para lista de conversas anteriores e uma view de "histórico"
- Persistir `conversationId` no `localStorage` por usuário, ou criar um novo ao clicar "Nova conversa"
- Adicionar botão de "Histórico" no header que mostra lista de conversas passadas (agrupadas por data)
- Ao clicar numa conversa do histórico, carregar as mensagens daquela `conversation_id`
- Adicionar botão "Nova conversa" para iniciar conversa limpa
- O load de conversas usa: `SELECT DISTINCT conversation_id, MIN(created_at), MAX(created_at) FROM chat_messages WHERE user_id = ? GROUP BY conversation_id ORDER BY MAX(created_at) DESC`
- Para preview de cada conversa: mostrar primeira mensagem do user truncada

### Fluxo:
```text
[Header: BZ | Histórico | Nova | X]
  ↓ click Histórico
[Lista de conversas anteriores com data e preview]
  ↓ click numa conversa
[Carrega mensagens daquela conversa]
  ↓ click Nova
[Limpa e gera novo conversationId]
```


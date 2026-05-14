## Ajustes no painel /atendimento

### 1. Altura fixa do chat (sem scroll da página)

Hoje `Atendimento.tsx` usa `h-[calc(100vh-3.5rem)]` mas o `ChatPanel` interno tem `p-3` que aumenta o conteúdo, e o `ConversaBot` em `fullHeight` não está sendo restringido corretamente. Garantir que a coluna direita seja `min-h-0` em todos os níveis e que apenas a área de mensagens role internamente — o textarea + botão Enviar ficam fixos no rodapé.

**`src/components/atendimento/ChatPanel.tsx`**:
- Trocar `<div className="flex-1 min-h-0 p-3">` por `<div className="flex-1 min-h-0 overflow-hidden p-3">` para travar overflow.
- Garantir que o wrapper externo seja `h-full overflow-hidden`.

### 2. Detalhes do lead no header do chat

Expandir o header do `ChatPanel` para mostrar — abaixo do telefone — uma linha compacta com:
- **Tipo de caso**: `tipo_servico` ou `area_normalizada`
- **Status**: `status_sdr` (badge colorido)
- **Origem**: `origem_sdr`
- **Score**: se preenchido

Renderizar como pequenos chips/badges horizontais (`text-[10px]`) abaixo do telefone, sem poluir. Se um campo está vazio, omite.

**Mudanças em `ChatPanel.tsx`**:
- Adicionar campos no `select`: `tipo_servico, area_normalizada, origem_sdr, score, etapa_qualificacao`.
- Adicionar bloco de badges abaixo da linha do telefone.

Sem mudanças em rota, sidebar, schema ou Edge Functions. Tudo frontend.

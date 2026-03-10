

## Diagnóstico

Analisei o código do botão "Abrir WhatsApp" em `ProcessoComunicacaoTab.tsx` (linha 145-151). O fluxo atual:

1. Pega `processo.cliente?.telefone` → formata → abre `https://wa.me/{telefone}?text={mensagem}`
2. Usa `window.open` que pode ser bloqueado pelo iframe do preview

Problemas identificados:
- **`window.open` bloqueado no iframe** — o preview do Lovable roda em sandbox, que bloqueia popups
- **Telefone pode estar vazio/undefined** — se `processo.cliente` não estiver carregado, o botão falha silenciosamente
- **O dialog "Enviar Notificação WhatsApp"** (screenshot) só tem "Enviar Agora" via API, sem opção de abrir WhatsApp Web

## Solução

### 1. Corrigir o botão "Abrir WhatsApp" em ProcessoComunicacaoTab
- Trocar `window.open` por `window.location.assign` via `<a>` tag (funciona em iframes)
- Alternativamente, usar `window.open` com fallback para `window.location.href`
- Adicionar tratamento de erro com toast caso falhe

### 2. Adicionar botão "Abrir WhatsApp" no EnviarMensagemDialog
- O dialog da screenshot (Enviar Notificação WhatsApp) só tem "Enviar Agora" via API
- Adicionar botão verde "Abrir no WhatsApp" que abre o wa.me com a mensagem pronta
- Assim o usuário tem duas opções: enviar via API ou abrir no WhatsApp Web

### 3. Fallback robusto para abrir links externos
- Criar um helper `openWhatsAppLink(phone, message)` que tenta `window.open` e faz fallback para criação de `<a>` tag temporária com `target="_blank"` e click programático

### Arquivos alterados
- `src/components/processos/tabs/ProcessoComunicacaoTab.tsx` — fix `handleOpenWhatsApp`
- `src/components/comunicacao/EnviarMensagemDialog.tsx` — adicionar botão WhatsApp Web


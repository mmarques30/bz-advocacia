

## Diagnóstico

Dois problemas identificados:

### 1. Edge Function `whatsapp-send` não está configurada no `config.toml`
A função não aparece no `supabase/config.toml`, o que significa que ela pode estar bloqueando requests por JWT ou não estar deployada corretamente. Além disso, internamente ela busca uma configuração ativa na tabela `whatsapp_config` — se não houver registro com `active = true`, retorna erro 500.

### 2. Variável `{{nome_escritorio}}` não é substituída
No `EnviarMensagemDialog.tsx` (e no `ProcessoComunicacaoTab.tsx`), o mapa de variáveis não inclui `nome_escritorio`. O preview mostra a variável crua ao invés do valor real.

## Correções

### A. Adicionar `whatsapp-send` ao `config.toml`
```toml
[functions.whatsapp-send]
verify_jwt = false
```

### B. Adicionar variáveis faltantes nos dois componentes
**Arquivos:** `src/components/comunicacao/EnviarMensagemDialog.tsx` e `src/components/processos/tabs/ProcessoComunicacaoTab.tsx`

Adicionar ao mapa de variáveis:
- `{{nome_escritorio}}` — buscar do hook `useConfiguracoesEscritorio` ou usar valor padrão "BZ Advocacia"
- `{{nome_advogado}}` — buscar do processo ou usar valor padrão

### C. Melhorar tratamento de erro no envio
Atualmente o erro genérico "Edge Function returned a non-2xx status code" não ajuda o usuário. Adicionar `try/catch` no `useWhatsAppEnvio` para extrair a mensagem real do erro (ex: "Configuração WhatsApp não encontrada") e exibi-la no toast.

### D. Validar existência de config antes de permitir envio
No `EnviarMensagemDialog`, verificar se existe configuração WhatsApp ativa antes de habilitar o botão "Enviar Agora". Se não houver, mostrar aviso orientando a configurar em Automações.


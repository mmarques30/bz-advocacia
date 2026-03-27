

## Processar variáveis nos templates do LeadMensagensTab

### Problema
Linha 50 do `LeadMensagensTab.tsx` faz `setMensagem(template.mensagem)` sem chamar `processarTemplate()`. Variáveis como `{{nome_cliente}}` ficam literais.

### Solução

**`src/components/leads/LeadMensagensTab.tsx`**:

1. Expandir props para receber dados do lead: `nomeCompleto`, `email` (além de `leadId` e `telefone`)
2. Importar `processarTemplate` de `@/types/whatsapp` e `useConfiguracoesEscritorio`
3. No `handleTemplateSelect`, montar objeto de dados com as variáveis disponíveis do lead e escritório, chamar `processarTemplate(template.mensagem, dados)` antes de `setMensagem`
4. Adicionar estado `hasUnfilledVars` — após processar, verificar se ainda restam `{{...}}` no texto. Se sim, exibir aviso discreto abaixo do textarea: "Algumas variáveis não foram preenchidas automaticamente"
5. Limpar variáveis não preenchidas (remover `{{...}}` restantes) do texto processado

**`src/components/leads/LeadDetailsDialog.tsx`** (linha 360):
- Passar props adicionais: `nomeCompleto={lead.nome_completo}` e `email={lead.email}`

### Mapeamento de variáveis
```
nome_cliente → lead.nomeCompleto
telefone_cliente → lead.telefone
email_cliente → lead.email
nome_escritorio → escritorio.nome_escritorio
telefone_escritorio → escritorio.telefone
email_escritorio → escritorio.email
```

### Arquivos editados
- `src/components/leads/LeadMensagensTab.tsx`
- `src/components/leads/LeadDetailsDialog.tsx`




## Problema

Os templates de WhatsApp usam variáveis como `{{descricao_andamento}}`, `{{data_andamento}}`, `{{telefone_escritorio}}`, `{{email_escritorio}}`, etc., mas o código de substituição em **ProcessoComunicacaoTab** e **EnviarMensagemDialog** só mapeia algumas delas. As variáveis não mapeadas ficam como texto literal na mensagem.

Variáveis **faltando** nos dois componentes:
- `{{descricao_andamento}}`, `{{data_andamento}}` — dados de andamento
- `{{data_audiencia}}`, `{{hora_audiencia}}`, `{{local_audiencia}}` — dados de audiência
- `{{resultado_sentenca}}` — sentença
- `{{descricao_prazo}}`, `{{data_prazo}}`, `{{prazo_vencimento}}` — prazos
- `{{nome_documento}}`, `{{tipo_documento}}` — documentos
- `{{valor_devido}}` — financeiro
- `{{telefone_escritorio}}`, `{{email_escritorio}}`, `{{cnpj_escritorio}}`, `{{oab_escritorio}}`, `{{endereco_escritorio}}` — dados do escritório
- `{{data_atual}}`, `{{hora_atual}}` — sistema
- `{{cpf_cliente}}`, `{{email_cliente}}`, `{{telefone_cliente}}`, `{{endereco_cliente}}` — cliente

## Solução

Completar o mapa de variáveis nos dois arquivos, adicionando **todas** as variáveis definidas em `VARIAVEIS_DISPONIVEIS` (whatsapp.ts) e `TEMPLATE_VARIABLES` (templateVariables.ts), preenchendo com os dados disponíveis do processo, cliente e escritório.

### Arquivos alterados

1. **`src/components/processos/tabs/ProcessoComunicacaoTab.tsx`** — Expandir o objeto `variables` (linhas 82-97) para incluir todas as variáveis: dados do escritório (`configuracoes.telefone`, `.email`, `.cnpj`, `.oab_principal`, `.endereco_completo`), dados do cliente (`processo.cliente.cpf`, `.email`, `.telefone`, `.endereco_completo`), data/hora atuais, e variáveis de andamento/prazo/audiência que, quando não disponíveis no contexto, serão substituídas por texto vazio ou indicativo.

2. **`src/components/comunicacao/EnviarMensagemDialog.tsx`** — Mesma expansão do mapa de variáveis (linhas 61-72), garantindo paridade com o outro componente.

### Variáveis do escritório que serão adicionadas

```text
{{telefone_escritorio}}  → configuracoes.telefone
{{email_escritorio}}     → configuracoes.email  
{{cnpj_escritorio}}      → configuracoes.cnpj
{{oab_escritorio}}       → configuracoes.oab_principal
{{endereco_escritorio}}  → configuracoes.endereco_completo
```

### Variáveis contextuais (sem dados disponíveis no momento do envio)

Variáveis como `{{descricao_andamento}}` e `{{data_audiencia}}` dependem de um andamento ou audiência específica que não está selecionada. Essas serão substituídas por string vazia para que não apareçam como `{{variavel}}` na mensagem final. Futuramente, pode-se adicionar seleção do andamento/audiência específica.


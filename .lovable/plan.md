

## Diagnóstico

O problema é que o sistema analisa apenas a tabela `logs_sistema`, que registra operações de banco de dados (criar/editar/deletar registros). Mudanças no código do sistema (correções de bugs, novas funcionalidades, melhorias visuais) **não são registradas nessa tabela**, por isso a IA retornou "Não houve alterações".

Os logs existentes mostram apenas operações como "editou contact_submissions" (937 vezes na semana), o que são mudanças de dados, não de funcionalidades.

## Solução

Adicionar um campo de texto onde você descreve manualmente as melhorias feitas, e a IA transforma isso em um texto profissional para enviar aos clientes. Os logs automáticos do banco continuam sendo analisados como complemento.

### Mudanças

**1. Página `Atualizacoes.tsx`**
- Adicionar um `<Textarea>` para descrever manualmente as melhorias/correções feitas (ex: "Corrigido envio de WhatsApp", "Adicionada página de atualizações", "Valores do contrato agora são pré-preenchidos")
- Manter os botões de período (Hoje/Semana/Mês) que também capturam atividade do banco
- O texto manual é enviado junto com os logs automáticos para a IA gerar o texto final

**2. Edge Function `analyze-updates`**
- Receber novo campo `descricao_manual` (string opcional)
- Se houver descrição manual, incluí-la no prompt da IA como "Melhorias implementadas pela equipe"
- Se houver apenas descrição manual sem logs, a IA gera o texto baseado apenas na descrição
- Melhorar o prompt para traduzir nomes técnicos de tabelas (ex: `contact_submissions` → "gestão de clientes")

**3. Banco de dados**
- Adicionar coluna `descricao_manual` (text, nullable) à tabela `atualizacoes_sistema` para salvar o que foi informado manualmente

### Arquivos a editar
- `src/pages/configuracoes/Atualizacoes.tsx` — textarea + envio da descrição
- `supabase/functions/analyze-updates/index.ts` — receber e processar descrição manual
- Migração SQL — nova coluna


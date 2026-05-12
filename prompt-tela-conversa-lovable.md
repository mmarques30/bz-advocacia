# Prompt — Adicionar Tela de Conversa ao seu Lovable

Você vai colar isso dentro do Lovable como **uma nova iteração** do projeto existente (o que já tem o kanban). O prompt assume que você JÁ rodou a migration `01_migration.sql` no Supabase.

> **Antes de colar:** confirme no Lovable se ele já está conectado ao seu Supabase. Se sim, é só seguir.

---

## Cole isto no Lovable

```
Adicione uma TELA DE CONVERSA ao painel existente, sem remover ou alterar as abas, rotas ou componentes já criados (preservar tudo que já existe — kanban, dashboard, etc).

CONTEXTO
- Esta tela é parte do fluxo SDR: o robô conversa com o lead pelo WhatsApp via Z-API.
- O Supabase agora tem as tabelas: leads (já existia, com campos novos), mensagens, qualificacoes, advogados, eventos_bot.
- A nova tela mostra todo o histórico da conversa e permite ao advogado assumir e enviar mensagens manuais.

ROTAS A CRIAR
- /leads/:id — tela de detalhe do lead com a conversa.
- Adicionar link "Abrir conversa" em cada card do kanban e em cada linha da lista de leads.

LAYOUT DA TELA /leads/:id
Duas colunas em desktop (1/3 + 2/3), empilhadas em mobile.

COLUNA ESQUERDA — Ficha do lead
- Avatar com inicial colorida + nome em destaque.
- Telefone (com botão copiar).
- Origem (vinda do form).
- Tipo de processo (do form) + Área normalizada (vinda da classificação do bot).
- Status SDR (badge editável via dropdown com os valores: novo, em_atendimento_bot, sql_aguardando_humano, assumido_humano, agendado, mql_frio, perdido, cliente).
- Score numérico.
- Etapa de qualificação atual (M0, M1, M2, M3, finalizado).
- Bloco "Respostas das qualificações" listando as linhas da tabela qualificacoes (pergunta_codigo, pergunta_texto, resposta_texto) — uma abaixo da outra.
- Botões de ação:
  • Assumir conversa (visível se status_sdr = 'sql_aguardando_humano' ou se humano_responsavel for null).
  • Pausar bot / Reativar bot (toggle no campo bot_pausado).
  • Marcar como cliente / Marcar como perdido.
- Campo "Call agendada em" (datetime picker que grava em call_agendada_em).

COLUNA DIREITA — Conversa (estilo WhatsApp)
- Lista de mensagens da tabela mensagens, ordenadas por enviada_em ASC.
- Mensagens com origem='lead' alinhadas à esquerda, fundo branco/cinza claro.
- Mensagens com origem='bot' alinhadas à direita, fundo cinza com badge "BOT".
- Mensagens com origem='humano' alinhadas à direita, fundo verde com badge "VOCÊ" + nome do advogado (puxar de advogados via humano_responsavel).
- Auto-scroll pro fim da lista quando carrega.
- Auto-refresh: usar realtime do Supabase (subscribe em mensagens onde lead_id = :id) ou polling a cada 8 segundos como fallback.
- Caixa de envio fixa no rodapé:
  • Textarea com placeholder "Escreva sua resposta…"
  • Botão "Enviar" (primário, cor azul-marinho).
  • Atalho Cmd/Ctrl + Enter envia.

REGRAS DE INTEGRAÇÃO COM AS EDGE FUNCTIONS
1. Botão "Assumir conversa" → chama POST {{SUPABASE_URL}}/functions/v1/assumir-conversa
   Headers: Authorization: Bearer {{user_session_jwt}}
   Body: { "lead_id": ":id", "advogado_id": "{{advogado_logado.id}}", "enviar_transicao": true }
   Em sucesso: atualizar status local e desbloquear envio manual.

2. Botão "Enviar" → chama POST {{SUPABASE_URL}}/functions/v1/enviar-msg-humano
   Headers: Authorization: Bearer {{user_session_jwt}}
   Body: { "lead_id": ":id", "advogado_id": "{{advogado_logado.id}}", "mensagem": "<texto>" }
   Em sucesso: limpar a textarea e deixar o realtime carregar a mensagem na lista.

3. NÃO inserir mensagens manualmente na tabela mensagens pelo painel — a Edge Function faz isso. O painel só LÊ mensagens.

4. Realtime: habilite no Supabase a publicação realtime para a tabela mensagens. Faça subscribe filtrado por lead_id = :id.

5. Auth: o advogado logado é identificado pelo Supabase Auth. Em paralelo, exista uma tabela advogados; relacione auth.uid() com advogados.id via mesma chave ou via lookup por e-mail.

DESIGN
- Manter o mesmo tema visual já usado no painel (cores, tipografia, espaçamento).
- Cantos arredondados sutis.
- Em mobile: a coluna esquerda vira um drawer expansível por cima da conversa.

REGRAS IMPORTANTES
- NÃO remover, renomear ou alterar abas, rotas ou componentes do painel atual.
- NÃO criar duplicatas de páginas que já existem.
- Adicionar links de "Abrir conversa" tanto no card do kanban quanto na lista.
- Garantir que o botão "Enviar" fica desabilitado se o advogado não tiver assumido a conversa (humano_responsavel != advogado logado).

ENV VARS NECESSÁRIAS NO LOVABLE
- VITE_SUPABASE_URL (já deve existir)
- VITE_SUPABASE_ANON_KEY (já deve existir)
```

---

## Depois que o Lovable gerar

1. Abra a tela `/leads/<algum id real>` e veja se a conversa carrega.
2. Habilite Realtime no Supabase: **Database → Replication → habilitar a tabela `mensagens`**.
3. Faça um teste end-to-end: insira um lead no Supabase manualmente → veja a M0 sair pelo WhatsApp → responda no celular → veja a M1 aparecer na conversa.

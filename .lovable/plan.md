# Plano — Bot SDR Claudia

Duas frentes que se tocam: a) destravar o processamento de mensagens depois da M0; b) trocar templates e classificador pelo novo fluxo "Claudia" com 4 áreas.

## Parte 1 — Correção crítica (M0 trava o lead)

### Diagnóstico
Hoje, quando o lead orgânico manda a 1ª mensagem em `whatsapp-inbound`:
1. `criarLeadWhatsApp` insere com `etapa_qualificacao='M0'` e devolve 200 imediatamente (linha 441-444), **sem rodar classificador**, pra não correr com o trigger `on-new-lead`.
2. O trigger dispara `on-new-lead`, que envia M0 e atualiza `etapa_qualificacao='M0'` (orgânico) ou `'M1'` (form com tipo_servico).
3. Lead responde. Nova entrada em `whatsapp-inbound` deveria rodar Claude.

Sintomas relatados: zero `msg_processada` em 24h. Causas plausíveis no código atual:
- Guard `lead_em_atendimento_crm_atual_ignorado` (linhas 356-378) ignora qualquer lead cujo `leads_geral.lead_status` ≠ `'Pendente'` se houve update nos últimos 7 dias — basta um trigger de CRM mexer e o bot fica fora.
- Sem log explícito quando o classificador é chamado/ignorado, fica invisível.
- Sem garantia de que a etapa avança de `M0`: depende exclusivamente da resposta do Claude (`enviar_M1`); se Claude devolver `aguardar` ou falhar parsing, o lead fica preso.

### Mudanças em `supabase/functions/whatsapp-inbound/index.ts`
1. **Remover/afrouxar o guard `lead_em_atendimento_crm_atual`**: só pular o bot se `bot_pausado=true` OU `status_sdr` indicar handoff. O `lead_status` do CRM antigo não pode silenciar o bot.
2. **Forçar passagem pelo classificador** quando `etapa_qualificacao IN ('M0','M1','M2','M3')` e bot não pausado, mesmo que seja a 2ª mensagem em M0.
3. **Sempre logar `msg_processada`** com `{ acao, area, etapa_anterior, etapa_nova }` — inclusive nos casos `aguardar`, `bot_pausado`, `status_bloqueia`, `lead_no_crm_*` (mudando o tipo do evento pra rastrear sem perder).
4. **Avanço determinístico de M0**: se Claude conseguir identificar área (`area !== 'nao_identificada'`) e devolver `enviar_M1`, o switch já move pra `M2`; se devolver `aguardar` repetidamente em M0, manter etapa mas registrar `m0_aguardando_area` pra debug.

### Smoke test (manual via Z-API ou curl)
Após deploy:
1. Limpar 1 lead de teste; mandar "Oi" de um número novo → verifica M0 chega.
2. Responder "Saúde" → confere evento `msg_processada` com `area=saude` e nova etapa.
3. Continuar até handoff. Validar query final:
   ```sql
   select id, etapa_qualificacao, area_normalizada, status_sdr, bot_pausado
   from leads_geral order by created_time desc limit 5;
   ```

## Parte 2 — Novo fluxo "Claudia"

### `supabase/functions/_shared/prompts.ts` — reescrita completa

- `mensagemM0(nome, tipoServicoForm)` → novo texto da Claudia com 4 bullets (Família, Inventário, Saúde, Outros). Remover variação por `tipo_servico_form` (só usar nome).
- **Remover** `AVISO_LGPD` (ou manter export vazio pra não quebrar imports).
- Novas funções por fluxo:
  - `mensagemSaudeNivel1(nome)` — 3 opções (medicamento / terapias / outros)
  - `mensagemSaudeNivel2Consulta(nome)` — proposta de consulta 30 min
  - `mensagemSaudeNivel2Outros(nome)` — pede mais detalhes
  - `mensagemInventario(nome)` — herdeiros + bens principais
  - `mensagemFamilia(nome)` — pede detalhar área
  - `mensagemOutros(nome)` — pede detalhar
  - `mensagemHandoff(nome)` — unificada: "Já estamos analisando seu caso, nossa advogada especialista já vai te chamar..."
- Reescrever `SYSTEM_PROMPT_CLASSIFICADOR`:
  - Persona: Claudia, B&Z, feminino ("nossa advogada especialista").
  - Enum de áreas reduzido a `familia | inventario | saude | outros` (palavras tipo cível/trabalhista/consumidor/previdenciário caem em `outros`, nunca em `fora_escopo` automático).
  - Sub-classificador de saúde: `saude_subtipo` ∈ `medicamento | terapias | outros`.
  - Próximas ações ajustadas: `pedir_area`, `pedir_subtipo_saude`, `propor_consulta_saude`, `pedir_detalhes` (família/outros/saúde-outros), `pedir_inventario_info`, `encerrar_sql` (handoff), `aguardar`.
  - Tom: emojis só `😊` com moderação, sem `🤓`, sem LGPD.
  - Output JSON com `area`, `saude_subtipo`, `proxima_acao`, `resposta_estruturada`, `score`, `motivo`, `mensagem_para_enviar`.

### `supabase/functions/whatsapp-inbound/index.ts` — switch de ações

Reescrever o `switch (r.proxima_acao)` (linhas 573-619) pro novo enum, mantendo:
- Cada ação seta `mensagemFinal`, `novaEtapa` (`aguardando_area`, `aguardando_subtipo_saude`, `aguardando_detalhe`, `finalizado`) e flags.
- Handoff (`encerrar_sql`) usado por todos os fluxos: `status_sdr='sql_aguardando_humano'`, `bot_pausado=true`, `area_normalizada` preenchida, notificação Time B&Z, mensagem unificada `mensagemHandoff(nome)`.
- `espelharContactSubmission` recebe `tipo_processo` correto via `mapAreaToTipoProcesso` (já mapeia familia/inventario/saude; adicionar fallback `outros → "Outro"` — já existe).

### `supabase/functions/on-new-lead/index.ts`
- Já está sem LGPD (último patch). Confirma `mensagemM0(nome)` chama assinatura nova (ignora `tipo_servico`).
- Mantém `etapa_qualificacao='M0'` (lead vai responder a área).

### `supabase/functions/_shared/db.ts`
- Em `mapAreaToTipoProcesso`: garantir `outros → "Outro"`. Em `fluxoFromArea`: tudo que não é `saude`/`inventario`/`familia` cai em `qualificacao_geral` (não `fora_escopo`).

## Deploy
```
supabase functions deploy whatsapp-inbound --no-verify-jwt
supabase functions deploy on-new-lead
```

## Validação ponta-a-ponta (depois do deploy)
1. Novo número manda "Oi" → recebe MSG 1 Claudia (4 áreas, sem LGPD).
2. Responde "Saúde" → recebe nível 1 (3 opções). Confirma `msg_processada` + `area_normalizada='saude'`.
3. Responde "medicamento de alto custo" → recebe proposta de consulta 30 min. Confirma `etapa=aguardando_confirmacao_consulta` (ou equivalente).
4. Responde "pode" → recebe mensagem de handoff. Confirma `status_sdr='sql_aguardando_humano'`, `bot_pausado=true`, `area_normalizada='saude'`, espelho em `contact_submissions` com `tipo_processo='Saúde'` e estágio `em_analise`.
5. Repetir mini-teste pra Inventário e Família.

Query final:
```sql
select id, etapa_qualificacao, area_normalizada, status_sdr, bot_pausado
from leads_geral where created_time > now() - interval '1 hour'
order by created_time desc;

select tipo, count(*) from eventos_sdr
where created_at > now() - interval '1 hour'
group by tipo order by count desc;
```

## Detalhes técnicos
- Não criar migration — só alterar edge functions e prompts.
- Schema de `eventos_sdr.payload` é jsonb livre, não precisa mudar.
- `mensagens_inbound_lock` (idempotência por messageId) continua igual.
- Não tocar em `whatsapp_templates` (intocável por convenção do projeto).

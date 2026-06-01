
-- Atualiza constraints de status para campanha de recuperação 3d
ALTER TABLE public.campanhas_envio DROP CONSTRAINT IF EXISTS campanhas_envio_status_check;
ALTER TABLE public.campanhas_envio ADD CONSTRAINT campanhas_envio_status_check
  CHECK (status IN (
    'pendente','enviada','erro','respondida',
    'cliente_ja_existente','duplicata_em_atendimento',
    'cliente_atropelado_corrigido','nao_respondida_3d'
  ));

ALTER TABLE public.leads_geral DROP CONSTRAINT IF EXISTS leads_geral_status_sdr_check;
ALTER TABLE public.leads_geral ADD CONSTRAINT leads_geral_status_sdr_check
  CHECK (status_sdr IN (
    'novo','em_atendimento_bot','em_atendimento','qualificacao_iniciada',
    'mql_frio','aguardando_triagem','aguardando_resposta','em_triagem',
    'sql_aguardando_humano','assumido_humano','agendado',
    'perdido','perdido_recuperacao','cliente'
  ));

ALTER TABLE public.leads_geral
  ADD COLUMN IF NOT EXISTS perdido_motivo text,
  ADD COLUMN IF NOT EXISTS perdido_em timestamptz,
  ADD COLUMN IF NOT EXISTS dias_sem_contato int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ultima_msg_cliente_em timestamptz;

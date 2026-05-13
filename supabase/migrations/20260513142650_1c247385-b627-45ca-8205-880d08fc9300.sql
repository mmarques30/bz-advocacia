
CREATE OR REPLACE VIEW public.vw_pipeline_b_z AS
SELECT
  cs.id,
  cs.nome_completo,
  cs.telefone,
  cs.tipo_processo,
  cs.estagio,
  cs.status,
  cs.origem,
  cs.responsavel_id,
  cs.created_at,
  cs.data_ultima_atividade,
  cs.lead_geral_id,
  CASE WHEN cs.lead_geral_id IS NOT NULL THEN 'bot' ELSE 'manual' END AS origem_atendimento,
  lg.status_sdr,
  lg.fluxo_sdr,
  lg.area_normalizada,
  lg.score,
  lg.etapa_qualificacao,
  lg.bot_pausado,
  lg.ultima_mensagem_em
FROM public.contact_submissions cs
LEFT JOIN public.leads_geral lg ON lg.id = cs.lead_geral_id;

CREATE INDEX IF NOT EXISTS idx_contact_submissions_lead_geral_id
  ON public.contact_submissions(lead_geral_id);

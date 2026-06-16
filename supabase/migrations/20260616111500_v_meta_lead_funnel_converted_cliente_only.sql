-- v_meta_lead_funnel — corrige `converted` pra ser SO quem virou cliente
-- (status_sdr='cliente'). Antes contava sql_aguardando_humano/agendado/
-- assumido_humano tambem, mas esses estao no pipeline, nao convertidos.
--
-- Ajustes nos consumidores (Insights, Funil etc) refletem essa distincao.

CREATE OR REPLACE VIEW public.v_meta_lead_funnel
WITH (security_invoker = true) AS
SELECT
  lg.id            AS lead_id,
  lg.created_time  AS lead_at,
  lg.ad_id,
  lg.ad_name,
  COALESCE(lg.campaign_id, ma.campaign_id) AS campaign_id,
  COALESCE(lg.campaign_name, mc_via_ad.name) AS campaign_name,
  lg.adset_id,
  lg.adset_name,
  lg.status_sdr,
  -- Antes: ('cliente','agendado','assumido_humano','sql_aguardando_humano')
  -- Agora: so quem fechou.
  (lg.status_sdr = 'cliente') AS converted,
  -- Flag complementar: lead esta no pipeline (qualificado pra frente).
  (lg.status_sdr IN ('cliente','agendado','assumido_humano','sql_aguardando_humano')) AS em_pipeline,
  COALESCE(mc.objective, mc_via_ad.objective) AS objective,
  COALESCE(mc.status, mc_via_ad.status) AS campaign_status
FROM public.leads_geral lg
LEFT JOIN public.meta_ads ma ON ma.id = lg.ad_id
LEFT JOIN public.meta_campaigns mc ON mc.id = lg.campaign_id
LEFT JOIN public.meta_campaigns mc_via_ad ON mc_via_ad.id = ma.campaign_id
WHERE lg.ad_id IS NOT NULL OR lg.campaign_id IS NOT NULL;

COMMENT ON VIEW public.v_meta_lead_funnel IS
  'Cruza leads do bot SDR com a estrutura das campanhas Meta. converted='
  'true so quando status_sdr=cliente (lead fechado). em_pipeline=true '
  'pros estados pre-cliente (sql_aguardando_humano, assumido_humano, agendado).';

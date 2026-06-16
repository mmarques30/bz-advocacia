-- Meta Ads: v_meta_lead_funnel resolve campaign via meta_ads
--
-- Problema: 130 leads dos ultimos 90 dias tem `campaign_name = NULL`.
-- O Z-API entrega so `ad_id` no `externalAdReply.sourceId`; o
-- whatsapp-inbound grava em leads_geral mas nao busca campaign_id.
--
-- Solucao: a view fallback faz LEFT JOIN com meta_ads pra resolver
-- campaign_id/name e meta_campaigns pra trazer objective/status. Quando
-- leads_geral ja tem campaign preenchido, prevalece (COALESCE).
--
-- Depende: meta_ads precisa ter sido populado pelo meta-sync-structure
-- (ETAPA 3 + ETAPA 6 — secrets configurados pro 1o sync rodar).

CREATE OR REPLACE VIEW public.v_meta_lead_funnel
WITH (security_invoker = true) AS
SELECT
  lg.id            AS lead_id,
  lg.created_time  AS lead_at,
  lg.ad_id,
  lg.ad_name,
  -- campaign resolvido: lead_geral.campaign_id se existir, senao
  -- o campaign_id do meta_ads correspondente ao ad_id.
  COALESCE(lg.campaign_id, ma.campaign_id) AS campaign_id,
  COALESCE(lg.campaign_name, mc_via_ad.name) AS campaign_name,
  lg.adset_id,
  lg.adset_name,
  lg.status_sdr,
  (lg.status_sdr IN ('cliente','agendado','assumido_humano','sql_aguardando_humano')) AS converted,
  COALESCE(mc.objective, mc_via_ad.objective) AS objective,
  COALESCE(mc.status, mc_via_ad.status) AS campaign_status
FROM public.leads_geral lg
LEFT JOIN public.meta_ads ma ON ma.id = lg.ad_id
LEFT JOIN public.meta_campaigns mc ON mc.id = lg.campaign_id
LEFT JOIN public.meta_campaigns mc_via_ad ON mc_via_ad.id = ma.campaign_id
WHERE lg.ad_id IS NOT NULL OR lg.campaign_id IS NOT NULL;

COMMENT ON VIEW public.v_meta_lead_funnel IS
  'Cruza leads do bot SDR (leads_geral) com a estrutura das campanhas Meta. ' ||
  'campaign_id/name fazem fallback via meta_ads quando leads_geral nao trouxe ' ||
  '(o Z-API so entrega ad_id no externalAdReply). security_invoker=true: ' ||
  'respeita RLS de leads_geral + meta_campaigns + meta_ads do usuario.';

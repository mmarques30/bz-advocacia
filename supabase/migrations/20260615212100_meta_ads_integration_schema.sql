-- Meta Ads integration — schema (ETAPA 1 da integracao)
--
-- B&Z usa CTWA (Click to WhatsApp), nao Lead Form. O whatsapp-inbound
-- ja captura ad_id / campaign_id / adset_id em leads_geral via
-- externalAdReply. Estas tabelas armazenam a estrutura das campanhas
-- (Business Manager) e os insights diarios pra cruzar com leads_geral.
--
-- RLS estrita: so quem tem `has_role(auth.uid(),'admin'::app_role)` le.
-- As edge functions de sync rodam com SERVICE_ROLE, entao bypassam RLS.

-- =======================================================================
-- Tabelas
-- =======================================================================

CREATE TABLE public.meta_credentials (
  id bigserial PRIMARY KEY,
  app_id text NOT NULL,
  business_id text,
  ad_account_id text NOT NULL UNIQUE,
  page_id text NOT NULL,
  pixel_id text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.meta_campaigns (
  id text PRIMARY KEY,
  ad_account_id text NOT NULL,
  name text,
  status text,
  objective text,
  daily_budget numeric,
  lifetime_budget numeric,
  start_time timestamptz,
  stop_time timestamptz,
  created_time timestamptz,
  raw jsonb,
  synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.meta_ad_sets (
  id text PRIMARY KEY,
  campaign_id text REFERENCES public.meta_campaigns(id) ON DELETE SET NULL,
  name text,
  status text,
  daily_budget numeric,
  targeting jsonb,
  start_time timestamptz,
  end_time timestamptz,
  raw jsonb,
  synced_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_meta_ad_sets_campaign ON public.meta_ad_sets(campaign_id);

CREATE TABLE public.meta_creatives (
  id text PRIMARY KEY,
  name text,
  title text,
  body text,
  thumbnail_url text,
  image_url text,
  raw jsonb,
  synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.meta_ads (
  id text PRIMARY KEY,
  campaign_id text REFERENCES public.meta_campaigns(id) ON DELETE SET NULL,
  ad_set_id text REFERENCES public.meta_ad_sets(id) ON DELETE SET NULL,
  creative_id text REFERENCES public.meta_creatives(id) ON DELETE SET NULL,
  name text,
  status text,
  raw jsonb,
  synced_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_meta_ads_campaign ON public.meta_ads(campaign_id);
CREATE INDEX ix_meta_ads_adset ON public.meta_ads(ad_set_id);

CREATE TABLE public.meta_leadgen_forms (
  id text PRIMARY KEY,
  page_id text NOT NULL,
  name text,
  status text,
  leads_count int,
  questions jsonb,
  created_time timestamptz,
  raw jsonb,
  synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.meta_insights_daily (
  id bigserial PRIMARY KEY,
  level text NOT NULL CHECK (level IN ('account','campaign','adset','ad')),
  object_id text NOT NULL,
  date date NOT NULL,
  spend numeric,
  impressions bigint,
  reach bigint,
  frequency numeric,
  clicks bigint,
  link_clicks bigint,
  ctr numeric,
  cpc numeric,
  cpm numeric,
  leads bigint,
  cost_per_lead numeric,
  actions jsonb,
  cost_per_action_type jsonb,
  raw jsonb,
  synced_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (level, object_id, date)
);
CREATE INDEX ix_meta_insights_daily_date ON public.meta_insights_daily(date DESC);
CREATE INDEX ix_meta_insights_daily_object ON public.meta_insights_daily(object_id, date DESC);

CREATE TABLE public.meta_execution_log (
  id bigserial PRIMARY KEY,
  function_name text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  ok boolean,
  rows_affected int,
  error_text text,
  context jsonb
);
CREATE INDEX ix_meta_execution_log_started ON public.meta_execution_log(started_at DESC);

-- =======================================================================
-- RLS
-- =======================================================================

ALTER TABLE public.meta_credentials     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_campaigns       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_ad_sets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_creatives       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_ads             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_leadgen_forms   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_insights_daily  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_execution_log   ENABLE ROW LEVEL SECURITY;

-- Padrao da B&Z: usa has_role(uid, 'admin'::app_role) (ver migrations
-- 20260128 / 20260326 / 20260327). Read aberto p/ admin; write idem.
-- Service role bypassa, entao os crons sincronizam sem problema.

-- meta_credentials
CREATE POLICY meta_credentials_admin_read ON public.meta_credentials
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY meta_credentials_admin_write ON public.meta_credentials
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- meta_campaigns
CREATE POLICY meta_campaigns_admin_read ON public.meta_campaigns
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY meta_campaigns_admin_write ON public.meta_campaigns
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- meta_ad_sets
CREATE POLICY meta_ad_sets_admin_read ON public.meta_ad_sets
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY meta_ad_sets_admin_write ON public.meta_ad_sets
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- meta_creatives
CREATE POLICY meta_creatives_admin_read ON public.meta_creatives
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY meta_creatives_admin_write ON public.meta_creatives
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- meta_ads
CREATE POLICY meta_ads_admin_read ON public.meta_ads
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY meta_ads_admin_write ON public.meta_ads
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- meta_leadgen_forms
CREATE POLICY meta_leadgen_forms_admin_read ON public.meta_leadgen_forms
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY meta_leadgen_forms_admin_write ON public.meta_leadgen_forms
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- meta_insights_daily
CREATE POLICY meta_insights_daily_admin_read ON public.meta_insights_daily
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY meta_insights_daily_admin_write ON public.meta_insights_daily
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- meta_execution_log (so leitura admin; insercao por service role)
CREATE POLICY meta_execution_log_admin_read ON public.meta_execution_log
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- =======================================================================
-- View pra cruzar leads_geral com campanhas
-- =======================================================================

CREATE OR REPLACE VIEW public.v_meta_lead_funnel
WITH (security_invoker = true) AS
SELECT
  lg.id            AS lead_id,
  lg.created_time  AS lead_at,
  lg.ad_id, lg.ad_name,
  lg.campaign_id, lg.campaign_name,
  lg.adset_id, lg.adset_name,
  lg.status_sdr,
  (lg.status_sdr IN ('cliente','agendado','assumido_humano','sql_aguardando_humano')) AS converted,
  mc.objective,
  mc.status AS campaign_status
FROM public.leads_geral lg
LEFT JOIN public.meta_campaigns mc ON mc.id = lg.campaign_id
WHERE lg.ad_id IS NOT NULL OR lg.campaign_id IS NOT NULL;

COMMENT ON VIEW public.v_meta_lead_funnel IS
  'Cruza leads do bot SDR (leads_geral) com a estrutura das campanhas Meta. ' ||
  'security_invoker=true: respeita RLS de leads_geral + meta_campaigns do usuario.';

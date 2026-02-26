
-- Tabela de eventos de aquisição/marketing (separada do CRM)
CREATE TABLE public.lead_acquisition_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_normalized TEXT NOT NULL,
  contact_submission_id UUID REFERENCES public.contact_submissions(id) ON DELETE SET NULL,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ingested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Marketing source
  source_platform TEXT,  -- fb, ig, tiktok, etc.
  is_organic BOOLEAN DEFAULT false,
  origem_resolved TEXT,  -- facebook, instagram, meta, outro
  ingestion_channel TEXT DEFAULT 'n8n',  -- google_sheets, n8n, api, manual
  
  -- Campaign data
  campaign_id TEXT,
  campaign_name TEXT,
  adset_id TEXT,
  adset_name TEXT,
  ad_id TEXT,
  ad_name TEXT,
  form_id TEXT,
  form_name TEXT,
  
  -- Full raw payload
  raw_payload JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index on phone for fast lookups
CREATE INDEX idx_lead_acquisition_events_phone ON public.lead_acquisition_events(phone_normalized);
CREATE INDEX idx_lead_acquisition_events_contact ON public.lead_acquisition_events(contact_submission_id);
CREATE INDEX idx_lead_acquisition_events_occurred ON public.lead_acquisition_events(occurred_at DESC);

-- Enable RLS
ALTER TABLE public.lead_acquisition_events ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can read acquisition events"
ON public.lead_acquisition_events FOR SELECT
USING (true);

CREATE POLICY "System can insert acquisition events"
ON public.lead_acquisition_events FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update acquisition events"
ON public.lead_acquisition_events FOR UPDATE
USING (true);

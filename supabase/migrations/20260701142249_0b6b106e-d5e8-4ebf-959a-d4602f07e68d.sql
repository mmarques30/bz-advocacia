
ALTER TABLE public.leads_geral
  ADD COLUMN IF NOT EXISTS urgencia text,
  ADD COLUMN IF NOT EXISTS dados_capturados jsonb NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_geral_urgencia_check'
  ) THEN
    ALTER TABLE public.leads_geral
      ADD CONSTRAINT leads_geral_urgencia_check
      CHECK (urgencia IS NULL OR urgencia IN ('alta','media','baixa'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_leads_geral_urgencia ON public.leads_geral (urgencia);
CREATE INDEX IF NOT EXISTS idx_qualif_sdr_lead_created ON public.qualificacoes_sdr (lead_id, created_at);

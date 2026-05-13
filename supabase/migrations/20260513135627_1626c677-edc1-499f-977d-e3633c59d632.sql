ALTER TABLE public.contact_submissions
  ADD COLUMN IF NOT EXISTS lead_geral_id text;

CREATE UNIQUE INDEX IF NOT EXISTS contact_submissions_lead_geral_id_key
  ON public.contact_submissions (lead_geral_id)
  WHERE lead_geral_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS contact_submissions_telefone_idx
  ON public.contact_submissions (telefone);
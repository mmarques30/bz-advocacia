ALTER TABLE public.contact_submissions
  ADD COLUMN IF NOT EXISTS telefone_digits text
  GENERATED ALWAYS AS (regexp_replace(coalesce(telefone,''),'\D','','g')) STORED;

CREATE INDEX IF NOT EXISTS idx_cs_telefone_digits
  ON public.contact_submissions(telefone_digits);

ALTER TABLE public.leads_geral
  ADD COLUMN IF NOT EXISTS telefone_digits text
  GENERATED ALWAYS AS (regexp_replace(coalesce(phone_number, contato_whatsapp, ''),'\D','','g')) STORED;

CREATE INDEX IF NOT EXISTS idx_lg_telefone_digits
  ON public.leads_geral(telefone_digits);
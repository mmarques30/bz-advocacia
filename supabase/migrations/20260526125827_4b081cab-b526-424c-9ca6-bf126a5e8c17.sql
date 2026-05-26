ALTER TABLE public.leads_geral 
ADD COLUMN IF NOT EXISTS tentativas_etapa integer NOT NULL DEFAULT 0;
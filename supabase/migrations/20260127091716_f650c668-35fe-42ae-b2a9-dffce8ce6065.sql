-- Adicionar coluna para link geral do Drive do cliente no processo
ALTER TABLE public.processos 
ADD COLUMN IF NOT EXISTS pasta_drive_url text;
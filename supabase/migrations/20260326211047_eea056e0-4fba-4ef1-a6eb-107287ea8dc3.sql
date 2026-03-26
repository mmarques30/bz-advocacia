ALTER TABLE public.processos 
  ADD COLUMN extrajudicial boolean DEFAULT false,
  ADD COLUMN codigo_interno text;
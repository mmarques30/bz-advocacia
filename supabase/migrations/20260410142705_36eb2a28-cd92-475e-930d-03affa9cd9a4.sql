ALTER TABLE public.templates DROP CONSTRAINT templates_tipo_check;
ALTER TABLE public.templates ADD CONSTRAINT templates_tipo_check 
  CHECK (tipo = ANY (ARRAY['documento','email','whatsapp','contrato','proposta','procuracao','peticao','comunicacao']));

-- Add numero_contrato column
ALTER TABLE public.contratos_gerados ADD COLUMN numero_contrato integer;

-- Create sequence for contract numbers
CREATE SEQUENCE IF NOT EXISTS contratos_numero_seq START 1;

-- Update function to also assign numero_contrato for non-proposal contracts
CREATE OR REPLACE FUNCTION public.set_numero_proposta()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.tipo_contrato = 'proposta' AND NEW.numero_proposta IS NULL THEN
    NEW.numero_proposta := nextval('propostas_numero_seq');
  ELSIF NEW.tipo_contrato != 'proposta' AND NEW.numero_contrato IS NULL THEN
    NEW.numero_contrato := nextval('contratos_numero_seq');
  END IF;
  RETURN NEW;
END;
$function$;

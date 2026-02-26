
ALTER TABLE contratos_gerados ADD COLUMN numero_proposta integer;

CREATE SEQUENCE propostas_numero_seq START 1;

CREATE OR REPLACE FUNCTION public.set_numero_proposta()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.tipo_contrato = 'proposta' AND NEW.numero_proposta IS NULL THEN
    NEW.numero_proposta := nextval('propostas_numero_seq');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_numero_proposta
BEFORE INSERT ON contratos_gerados
FOR EACH ROW EXECUTE FUNCTION public.set_numero_proposta();

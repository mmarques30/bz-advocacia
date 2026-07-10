
-- Helper: insere telefone no bloqueio ignorando duplicata
CREATE OR REPLACE FUNCTION public.auto_bloquear_telefone_bot(
  p_telefone text,
  p_motivo text,
  p_nome text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tel text;
BEGIN
  IF p_telefone IS NULL THEN RETURN; END IF;
  v_tel := regexp_replace(p_telefone, '\D', '', 'g');
  IF length(v_tel) < 10 THEN RETURN; END IF;
  -- Normaliza para formato com 55 (DDI Brasil)
  IF left(v_tel, 2) <> '55' THEN
    v_tel := '55' || v_tel;
  END IF;
  INSERT INTO public.numeros_bloqueados_bot (telefone, nome, motivo)
  VALUES (v_tel, p_nome, p_motivo)
  ON CONFLICT (telefone) DO NOTHING;
END;
$$;

-- Trigger 1: contact_submissions
CREATE OR REPLACE FUNCTION public.trg_auto_block_contact_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ESTAGIOS_ATIVOS text[] := ARRAY['contato_inicial','em_analise','proposta_enviada','fechado'];
BEGIN
  IF NEW.telefone IS NULL THEN RETURN NEW; END IF;
  IF (NEW.responsavel_id IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.responsavel_id IS DISTINCT FROM NEW.responsavel_id))
     OR (NEW.estagio = ANY(ESTAGIOS_ATIVOS) AND (TG_OP = 'INSERT' OR OLD.estagio IS DISTINCT FROM NEW.estagio))
  THEN
    PERFORM public.auto_bloquear_telefone_bot(
      NEW.telefone,
      'auto_crm_ativo_' || COALESCE(NEW.estagio, 'sem_estagio'),
      NEW.nome_completo
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_block_contact_submission ON public.contact_submissions;
CREATE TRIGGER auto_block_contact_submission
  AFTER INSERT OR UPDATE OF responsavel_id, estagio ON public.contact_submissions
  FOR EACH ROW EXECUTE FUNCTION public.trg_auto_block_contact_submission();

-- Trigger 2: processos (lead_id -> contact_submissions)
CREATE OR REPLACE FUNCTION public.trg_auto_block_processo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tel text;
  v_nome text;
BEGIN
  IF NEW.lead_id IS NULL THEN RETURN NEW; END IF;
  SELECT telefone, nome_completo INTO v_tel, v_nome
  FROM public.contact_submissions WHERE id = NEW.lead_id;
  IF v_tel IS NOT NULL THEN
    PERFORM public.auto_bloquear_telefone_bot(v_tel, 'auto_processo_criado', v_nome);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_block_processo ON public.processos;
CREATE TRIGGER auto_block_processo
  AFTER INSERT ON public.processos
  FOR EACH ROW EXECUTE FUNCTION public.trg_auto_block_processo();

-- Trigger 3: acordos_financeiros
CREATE OR REPLACE FUNCTION public.trg_auto_block_acordo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tel text;
  v_nome text;
BEGIN
  IF NEW.cliente_id IS NULL THEN RETURN NEW; END IF;
  SELECT telefone, nome_completo INTO v_tel, v_nome
  FROM public.contact_submissions WHERE id = NEW.cliente_id;
  IF v_tel IS NOT NULL THEN
    PERFORM public.auto_bloquear_telefone_bot(v_tel, 'auto_acordo_criado', v_nome);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_block_acordo ON public.acordos_financeiros;
CREATE TRIGGER auto_block_acordo
  AFTER INSERT ON public.acordos_financeiros
  FOR EACH ROW EXECUTE FUNCTION public.trg_auto_block_acordo();

-- 1) Função para sincronizar status dos processos quando o status do cliente mudar
CREATE OR REPLACE FUNCTION public.sync_processos_status_from_cliente()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Só agir quando houver mudança efetiva
  IF (TG_OP = 'UPDATE') AND (NEW.status_cliente IS DISTINCT FROM OLD.status_cliente) THEN
    UPDATE public.processos
    SET status = CASE
      WHEN NEW.status_cliente = 'inativo' THEN 'concluido'
      ELSE 'em_andamento'
    END
    WHERE lead_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- 2) Trigger para disparar a sincronização
DROP TRIGGER IF EXISTS trg_sync_processos_status_from_cliente ON public.contact_submissions;

CREATE TRIGGER trg_sync_processos_status_from_cliente
AFTER UPDATE OF status_cliente ON public.contact_submissions
FOR EACH ROW
EXECUTE FUNCTION public.sync_processos_status_from_cliente();
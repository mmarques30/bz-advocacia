-- =====================================================================
-- Corrige o tipo de leads_backlog.lead_geral_id (UUID -> TEXT)
-- =====================================================================
-- Bug observado: ao aprovar um item no Backlog de Leads, a UI quebrava
-- com 'invalid input syntax for type uuid: "sdr_wa_..."'.
--
-- Causa: a tabela leads_backlog foi criada com lead_geral_id UUID
-- (migration 20260513150521), mas leads_geral.id é TEXT (o bot SDR usa
-- IDs sinteticos no formato 'sdr_wa_<timestamp>_<phone>'). Todas as
-- outras tabelas relacionadas ja usam TEXT:
--   - contact_submissions.lead_geral_id text  (migration 20260513135627)
--   - mensagens_sdr.lead_id              text  (migration 20260513013832)
--   - eventos_sdr.lead_id                text
--   - qualificacoes_sdr.lead_id          text
--
-- Esta migration:
--   1. Remove a constraint FK existente (se houver, e se for de tipo
--      incompativel) para permitir o ALTER COLUMN.
--   2. Altera leads_backlog.lead_geral_id para TEXT, preservando dados
--      ja gravados (UUIDs viram a sua representacao textual).
--   3. (Re)cria a constraint FK apontando para leads_geral(id) com
--      ON DELETE SET NULL.
-- =====================================================================

DO $$
DECLARE
  existing_constraint text;
BEGIN
  -- 1. Dropa FK existente se houver, qualquer que seja o nome
  SELECT constraint_name INTO existing_constraint
  FROM information_schema.table_constraints
  WHERE table_schema = 'public'
    AND table_name = 'leads_backlog'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%lead_geral_id%';

  IF existing_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.leads_backlog DROP CONSTRAINT %I', existing_constraint);
  END IF;
END$$;

-- 2. Converte a coluna pra text. UUIDs existentes viram sua
--    representacao textual (formato canonico hifenizado).
ALTER TABLE public.leads_backlog
  ALTER COLUMN lead_geral_id TYPE text USING lead_geral_id::text;

-- 3. Re-cria a FK
ALTER TABLE public.leads_backlog
  ADD CONSTRAINT leads_backlog_lead_geral_id_fkey
  FOREIGN KEY (lead_geral_id)
  REFERENCES public.leads_geral(id)
  ON DELETE SET NULL;

-- Forca aplicacao da coluna leads_geral.tipo_contato.
--
-- A migration original (20260616112000_garantir_lead_geral_e_tipo_contato.sql)
-- foi commitada e merged, mas o painel reporta:
--   "Could not find the 'tipo_contato' column of 'leads_geral' in the schema cache"
-- Possivelmente Lovable executou so o CREATE FUNCTION e nao o ALTER TABLE
-- (multi-statement parcial), ou o PostgREST nao recarregou o schema cache.
--
-- Esta migration:
--   1. Adiciona a coluna (IF NOT EXISTS — seguro se ja existe)
--   2. Adiciona o CHECK constraint nominal (idempotente via DO block)
--   3. Cria o indice parcial pra performance de filtros
--   4. Notifica PostgREST pra recarregar o schema cache

ALTER TABLE public.leads_geral
  ADD COLUMN IF NOT EXISTS tipo_contato text NOT NULL DEFAULT 'lead';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'leads_geral_tipo_contato_check'
      AND conrelid = 'public.leads_geral'::regclass
  ) THEN
    ALTER TABLE public.leads_geral
      ADD CONSTRAINT leads_geral_tipo_contato_check
      CHECK (tipo_contato IN ('lead', 'fornecedor', 'parceiro', 'institucional', 'pessoal'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_leads_geral_tipo_contato
  ON public.leads_geral(tipo_contato) WHERE tipo_contato <> 'lead';

COMMENT ON COLUMN public.leads_geral.tipo_contato IS
  'Classifica o contato. Default lead (entra no funil). Demais valores '
  '(fornecedor, parceiro, institucional, pessoal) sao "nao-leads" e o '
  'pipeline filtra eles.';

-- Forca PostgREST a recarregar o schema cache.
NOTIFY pgrst, 'reload schema';

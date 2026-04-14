-- =============================================
-- Advogadas refactor — Fase A (foundation)
--
-- Objetivo: introduzir uma fonte unica de verdade no banco para
-- saber quem e advogada, sem remover nenhuma coluna legada. Esta
-- migration e 100% aditiva e idempotente.
--
-- Plano completo: docs/migracao-advogadas-hardcoded.md
--
-- Fase A entrega:
-- 1. Coluna profiles.is_advogada (boolean, default false)
-- 2. Backfill conservador: marca profiles cujo nome comeca com
--    "Juliana" ou "Eliziane" (as advogadas atuais) como
--    is_advogada = true. Se mais alguem entrar no futuro, o admin
--    marca pela UI.
-- 3. Index parcial para lookups rapidos de "apenas advogadas".
--
-- demandas_internas.responsavel_id ja existe (criado em migration
-- anterior), entao nao precisamos fazer nada la nesta fase.
--
-- Toda a migration e envolta em guards de to_regclass() para que
-- ela seja um no-op seguro em bancos cujo schema nao tem `profiles`
-- (como o workspace xftzkzlfzmkihypyjwjn que so tem 4 tabelas).
-- =============================================

DO $$
BEGIN
  -- ---- 1. Adicionar coluna is_advogada se ainda nao existir ----
  IF to_regclass('public.profiles') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'profiles'
         AND column_name = 'is_advogada'
    ) THEN
      ALTER TABLE public.profiles
        ADD COLUMN is_advogada boolean NOT NULL DEFAULT false;
      COMMENT ON COLUMN public.profiles.is_advogada IS
        'Marca o profile como advogada responsavel (origem da Fase A do '
        'refactor de advogadas hardcoded — ver docs/migracao-advogadas-hardcoded.md)';
    END IF;

    -- ---- 2. Backfill conservador para as advogadas atuais ----
    -- Nao sobrescreve profiles que ja foram marcados manualmente.
    UPDATE public.profiles
       SET is_advogada = true
     WHERE is_advogada = false
       AND (
         nome_completo ILIKE 'Juliana%'
         OR nome_completo ILIKE 'Eliziane%'
       );

    -- ---- 3. Index parcial para queries de "apenas advogadas" ----
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_profiles_is_advogada_true
               ON public.profiles(id)
               WHERE is_advogada = true';
  ELSE
    RAISE NOTICE 'Skipping Fase A (tabela profiles ausente)';
  END IF;
END;
$$;

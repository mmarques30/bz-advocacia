-- =============================================
-- Subcategoria → responsavel_profile_id — Fase A (aditivo)
--
-- Contexto: useReceitasPorResponsavel em
-- src/hooks/useTransacoesFinanceiras.ts:281-349 atribui cada
-- transacao a uma responsavel fazendo string match no
-- subcategoria_codigo e na descricao. Fase A move a atribuicao
-- para uma FK explicita (responsavel_profile_id), preservando
-- a logica atual para backfill.
--
-- Plano completo: docs/migracao-subcategoria-responsavel.md
--
-- Toda a migration e defensive: no-op se transacoes_financeiras
-- ou profiles nao existirem no schema ativo.
-- =============================================

DO $$
DECLARE
  _has_profile_juliana  uuid;
  _has_profile_eliziane uuid;
BEGIN
  IF to_regclass('public.transacoes_financeiras') IS NULL
     OR to_regclass('public.profiles') IS NULL THEN
    RAISE NOTICE 'Skipping subcategoria_responsavel Fase A (tabelas ausentes)';
    RETURN;
  END IF;

  -- ---- 1. Adicionar coluna responsavel_profile_id ----
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name  = 'transacoes_financeiras'
       AND column_name = 'responsavel_profile_id'
  ) THEN
    ALTER TABLE public.transacoes_financeiras
      ADD COLUMN responsavel_profile_id uuid REFERENCES public.profiles(id);
    COMMENT ON COLUMN public.transacoes_financeiras.responsavel_profile_id IS
      'Advogada responsavel pela receita/despesa. Substitui gradualmente a '
      'heuristica de string-matching em subcategoria_codigo + descricao. '
      'Ver docs/migracao-subcategoria-responsavel.md';
  END IF;

  -- ---- 2. Descobrir ids dos profiles atuais ----
  SELECT id INTO _has_profile_juliana
    FROM public.profiles
   WHERE nome_completo ILIKE 'Juliana%'
   ORDER BY created_at ASC NULLS LAST
   LIMIT 1;

  SELECT id INTO _has_profile_eliziane
    FROM public.profiles
   WHERE nome_completo ILIKE 'Eliziane%'
   ORDER BY created_at ASC NULLS LAST
   LIMIT 1;

  -- ---- 3. Backfill: reproduz a heuristica do hook ----
  -- 3a. subcategoria_codigo ILIKE 'juliana'
  IF _has_profile_juliana IS NOT NULL THEN
    UPDATE public.transacoes_financeiras
       SET responsavel_profile_id = _has_profile_juliana
     WHERE responsavel_profile_id IS NULL
       AND lower(coalesce(subcategoria_codigo, '')) = 'juliana';
  END IF;

  -- 3b. subcategoria_codigo ILIKE 'eliziane'
  IF _has_profile_eliziane IS NOT NULL THEN
    UPDATE public.transacoes_financeiras
       SET responsavel_profile_id = _has_profile_eliziane
     WHERE responsavel_profile_id IS NULL
       AND lower(coalesce(subcategoria_codigo, '')) = 'eliziane';
  END IF;

  -- 3c. Fallback por descricao, apenas quando categoria = 'pf'
  -- (preservando comportamento atual do hook).
  IF _has_profile_juliana IS NOT NULL THEN
    UPDATE public.transacoes_financeiras
       SET responsavel_profile_id = _has_profile_juliana
     WHERE responsavel_profile_id IS NULL
       AND categoria_codigo = 'pf'
       AND lower(coalesce(descricao, '')) ~ 'juliana';
  END IF;

  IF _has_profile_eliziane IS NOT NULL THEN
    UPDATE public.transacoes_financeiras
       SET responsavel_profile_id = _has_profile_eliziane
     WHERE responsavel_profile_id IS NULL
       AND categoria_codigo = 'pf'
       AND lower(coalesce(descricao, '')) ~ 'eliziane';
  END IF;

  -- Transacoes com categoria 'pj' (B&Z Advocacia) ou sem match
  -- ficam com responsavel_profile_id = NULL — semanticamente
  -- "nao atribuido a advogada individual". A Fase C do refactor
  -- decidira como exibir estes casos no dashboard.

  -- ---- 4. Index parcial para o dashboard de sócias ----
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_transacoes_responsavel_profile
             ON public.transacoes_financeiras(responsavel_profile_id)
             WHERE responsavel_profile_id IS NOT NULL';
END;
$$;

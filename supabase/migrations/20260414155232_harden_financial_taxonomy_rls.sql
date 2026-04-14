-- =============================================
-- Phase 3 / Item 7 — Harden RLS on financial taxonomy tables.
--
-- DEFENSIVE VERSION: original migration assumed the long-name schema.
-- On the live Lovable Cloud database, the taxonomy tables may be
-- named `categorias`, `subcategorias`, `tipos`, `transacoes` instead,
-- or may not exist at all. Each table block is therefore guarded by
-- to_regclass() and becomes a no-op when the table is absent.
-- =============================================

DO $$
BEGIN
  -- -----------------------------------------------
  -- categorias_financeiras
  -- -----------------------------------------------
  IF to_regclass('public.categorias_financeiras') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.categorias_financeiras ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can read categorias" ON public.categorias_financeiras';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can manage categorias" ON public.categorias_financeiras';

    EXECUTE $pol$
      CREATE POLICY "cat_select" ON public.categorias_financeiras FOR SELECT TO authenticated
        USING (
          auth.uid() IS NOT NULL AND (
            has_role(auth.uid(), 'admin')
            OR has_role(auth.uid(), 'advogado')
            OR has_role(auth.uid(), 'financeiro')
          )
        )
    $pol$;
    EXECUTE $pol$
      CREATE POLICY "cat_insert" ON public.categorias_financeiras FOR INSERT TO authenticated
        WITH CHECK (
          auth.uid() IS NOT NULL AND (
            has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'financeiro')
          )
        )
    $pol$;
    EXECUTE $pol$
      CREATE POLICY "cat_update" ON public.categorias_financeiras FOR UPDATE TO authenticated
        USING (
          auth.uid() IS NOT NULL AND (
            has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'financeiro')
          )
        )
    $pol$;
    EXECUTE $pol$
      CREATE POLICY "cat_delete" ON public.categorias_financeiras FOR DELETE TO authenticated
        USING (
          auth.uid() IS NOT NULL AND (
            has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'financeiro')
          )
        )
    $pol$;
  ELSE
    RAISE NOTICE 'Skipping categorias_financeiras RLS harden (table missing)';
  END IF;

  -- -----------------------------------------------
  -- tipos_transacao
  -- -----------------------------------------------
  IF to_regclass('public.tipos_transacao') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.tipos_transacao ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can read tipos" ON public.tipos_transacao';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can manage tipos" ON public.tipos_transacao';

    EXECUTE $pol$
      CREATE POLICY "tt_select" ON public.tipos_transacao FOR SELECT TO authenticated
        USING (
          auth.uid() IS NOT NULL AND (
            has_role(auth.uid(), 'admin')
            OR has_role(auth.uid(), 'advogado')
            OR has_role(auth.uid(), 'financeiro')
          )
        )
    $pol$;
    EXECUTE $pol$
      CREATE POLICY "tt_insert" ON public.tipos_transacao FOR INSERT TO authenticated
        WITH CHECK (
          auth.uid() IS NOT NULL AND (
            has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'financeiro')
          )
        )
    $pol$;
    EXECUTE $pol$
      CREATE POLICY "tt_update" ON public.tipos_transacao FOR UPDATE TO authenticated
        USING (
          auth.uid() IS NOT NULL AND (
            has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'financeiro')
          )
        )
    $pol$;
    EXECUTE $pol$
      CREATE POLICY "tt_delete" ON public.tipos_transacao FOR DELETE TO authenticated
        USING (
          auth.uid() IS NOT NULL AND (
            has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'financeiro')
          )
        )
    $pol$;
  ELSE
    RAISE NOTICE 'Skipping tipos_transacao RLS harden (table missing)';
  END IF;

  -- -----------------------------------------------
  -- subcategorias_financeiras
  -- -----------------------------------------------
  IF to_regclass('public.subcategorias_financeiras') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.subcategorias_financeiras ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can read subcategorias" ON public.subcategorias_financeiras';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can manage subcategorias" ON public.subcategorias_financeiras';

    EXECUTE $pol$
      CREATE POLICY "sub_select" ON public.subcategorias_financeiras FOR SELECT TO authenticated
        USING (
          auth.uid() IS NOT NULL AND (
            has_role(auth.uid(), 'admin')
            OR has_role(auth.uid(), 'advogado')
            OR has_role(auth.uid(), 'financeiro')
          )
        )
    $pol$;
    EXECUTE $pol$
      CREATE POLICY "sub_insert" ON public.subcategorias_financeiras FOR INSERT TO authenticated
        WITH CHECK (
          auth.uid() IS NOT NULL AND (
            has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'financeiro')
          )
        )
    $pol$;
    EXECUTE $pol$
      CREATE POLICY "sub_update" ON public.subcategorias_financeiras FOR UPDATE TO authenticated
        USING (
          auth.uid() IS NOT NULL AND (
            has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'financeiro')
          )
        )
    $pol$;
    EXECUTE $pol$
      CREATE POLICY "sub_delete" ON public.subcategorias_financeiras FOR DELETE TO authenticated
        USING (
          auth.uid() IS NOT NULL AND (
            has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'financeiro')
          )
        )
    $pol$;
  ELSE
    RAISE NOTICE 'Skipping subcategorias_financeiras RLS harden (table missing)';
  END IF;
END;
$$;

-- =============================================
-- Harden RLS on financial taxonomy tables.
--
-- Migration 20251216123014 created `categorias_financeiras`,
-- `tipos_transacao` and `subcategorias_financeiras` with `USING (true)`
-- policies — any anonymous caller with the public API key could read and
-- even mutate these rows. These tables drive the Financial module
-- dropdowns, so exposure lets attackers enumerate the office's
-- chart-of-accounts and potentially rewrite it.
--
-- This migration replaces those policies with role-gated ones, matching
-- the pattern used by fin_*, tf_*, df_* and cc_* in
-- 20260327174932_e9076d86 (admin/advogado/financeiro read; admin/
-- financeiro write). Drops are IF EXISTS so the migration stays
-- idempotent.
-- =============================================

-- -----------------------------------------------
-- categorias_financeiras
-- -----------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can read categorias" ON public.categorias_financeiras;
DROP POLICY IF EXISTS "Authenticated users can manage categorias" ON public.categorias_financeiras;

CREATE POLICY "cat_select" ON public.categorias_financeiras FOR SELECT TO authenticated
  USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'advogado')
      OR has_role(auth.uid(), 'financeiro')
    )
  );

CREATE POLICY "cat_insert" ON public.categorias_financeiras FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'financeiro')
    )
  );

CREATE POLICY "cat_update" ON public.categorias_financeiras FOR UPDATE TO authenticated
  USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'financeiro')
    )
  );

CREATE POLICY "cat_delete" ON public.categorias_financeiras FOR DELETE TO authenticated
  USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'financeiro')
    )
  );

-- -----------------------------------------------
-- tipos_transacao
-- -----------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can read tipos" ON public.tipos_transacao;
DROP POLICY IF EXISTS "Authenticated users can manage tipos" ON public.tipos_transacao;

CREATE POLICY "tt_select" ON public.tipos_transacao FOR SELECT TO authenticated
  USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'advogado')
      OR has_role(auth.uid(), 'financeiro')
    )
  );

CREATE POLICY "tt_insert" ON public.tipos_transacao FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'financeiro')
    )
  );

CREATE POLICY "tt_update" ON public.tipos_transacao FOR UPDATE TO authenticated
  USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'financeiro')
    )
  );

CREATE POLICY "tt_delete" ON public.tipos_transacao FOR DELETE TO authenticated
  USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'financeiro')
    )
  );

-- -----------------------------------------------
-- subcategorias_financeiras
-- -----------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can read subcategorias" ON public.subcategorias_financeiras;
DROP POLICY IF EXISTS "Authenticated users can manage subcategorias" ON public.subcategorias_financeiras;

CREATE POLICY "sub_select" ON public.subcategorias_financeiras FOR SELECT TO authenticated
  USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'advogado')
      OR has_role(auth.uid(), 'financeiro')
    )
  );

CREATE POLICY "sub_insert" ON public.subcategorias_financeiras FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'financeiro')
    )
  );

CREATE POLICY "sub_update" ON public.subcategorias_financeiras FOR UPDATE TO authenticated
  USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'financeiro')
    )
  );

CREATE POLICY "sub_delete" ON public.subcategorias_financeiras FOR DELETE TO authenticated
  USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'financeiro')
    )
  );

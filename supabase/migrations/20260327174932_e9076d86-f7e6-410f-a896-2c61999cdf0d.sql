
-- =============================================
-- FINANCEIRO
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can insert financeiro" ON public.financeiro;
DROP POLICY IF EXISTS "Authenticated users can read financeiro" ON public.financeiro;

CREATE POLICY "fin_select" ON public.financeiro FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'advogado') OR has_role(auth.uid(), 'financeiro'));

CREATE POLICY "fin_insert" ON public.financeiro FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'financeiro'));

CREATE POLICY "fin_update" ON public.financeiro FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'financeiro'));

CREATE POLICY "fin_delete" ON public.financeiro FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'financeiro'));

-- =============================================
-- TRANSACOES_FINANCEIRAS
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can manage transacoes" ON public.transacoes_financeiras;
DROP POLICY IF EXISTS "Authenticated users can read transacoes" ON public.transacoes_financeiras;

CREATE POLICY "tf_select" ON public.transacoes_financeiras FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'advogado') OR has_role(auth.uid(), 'financeiro'));

CREATE POLICY "tf_insert" ON public.transacoes_financeiras FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'financeiro'));

CREATE POLICY "tf_update" ON public.transacoes_financeiras FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'financeiro'));

CREATE POLICY "tf_delete" ON public.transacoes_financeiras FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'financeiro'));

-- =============================================
-- DESPESAS_FIXAS
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can manage despesas_fixas" ON public.despesas_fixas;

CREATE POLICY "df_select" ON public.despesas_fixas FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'advogado') OR has_role(auth.uid(), 'financeiro'));

CREATE POLICY "df_insert" ON public.despesas_fixas FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'financeiro'));

CREATE POLICY "df_update" ON public.despesas_fixas FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'financeiro'));

CREATE POLICY "df_delete" ON public.despesas_fixas FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'financeiro'));

-- =============================================
-- CREDITOS_CONDICIONAIS
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can manage creditos_condicionais" ON public.creditos_condicionais;

CREATE POLICY "cc_select" ON public.creditos_condicionais FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'advogado') OR has_role(auth.uid(), 'financeiro'));

CREATE POLICY "cc_insert" ON public.creditos_condicionais FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'financeiro'));

CREATE POLICY "cc_update" ON public.creditos_condicionais FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'financeiro'));

CREATE POLICY "cc_delete" ON public.creditos_condicionais FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'financeiro'));

-- =============================================
-- PARCELAS_FINANCEIRAS
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can manage parcelas" ON public.parcelas_financeiras;

CREATE POLICY "pf_select" ON public.parcelas_financeiras FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'advogado') OR has_role(auth.uid(), 'financeiro'));

CREATE POLICY "pf_insert" ON public.parcelas_financeiras FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'financeiro'));

CREATE POLICY "pf_update" ON public.parcelas_financeiras FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'financeiro'));

CREATE POLICY "pf_delete" ON public.parcelas_financeiras FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'financeiro'));

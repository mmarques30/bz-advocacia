
-- 1. meta_campanhas: TO public → TO authenticated
DROP POLICY IF EXISTS "Authenticated users can manage meta_campanhas" ON public.meta_campanhas;
CREATE POLICY "Authenticated users can manage meta_campanhas" ON public.meta_campanhas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. meta_connections
DROP POLICY IF EXISTS "Authenticated users can manage meta_connections" ON public.meta_connections;
CREATE POLICY "Authenticated users can manage meta_connections" ON public.meta_connections FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. meta_metricas
DROP POLICY IF EXISTS "Authenticated users can manage meta_metricas" ON public.meta_metricas;
CREATE POLICY "Authenticated users can manage meta_metricas" ON public.meta_metricas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. meta_relatorios_auto
DROP POLICY IF EXISTS "Authenticated users can manage meta_relatorios_auto" ON public.meta_relatorios_auto;
CREATE POLICY "Authenticated users can manage meta_relatorios_auto" ON public.meta_relatorios_auto FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. meta_envios_historico
DROP POLICY IF EXISTS "Authenticated users can manage meta_envios_historico" ON public.meta_envios_historico;
CREATE POLICY "Authenticated users can manage meta_envios_historico" ON public.meta_envios_historico FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. categorias_externas
DROP POLICY IF EXISTS "Authenticated users can manage categorias_externas" ON public.categorias_externas;
DROP POLICY IF EXISTS "Authenticated users can read categorias_externas" ON public.categorias_externas;
CREATE POLICY "Authenticated users can manage categorias_externas" ON public.categorias_externas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. categorias_financeiras
DROP POLICY IF EXISTS "Authenticated users can manage categorias" ON public.categorias_financeiras;
DROP POLICY IF EXISTS "Authenticated users can read categorias" ON public.categorias_financeiras;
CREATE POLICY "Authenticated users can manage categorias_financeiras" ON public.categorias_financeiras FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 8. leads_geral: remove all public policies, add authenticated
DROP POLICY IF EXISTS "Allow authenticated users to manage leads" ON public.leads_geral;
DROP POLICY IF EXISTS "Authenticated users can delete leads_geral" ON public.leads_geral;
DROP POLICY IF EXISTS "Authenticated users can insert leads_geral" ON public.leads_geral;
DROP POLICY IF EXISTS "Authenticated users can read leads_geral" ON public.leads_geral;
DROP POLICY IF EXISTS "Authenticated users can update leads_geral" ON public.leads_geral;
CREATE POLICY "Authenticated users can manage leads_geral" ON public.leads_geral FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 9. lead_acquisition_events
DROP POLICY IF EXISTS "Authenticated users can read acquisition events" ON public.lead_acquisition_events;
DROP POLICY IF EXISTS "Authenticated users can update acquisition events" ON public.lead_acquisition_events;
DROP POLICY IF EXISTS "System can insert acquisition events" ON public.lead_acquisition_events;
CREATE POLICY "Authenticated can read acquisition events" ON public.lead_acquisition_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can update acquisition events" ON public.lead_acquisition_events FOR UPDATE TO authenticated USING (true);
CREATE POLICY "System can insert acquisition events" ON public.lead_acquisition_events FOR INSERT TO authenticated WITH CHECK (true);

-- 10. leads_status_overrides
DROP POLICY IF EXISTS "Authenticated users can insert overrides" ON public.leads_status_overrides;
DROP POLICY IF EXISTS "Authenticated users can read overrides" ON public.leads_status_overrides;
DROP POLICY IF EXISTS "Authenticated users can update overrides" ON public.leads_status_overrides;
CREATE POLICY "Authenticated users can manage overrides" ON public.leads_status_overrides FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 11. acordos_financeiros: restrict by role
DROP POLICY IF EXISTS "Authenticated users can manage acordos" ON public.acordos_financeiros;
CREATE POLICY "acordos_select" ON public.acordos_financeiros FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'advogado'::app_role) OR has_role(auth.uid(), 'financeiro'::app_role));
CREATE POLICY "acordos_insert" ON public.acordos_financeiros FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'financeiro'::app_role));
CREATE POLICY "acordos_update" ON public.acordos_financeiros FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'financeiro'::app_role));
CREATE POLICY "acordos_delete" ON public.acordos_financeiros FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'financeiro'::app_role));

-- 12. despesas: restrict by role
DROP POLICY IF EXISTS "Authenticated users can manage despesas" ON public.despesas;
CREATE POLICY "despesas_select" ON public.despesas FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'advogado'::app_role) OR has_role(auth.uid(), 'financeiro'::app_role));
CREATE POLICY "despesas_insert" ON public.despesas FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'financeiro'::app_role));
CREATE POLICY "despesas_update" ON public.despesas FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'financeiro'::app_role));
CREATE POLICY "despesas_delete" ON public.despesas FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'financeiro'::app_role));

-- 13. documentos_drive: restrict write by role
DROP POLICY IF EXISTS "Authenticated users can manage documentos_drive" ON public.documentos_drive;
CREATE POLICY "docs_drive_select" ON public.documentos_drive FOR SELECT TO authenticated USING (true);
CREATE POLICY "docs_drive_insert" ON public.documentos_drive FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'advogado'::app_role));
CREATE POLICY "docs_drive_update" ON public.documentos_drive FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'advogado'::app_role));
CREATE POLICY "docs_drive_delete" ON public.documentos_drive FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'advogado'::app_role));


-- campanhas_envio
DROP POLICY IF EXISTS "admin_manage_campanhas" ON public.campanhas_envio;
DROP POLICY IF EXISTS "auth_read_campanhas" ON public.campanhas_envio;
CREATE POLICY "campanhas_admin_manage" ON public.campanhas_envio FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "campanhas_auth_read" ON public.campanhas_envio FOR SELECT TO authenticated USING (true);

-- consultas_config (api_token plaintext → admin only)
DROP POLICY IF EXISTS "Usuários podem visualizar config" ON public.consultas_config;
CREATE POLICY "Admins podem visualizar config consultas" ON public.consultas_config FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- meta_connections (access_token plaintext → owner or admin)
DROP POLICY IF EXISTS "Authenticated users can manage meta_connections" ON public.meta_connections;
CREATE POLICY "Users manage own meta_connections" ON public.meta_connections FOR ALL TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- resumo_anual_externo
DROP POLICY IF EXISTS "Authenticated users can manage resumo_anual_externo" ON public.resumo_anual_externo;
DROP POLICY IF EXISTS "Authenticated users can read resumo_anual_externo" ON public.resumo_anual_externo;
CREATE POLICY "resumo_anual_read" ON public.resumo_anual_externo FOR SELECT TO authenticated USING (true);
CREATE POLICY "resumo_anual_admin_write" ON public.resumo_anual_externo FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'financeiro'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'financeiro'));

-- resumo_mensal_externo
DROP POLICY IF EXISTS "Authenticated users can manage resumo_mensal_externo" ON public.resumo_mensal_externo;
DROP POLICY IF EXISTS "Authenticated users can read resumo_mensal_externo" ON public.resumo_mensal_externo;
CREATE POLICY "resumo_mensal_read" ON public.resumo_mensal_externo FOR SELECT TO authenticated USING (true);
CREATE POLICY "resumo_mensal_admin_write" ON public.resumo_mensal_externo FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'financeiro'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'financeiro'));

-- resumo_por_subcategoria_externo
DROP POLICY IF EXISTS "Authenticated users can manage resumo_por_subcategoria_externo" ON public.resumo_por_subcategoria_externo;
DROP POLICY IF EXISTS "Authenticated users can read resumo_por_subcategoria_externo" ON public.resumo_por_subcategoria_externo;
CREATE POLICY "resumo_subcat_read" ON public.resumo_por_subcategoria_externo FOR SELECT TO authenticated USING (true);
CREATE POLICY "resumo_subcat_admin_write" ON public.resumo_por_subcategoria_externo FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'financeiro'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'financeiro'));

-- transacoes_externas
DROP POLICY IF EXISTS "Authenticated users can manage transacoes_externas" ON public.transacoes_externas;
DROP POLICY IF EXISTS "Authenticated users can read transacoes_externas" ON public.transacoes_externas;
CREATE POLICY "transacoes_ext_read" ON public.transacoes_externas FOR SELECT TO authenticated USING (true);
CREATE POLICY "transacoes_ext_admin_write" ON public.transacoes_externas FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'financeiro'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'financeiro'));

-- rotinas_calendario
DROP POLICY IF EXISTS "Authenticated users can manage rotinas" ON public.rotinas_calendario;
CREATE POLICY "rotinas_auth_manage" ON public.rotinas_calendario FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- sheet_leads_raw (contém PII; INSERT vem de edge functions com service_role)
DROP POLICY IF EXISTS "Authenticated users can read sheet_leads_raw" ON public.sheet_leads_raw;
DROP POLICY IF EXISTS "System can insert sheet_leads_raw" ON public.sheet_leads_raw;
CREATE POLICY "sheet_leads_raw_auth_read" ON public.sheet_leads_raw FOR SELECT TO authenticated USING (true);
-- INSERT permanece sem policy para roles regulares; service_role bypassa RLS.

-- subcategorias_financeiras
DROP POLICY IF EXISTS "Authenticated users can manage subcategorias" ON public.subcategorias_financeiras;
DROP POLICY IF EXISTS "Authenticated users can read subcategorias" ON public.subcategorias_financeiras;
CREATE POLICY "subcat_fin_read" ON public.subcategorias_financeiras FOR SELECT TO authenticated USING (true);
CREATE POLICY "subcat_fin_admin_write" ON public.subcategorias_financeiras FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'financeiro'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'financeiro'));

-- tipos_transacao
DROP POLICY IF EXISTS "Authenticated users can manage tipos" ON public.tipos_transacao;
DROP POLICY IF EXISTS "Authenticated users can read tipos" ON public.tipos_transacao;
CREATE POLICY "tipos_trans_read" ON public.tipos_transacao FOR SELECT TO authenticated USING (true);
CREATE POLICY "tipos_trans_admin_write" ON public.tipos_transacao FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'financeiro'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'financeiro'));

-- templates_versoes
DROP POLICY IF EXISTS "Authenticated users can insert template versions" ON public.templates_versoes;
DROP POLICY IF EXISTS "Authenticated users can read template versions" ON public.templates_versoes;
CREATE POLICY "templates_versoes_read" ON public.templates_versoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "templates_versoes_insert" ON public.templates_versoes FOR INSERT TO authenticated WITH CHECK (true);

-- whatsapp_config (credentials + webhook_verify_token → admin only)
DROP POLICY IF EXISTS "Admins podem gerenciar config WhatsApp" ON public.whatsapp_config;
DROP POLICY IF EXISTS "Usuários autenticados podem ver config WhatsApp" ON public.whatsapp_config;
CREATE POLICY "wa_config_admin_all" ON public.whatsapp_config FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- whatsapp_historico
DROP POLICY IF EXISTS "Sistema pode atualizar histórico" ON public.whatsapp_historico;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir histórico" ON public.whatsapp_historico;
DROP POLICY IF EXISTS "Usuários autenticados podem ver histórico" ON public.whatsapp_historico;
CREATE POLICY "wa_hist_auth_read" ON public.whatsapp_historico FOR SELECT TO authenticated USING (true);
CREATE POLICY "wa_hist_auth_insert" ON public.whatsapp_historico FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "wa_hist_admin_update" ON public.whatsapp_historico FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- whatsapp_regras
DROP POLICY IF EXISTS "Admins podem gerenciar regras" ON public.whatsapp_regras;
DROP POLICY IF EXISTS "Usuários autenticados podem ver regras" ON public.whatsapp_regras;
CREATE POLICY "wa_regras_admin_all" ON public.whatsapp_regras FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "wa_regras_auth_read" ON public.whatsapp_regras FOR SELECT TO authenticated USING (true);

-- whatsapp_aprovacao
DROP POLICY IF EXISTS "Admins podem gerenciar aprovações" ON public.whatsapp_aprovacao;
DROP POLICY IF EXISTS "Usuários autenticados podem ver aprovações" ON public.whatsapp_aprovacao;
CREATE POLICY "wa_aprov_admin_all" ON public.whatsapp_aprovacao FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "wa_aprov_auth_read" ON public.whatsapp_aprovacao FOR SELECT TO authenticated USING (true);

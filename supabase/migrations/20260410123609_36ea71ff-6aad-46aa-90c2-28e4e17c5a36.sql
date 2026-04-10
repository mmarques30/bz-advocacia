
-- Fix chat_messages: TO public → TO authenticated
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON public.chat_messages;

CREATE POLICY "Users can delete their own messages" ON public.chat_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own messages" ON public.chat_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Fix demandas_internas: TO public → TO authenticated
DROP POLICY IF EXISTS "Admins or creator can delete demandas" ON public.demandas_internas;
DROP POLICY IF EXISTS "Authenticated users can insert demandas" ON public.demandas_internas;
DROP POLICY IF EXISTS "Authenticated users can read demandas" ON public.demandas_internas;
DROP POLICY IF EXISTS "Users can update own or assigned demandas" ON public.demandas_internas;

CREATE POLICY "Admins or creator can delete demandas" ON public.demandas_internas FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR (criado_por = auth.uid()));
CREATE POLICY "Authenticated users can insert demandas" ON public.demandas_internas FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can read demandas" ON public.demandas_internas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own or assigned demandas" ON public.demandas_internas FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR (criado_por = auth.uid()) OR (responsavel_id = auth.uid()));

-- Fix apify_config: TO public → TO authenticated
DROP POLICY IF EXISTS "Admins can insert apify_config" ON public.apify_config;
DROP POLICY IF EXISTS "Admins can update apify_config" ON public.apify_config;
DROP POLICY IF EXISTS "Admins can view apify_config" ON public.apify_config;

CREATE POLICY "Admins can insert apify_config" ON public.apify_config FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update apify_config" ON public.apify_config FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view apify_config" ON public.apify_config FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix melhorias_registro: INSERT TO public → TO authenticated
DROP POLICY IF EXISTS "System can insert melhorias" ON public.melhorias_registro;
CREATE POLICY "System can insert melhorias" ON public.melhorias_registro FOR INSERT TO authenticated WITH CHECK (true);

-- Drop dead kpis table
DROP TABLE IF EXISTS public.kpis;

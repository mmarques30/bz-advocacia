-- =============================================
-- RLS por role — matriz solicitada pelo escritorio
--
-- Decisao de produto:
--   admin       -> ve tudo (full access)
--   financeiro  -> tem acesso completo as tabelas financeiras + leitura
--                  de clientes/processos/demandas (contexto operacional);
--                  NAO pode escrever em modulos nao-financeiros.
--   advogado    -> ve todas as abas operacionais, MAS NAO ve nem altera
--   assistente     dados financeiros e relatorios. Tambem nao ve tabelas
--                  agregadas (resumo_*_externo, relatorios_compartilhados).
--
-- Mecanismo:
--   - Helper SQL `can_access_finance(uid)` = admin OR financeiro
--   - Cada tabela financeira tem suas policies recriadas para usar
--     can_access_finance() em SELECT/INSERT/UPDATE/DELETE.
--   - DROP de TODAS as policies pre-existentes por tabela antes de
--     recriar — evita conflito com nomes do passado (fin_*, tf_*,
--     X_authenticated_all, etc.).
--
-- Defensive: to_regclass guards. Tabelas inexistentes no schema ativo
-- viram no-op silencioso.
-- =============================================

-- --------------------------------------------------------------
-- Helper functions
-- --------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_access_finance(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
     WHERE user_id = _user_id
       AND role IN ('admin', 'financeiro')
  );
$$;

GRANT EXECUTE ON FUNCTION public.can_access_finance(uuid) TO authenticated;

COMMENT ON FUNCTION public.can_access_finance(uuid) IS
'Retorna true se o usuario tem acesso ao modulo financeiro: papel admin OU financeiro. Usado nas RLS policies das tabelas financeiras e de relatorios. Ver migration 20260415082112_rls_por_role.';

-- --------------------------------------------------------------
-- Helper PL/pgSQL: aplica o set de policies finance-only a uma tabela.
-- Faz drop de todas as policies existentes (para evitar conflito com
-- nomes legados) e cria 4 policies role-gated novas.
-- --------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._apply_finance_only_policies(_qualified_name text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  _reg    regclass;
  _schema text;
  _name   text;
  _pol    record;
BEGIN
  _reg := to_regclass(_qualified_name);
  IF _reg IS NULL THEN
    RAISE NOTICE 'Skipping RLS policies for % (table missing)', _qualified_name;
    RETURN;
  END IF;

  SELECT n.nspname, c.relname INTO _schema, _name
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE c.oid = _reg;

  -- Garante RLS habilitada (idempotente)
  EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', _schema, _name);

  -- Drop de todas as policies existentes nesta tabela.
  -- Necessario porque migrations anteriores deixaram nomes variados
  -- (fin_select, tf_select, "Authenticated users can ...", X_authenticated_all etc).
  FOR _pol IN
    SELECT policyname FROM pg_policies
     WHERE schemaname = _schema AND tablename = _name
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', _pol.policyname, _schema, _name);
  END LOOP;

  -- 4 policies role-gated novas.
  EXECUTE format(
    'CREATE POLICY %I ON %I.%I FOR SELECT TO authenticated USING (public.can_access_finance(auth.uid()))',
    _name || '_finance_select', _schema, _name
  );
  EXECUTE format(
    'CREATE POLICY %I ON %I.%I FOR INSERT TO authenticated WITH CHECK (public.can_access_finance(auth.uid()))',
    _name || '_finance_insert', _schema, _name
  );
  EXECUTE format(
    'CREATE POLICY %I ON %I.%I FOR UPDATE TO authenticated USING (public.can_access_finance(auth.uid())) WITH CHECK (public.can_access_finance(auth.uid()))',
    _name || '_finance_update', _schema, _name
  );
  EXECUTE format(
    'CREATE POLICY %I ON %I.%I FOR DELETE TO authenticated USING (public.can_access_finance(auth.uid()))',
    _name || '_finance_delete', _schema, _name
  );
END;
$$;

-- --------------------------------------------------------------
-- Aplicar nas tabelas FINANCEIRAS — escrita restrita a admin+financeiro.
-- Equipe (advogado/assistente) NAO ve nem edita nada destas tabelas.
-- --------------------------------------------------------------
SELECT public._apply_finance_only_policies('public.financeiro');
SELECT public._apply_finance_only_policies('public.despesas');
SELECT public._apply_finance_only_policies('public.despesas_fixas');
SELECT public._apply_finance_only_policies('public.acordos_financeiros');
SELECT public._apply_finance_only_policies('public.parcelas_financeiras');
SELECT public._apply_finance_only_policies('public.transacoes_financeiras');
SELECT public._apply_finance_only_policies('public.creditos_condicionais');
SELECT public._apply_finance_only_policies('public.historico_pagamentos');
SELECT public._apply_finance_only_policies('public.categorias_financeiras');
SELECT public._apply_finance_only_policies('public.subcategorias_financeiras');
SELECT public._apply_finance_only_policies('public.tipos_transacao');
SELECT public._apply_finance_only_policies('public.metas_mensais');

-- --------------------------------------------------------------
-- Tabelas de RELATORIOS — mesmo nivel de protecao.
-- relatorios_compartilhados, resumo_anual_externo, resumo_mensal_externo,
-- resumo_por_subcategoria_externo: equipe NAO ve.
-- --------------------------------------------------------------
SELECT public._apply_finance_only_policies('public.relatorios_compartilhados');
SELECT public._apply_finance_only_policies('public.resumo_anual_externo');
SELECT public._apply_finance_only_policies('public.resumo_mensal_externo');
SELECT public._apply_finance_only_policies('public.resumo_por_subcategoria_externo');

-- --------------------------------------------------------------
-- Cleanup do helper auxiliar — nao precisa persistir.
-- --------------------------------------------------------------
DROP FUNCTION public._apply_finance_only_policies(text);

-- =============================================
-- VALIDACAO POS-MIGRATION
--
-- Para confirmar o efeito esperado, rodar:
--
--   SET request.jwt.claims = '{"role":"authenticated","sub":"<USER_UUID>"}';
--
-- com USER_UUID de um advogado:
--   SELECT count(*) FROM acordos_financeiros;  -- deve retornar 0 (RLS bloqueia)
--   SELECT count(*) FROM contact_submissions;  -- deve continuar funcionando
--
-- com USER_UUID de financeiro:
--   SELECT count(*) FROM acordos_financeiros;  -- deve retornar normalmente
--
-- Resetar: RESET request.jwt.claims;
-- =============================================

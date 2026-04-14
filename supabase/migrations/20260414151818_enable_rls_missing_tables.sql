-- =============================================
-- Phase 1.1 — Enable RLS on exposed tables
-- Goal: close anonymous/public-API access to sensitive data
-- without changing behaviour for authenticated users (who
-- currently have broad access across the app).
--
-- Strategy: enable RLS on each table and add a permissive
-- "authenticated" policy only when no policy exists. Tables
-- that already have role-based policies keep them as-is.
-- =============================================

-- Helper: add a permissive "manage all" policy for authenticated
-- users only if the table has zero policies. This guarantees we do
-- not override existing fine-grained role policies (financeiro,
-- transacoes_financeiras, parcelas_financeiras, etc.).
CREATE OR REPLACE FUNCTION public._ensure_authenticated_policy(_qualified_name text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  _reg    regclass;
  _schema text;
  _name   text;
  _count  int;
BEGIN
  _reg := to_regclass(_qualified_name);
  IF _reg IS NULL THEN
    RAISE NOTICE 'Skipping % (table not found)', _qualified_name;
    RETURN;
  END IF;

  SELECT n.nspname, c.relname
    INTO _schema, _name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE c.oid = _reg;

  EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', _schema, _name);

  SELECT count(*) INTO _count
    FROM pg_policies
   WHERE schemaname = _schema AND tablename = _name;

  IF _count = 0 THEN
    EXECUTE format(
      'CREATE POLICY %I ON %I.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      _name || '_authenticated_all', _schema, _name
    );
  END IF;
END;
$$;

-- -----------------------------------------------
-- Financial tables
-- -----------------------------------------------
SELECT public._ensure_authenticated_policy('public.acordos_financeiros');
SELECT public._ensure_authenticated_policy('public.parcelas_financeiras');
SELECT public._ensure_authenticated_policy('public.transacoes_financeiras');
SELECT public._ensure_authenticated_policy('public.historico_pagamentos');
SELECT public._ensure_authenticated_policy('public.categorias_financeiras');
SELECT public._ensure_authenticated_policy('public.subcategorias_financeiras');
SELECT public._ensure_authenticated_policy('public.tipos_transacao');

-- -----------------------------------------------
-- Process-related tables
-- -----------------------------------------------
SELECT public._ensure_authenticated_policy('public.processos_andamentos');
SELECT public._ensure_authenticated_policy('public.processos_documentos');
SELECT public._ensure_authenticated_policy('public.processos_historico');
SELECT public._ensure_authenticated_policy('public.processos_prazos');

-- -----------------------------------------------
-- Communication & integrations
-- -----------------------------------------------
SELECT public._ensure_authenticated_policy('public.whatsapp_config');
SELECT public._ensure_authenticated_policy('public.whatsapp_templates');
SELECT public._ensure_authenticated_policy('public.whatsapp_historico');
SELECT public._ensure_authenticated_policy('public.whatsapp_regras');
SELECT public._ensure_authenticated_policy('public.whatsapp_aprovacao');
SELECT public._ensure_authenticated_policy('public.consultas_config');
SELECT public._ensure_authenticated_policy('public.consultas_realizadas');
SELECT public._ensure_authenticated_policy('public.consultas_auditoria');
SELECT public._ensure_authenticated_policy('public.lead_interacoes');
SELECT public._ensure_authenticated_policy('public.documentos_drive');

-- Drop helper; not needed after migration runs.
DROP FUNCTION public._ensure_authenticated_policy(text);

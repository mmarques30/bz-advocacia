-- =============================================
-- Phase 2.2 — Server-side aggregation for financial KPIs
--
-- DEFENSIVE VERSION: only creates the RPC when the required base
-- tables (parcelas_financeiras, despesas, acordos_financeiros) are
-- present. On the live Lovable Cloud database some projects are on a
-- different schema (`transacoes`, `categorias`...), in which case
-- this migration no-ops.
-- =============================================

DO $$
BEGIN
  IF to_regclass('public.parcelas_financeiras') IS NULL
     OR to_regclass('public.despesas') IS NULL
     OR to_regclass('public.acordos_financeiros') IS NULL THEN
    RAISE NOTICE 'Skipping get_financeiro_kpis (base tables missing)';
    RETURN;
  END IF;

  EXECUTE $sql$
    CREATE OR REPLACE FUNCTION public.get_financeiro_kpis(
      _data_inicio date,
      _data_fim    date
    )
    RETURNS TABLE(
      total_recebido         numeric,
      total_a_receber        numeric,
      total_despesas         numeric,
      total_acordos_ativos   bigint,
      total_parcelas_pagas   bigint,
      total_parcelas_abertas bigint
    )
    LANGUAGE sql
    STABLE
    SECURITY INVOKER
    SET search_path = public
    AS $fn$
      SELECT
        COALESCE((
          SELECT sum(valor_pago) FROM parcelas_financeiras
           WHERE status = 'pago'
             AND data_pagamento BETWEEN _data_inicio AND _data_fim
        ), 0)::numeric AS total_recebido,

        COALESCE((
          SELECT sum(valor) FROM parcelas_financeiras
           WHERE status <> 'pago'
             AND data_vencimento BETWEEN _data_inicio AND _data_fim
        ), 0)::numeric AS total_a_receber,

        COALESCE((
          SELECT sum(valor) FROM despesas
           WHERE data BETWEEN _data_inicio AND _data_fim
        ), 0)::numeric AS total_despesas,

        (SELECT count(*) FROM acordos_financeiros WHERE status = 'ativo')::bigint,

        (SELECT count(*) FROM parcelas_financeiras
          WHERE status = 'pago'
            AND data_pagamento BETWEEN _data_inicio AND _data_fim)::bigint,

        (SELECT count(*) FROM parcelas_financeiras
          WHERE status <> 'pago'
            AND data_vencimento BETWEEN _data_inicio AND _data_fim)::bigint;
    $fn$;
  $sql$;

  EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_financeiro_kpis(date, date) TO authenticated';
END;
$$;

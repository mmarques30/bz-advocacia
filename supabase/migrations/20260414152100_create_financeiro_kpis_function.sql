-- =============================================
-- Phase 2.2 — Server-side aggregation for financial KPIs
-- Goal: give the frontend a fast, cache-friendly way to fetch
-- just the KPI numbers without downloading full tables
-- (today useFinanceiro.ts pulls up to 10k parcels + 10k transactions
-- on every dashboard load).
--
-- This is an ADDITIVE change — the existing hooks continue to work;
-- new code or future refactors can migrate to get_financeiro_kpis()
-- at their own pace.
-- =============================================

CREATE OR REPLACE FUNCTION public.get_financeiro_kpis(
  _data_inicio date,
  _data_fim    date
)
RETURNS TABLE(
  total_recebido       numeric,
  total_a_receber      numeric,
  total_despesas       numeric,
  total_acordos_ativos bigint,
  total_parcelas_pagas bigint,
  total_parcelas_abertas bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
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

    (SELECT count(*) FROM acordos_financeiros WHERE status = 'ativo')::bigint
      AS total_acordos_ativos,

    (SELECT count(*) FROM parcelas_financeiras
      WHERE status = 'pago'
        AND data_pagamento BETWEEN _data_inicio AND _data_fim)::bigint
      AS total_parcelas_pagas,

    (SELECT count(*) FROM parcelas_financeiras
      WHERE status <> 'pago'
        AND data_vencimento BETWEEN _data_inicio AND _data_fim)::bigint
      AS total_parcelas_abertas;
$$;

GRANT EXECUTE ON FUNCTION public.get_financeiro_kpis(date, date) TO authenticated;

COMMENT ON FUNCTION public.get_financeiro_kpis(date, date) IS
'Aggregated financial KPIs for a given period. Returns a single row.
Intended to replace the client-side aggregation in useFinanceiro.ts.';

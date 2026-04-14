-- =============================================
-- Rodada 2 — Escalabilidade: RPCs agregadas server-side
--
-- Problema: diversos hooks (useVisaoGeralKPIs, useReceitasDespesasMensal,
-- useDistribuicaoSocia) baixam a tabela transacoes_financeiras inteira
-- via `.limit(10000)` e fazem agregacao (sum/groupby/filter) em JS. Isso:
--   (a) fura silenciosamente quando a base passar de 10k linhas,
--   (b) consome banda e memoria no cliente,
--   (c) refaz o mesmo trabalho em multiplos hooks.
--
-- Esta migration adiciona 3 RPCs que agregam direto no Postgres. Os
-- hooks passam a chamar RPC (com fallback client-side para manter
-- compat em ambientes sem a migration aplicada).
--
-- Defensive: cada RPC so e criada se as tabelas base existirem.
-- =============================================

-- --------------------------------------------------------------
-- 1. get_visao_geral_kpis(ano)
--    Receitas, despesas PJ, resultado, ticket medio do ano.
-- --------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.transacoes_financeiras') IS NULL THEN
    RAISE NOTICE 'Skipping get_visao_geral_kpis (transacoes_financeiras ausente)';
    RETURN;
  END IF;

  EXECUTE $fn$
    CREATE OR REPLACE FUNCTION public.get_visao_geral_kpis(_ano integer DEFAULT NULL)
    RETURNS TABLE(
      receitas       numeric,
      despesas_pj    numeric,
      resultado      numeric,
      ticket_medio   numeric,
      receitas_count bigint
    )
    LANGUAGE sql
    STABLE
    SECURITY INVOKER
    SET search_path = public
    AS $body$
      WITH base AS (
        SELECT tipo_codigo, categoria_codigo, valor
          FROM transacoes_financeiras
         WHERE (_ano IS NULL OR ano = _ano)
      ),
      ag AS (
        SELECT
          COALESCE(sum(valor) FILTER (WHERE tipo_codigo = 'receita'), 0)::numeric AS rec,
          COALESCE(sum(valor) FILTER (WHERE tipo_codigo = 'despesa' AND categoria_codigo = 'pj'), 0)::numeric AS dpj,
          COALESCE(count(*)  FILTER (WHERE tipo_codigo = 'receita'), 0)::bigint   AS rec_count
        FROM base
      )
      SELECT
        ag.rec                                         AS receitas,
        ag.dpj                                         AS despesas_pj,
        (ag.rec - ag.dpj)                              AS resultado,
        CASE WHEN ag.rec_count > 0 THEN ag.rec / ag.rec_count ELSE 0 END AS ticket_medio,
        ag.rec_count                                   AS receitas_count
      FROM ag;
    $body$
  $fn$;

  EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_visao_geral_kpis(integer) TO authenticated';
END;
$$;

-- --------------------------------------------------------------
-- 2. get_receitas_despesas_mensal(ano)
--    Serie mensal: para cada mes do ano, receitas/despesas/resultado.
--    Retorna 12 linhas mesmo quando um mes nao tem dados (zeros).
-- --------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.transacoes_financeiras') IS NULL THEN
    RAISE NOTICE 'Skipping get_receitas_despesas_mensal (transacoes_financeiras ausente)';
    RETURN;
  END IF;

  EXECUTE $fn$
    CREATE OR REPLACE FUNCTION public.get_receitas_despesas_mensal(_ano integer)
    RETURNS TABLE(
      mes        integer,
      mes_nome   text,
      receitas   numeric,
      despesas   numeric,
      resultado  numeric
    )
    LANGUAGE sql
    STABLE
    SECURITY INVOKER
    SET search_path = public
    AS $body$
      WITH meses AS (
        SELECT generate_series(1, 12) AS mes
      ),
      agregados AS (
        SELECT
          mes,
          COALESCE(sum(valor) FILTER (WHERE tipo_codigo = 'receita'), 0)::numeric AS receitas,
          COALESCE(sum(valor) FILTER (WHERE tipo_codigo = 'despesa' AND categoria_codigo = 'pj'), 0)::numeric AS despesas
          FROM transacoes_financeiras
         WHERE ano = _ano
         GROUP BY mes
      )
      SELECT
        m.mes,
        CASE m.mes
          WHEN 1 THEN 'Jan' WHEN 2 THEN 'Fev' WHEN 3  THEN 'Mar'
          WHEN 4 THEN 'Abr' WHEN 5 THEN 'Mai' WHEN 6  THEN 'Jun'
          WHEN 7 THEN 'Jul' WHEN 8 THEN 'Ago' WHEN 9  THEN 'Set'
          WHEN 10 THEN 'Out' WHEN 11 THEN 'Nov' WHEN 12 THEN 'Dez'
        END AS mes_nome,
        COALESCE(a.receitas, 0)                 AS receitas,
        COALESCE(a.despesas, 0)                 AS despesas,
        (COALESCE(a.receitas, 0) - COALESCE(a.despesas, 0)) AS resultado
      FROM meses m
      LEFT JOIN agregados a ON a.mes = m.mes
      ORDER BY m.mes;
    $body$
  $fn$;

  EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_receitas_despesas_mensal(integer) TO authenticated';
END;
$$;

-- --------------------------------------------------------------
-- 3. get_distribuicao_socia(ano, conta)
--    Para uma conta (juliana/liziane/escritorio/etc.), devolve o total
--    de receitas e despesas PF do ano, mais o liquido.
-- --------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.transacoes_financeiras') IS NULL THEN
    RAISE NOTICE 'Skipping get_distribuicao_socia (transacoes_financeiras ausente)';
    RETURN;
  END IF;

  EXECUTE $fn$
    CREATE OR REPLACE FUNCTION public.get_distribuicao_socia(
      _ano   integer,
      _conta text
    )
    RETURNS TABLE(
      receitas     numeric,
      despesas_pf  numeric,
      liquido      numeric
    )
    LANGUAGE sql
    STABLE
    SECURITY INVOKER
    SET search_path = public
    AS $body$
      WITH _filtered AS (
        SELECT tipo_codigo, valor
          FROM transacoes_financeiras
         WHERE (_ano IS NULL OR ano = _ano)
           AND lower(coalesce(conta, '')) = lower(
             -- Legacy: o frontend usa "eliziane" mas o banco tem "liziane"
             CASE WHEN lower(_conta) = 'eliziane' THEN 'liziane' ELSE _conta END
           )
      )
      SELECT
        COALESCE(sum(valor) FILTER (WHERE tipo_codigo = 'receita'), 0)::numeric AS receitas,
        COALESCE(sum(valor) FILTER (WHERE tipo_codigo = 'despesa'), 0)::numeric AS despesas_pf,
        (COALESCE(sum(valor) FILTER (WHERE tipo_codigo = 'receita'), 0)
         - COALESCE(sum(valor) FILTER (WHERE tipo_codigo = 'despesa'), 0))::numeric AS liquido
      FROM _filtered;
    $body$
  $fn$;

  EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_distribuicao_socia(integer, text) TO authenticated';
END;
$$;

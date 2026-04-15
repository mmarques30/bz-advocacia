-- =============================================
-- Rodada 5 — Eliminar .limit(10000) restantes via RPCs server-side
--
-- Os hooks useKPIsFinanceiros e useProjetadoVsRealizado ainda baixam
-- as tabelas inteiras de parcelas_financeiras e transacoes_financeiras
-- (4 e 24 queries respectivamente por refresh do dashboard) e fazem
-- sum/groupby em JS. Nesta rodada extendemos a RPC existente
-- get_financeiro_kpis e adicionamos uma nova get_projetado_vs_realizado.
--
-- Defensive: blocos com to_regclass guards.
-- =============================================

-- --------------------------------------------------------------
-- 1. Extensao de get_financeiro_kpis
--    Antes: total_recebido, total_a_receber, total_despesas,
--           total_acordos_ativos, total_parcelas_pagas, total_parcelas_abertas
--    Agora adiciona: valor_atrasado, taxa_inadimplencia, ticket_medio,
--                    projecao, recebido_mes (alias), receita_mes
--    Filtros opcionais: p_status, p_tipo_servico, p_conta para acordos.
--
--    Substituicao retroativa: recriamos a funcao com nova assinatura
--    (mesmo nome). Como ja era SECURITY INVOKER e usavamos parametros
--    nomeados nos chamadores, a transicao e segura.
-- --------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.parcelas_financeiras') IS NULL
     OR to_regclass('public.acordos_financeiros') IS NULL
     OR to_regclass('public.transacoes_financeiras') IS NULL THEN
    RAISE NOTICE 'Skipping get_financeiro_kpis extension (tabelas ausentes)';
    RETURN;
  END IF;

  -- Drop & re-create para mudar o RETURNS TABLE shape com seguranca.
  EXECUTE 'DROP FUNCTION IF EXISTS public.get_financeiro_kpis(date, date)';
  EXECUTE 'DROP FUNCTION IF EXISTS public.get_financeiro_kpis(date, date, text, text, text)';

  EXECUTE $fn$
    CREATE FUNCTION public.get_financeiro_kpis(
      _data_inicio    date    DEFAULT NULL,
      _data_fim       date    DEFAULT NULL,
      _status         text    DEFAULT NULL,
      _tipo_servico   text    DEFAULT NULL,
      _conta          text    DEFAULT NULL
    )
    RETURNS TABLE(
      receita_mes              numeric,
      recebido_mes             numeric,
      a_receber_mes            numeric,
      valor_atrasado           numeric,
      taxa_inadimplencia       numeric,
      ticket_medio             numeric,
      projecao                 numeric,
      total_acordos_ativos     bigint,
      total_parcelas_pagas     bigint,
      total_parcelas_abertas   bigint,
      total_despesas           numeric
    )
    LANGUAGE sql
    STABLE
    SECURITY INVOKER
    SET search_path = public
    AS $body$
      WITH _params AS (
        -- Hoje serve de baseline para "atrasado" (data_vencimento < hoje).
        SELECT CURRENT_DATE AS hoje
      ),
      _parcelas AS (
        SELECT
          p.status,
          p.valor,
          p.valor_pago,
          p.data_pagamento,
          p.data_vencimento
        FROM public.parcelas_financeiras p
      ),
      _recebimentos_periodo AS (
        SELECT COALESCE(sum(valor_pago), 0)::numeric AS total
        FROM _parcelas
        WHERE status = 'pago'
          AND data_pagamento IS NOT NULL
          AND (_data_inicio IS NULL OR data_pagamento >= _data_inicio)
          AND (_data_fim    IS NULL OR data_pagamento <= _data_fim)
      ),
      _receitas_avulsas AS (
        SELECT COALESCE(sum(valor), 0)::numeric AS total
        FROM public.transacoes_financeiras
        WHERE tipo_codigo IN ('receita', 'REC')
          AND data_transacao IS NOT NULL
          AND (_data_inicio IS NULL OR data_transacao::date >= _data_inicio)
          AND (_data_fim    IS NULL OR data_transacao::date <= _data_fim)
      ),
      _a_receber AS (
        SELECT COALESCE(sum(valor), 0)::numeric AS total
        FROM _parcelas
        WHERE status = 'pendente'
          AND (_data_inicio IS NULL OR data_vencimento >= _data_inicio)
          AND (_data_fim    IS NULL OR data_vencimento <= _data_fim)
      ),
      _atrasos AS (
        SELECT
          COALESCE(sum(valor) FILTER (WHERE status <> 'pago' AND data_vencimento < (SELECT hoje FROM _params)), 0)::numeric AS valor_atrasado,
          count(*) FILTER (WHERE status <> 'pago' AND data_vencimento < (SELECT hoje FROM _params))::bigint AS qtd_atrasadas,
          count(*)::bigint AS qtd_total
        FROM _parcelas
      ),
      _projecao AS (
        SELECT COALESCE(sum(valor), 0)::numeric AS total
        FROM _parcelas
        WHERE status = 'pendente'
      ),
      _despesas AS (
        SELECT COALESCE(sum(valor), 0)::numeric AS total
        FROM public.transacoes_financeiras
        WHERE tipo_codigo = 'despesa'
          AND (_data_inicio IS NULL OR data_transacao::date >= _data_inicio)
          AND (_data_fim    IS NULL OR data_transacao::date <= _data_fim)
      ),
      _acordos_filtrados AS (
        SELECT a.valor_total, a.status
        FROM public.acordos_financeiros a
        WHERE (_status       IS NULL OR _status = 'todos'       OR a.status       = _status)
          AND (_tipo_servico IS NULL OR _tipo_servico = 'todos' OR a.tipo_servico = _tipo_servico)
          AND (_conta        IS NULL OR _conta = 'todos'        OR a.conta        = _conta)
      ),
      _ticket AS (
        SELECT
          CASE WHEN count(*) > 0
               THEN COALESCE(sum(valor_total), 0) / count(*)
               ELSE 0
          END::numeric AS ticket_medio,
          count(*) FILTER (WHERE status = 'ativo')::bigint AS ativos
        FROM _acordos_filtrados
      ),
      _parcelas_count AS (
        SELECT
          count(*) FILTER (WHERE status = 'pago'
                            AND (_data_inicio IS NULL OR data_pagamento >= _data_inicio)
                            AND (_data_fim    IS NULL OR data_pagamento <= _data_fim))::bigint AS pagas,
          count(*) FILTER (WHERE status <> 'pago'
                            AND (_data_inicio IS NULL OR data_vencimento >= _data_inicio)
                            AND (_data_fim    IS NULL OR data_vencimento <= _data_fim))::bigint AS abertas
        FROM _parcelas
      )
      SELECT
        ((SELECT total FROM _recebimentos_periodo) + (SELECT total FROM _receitas_avulsas))::numeric AS receita_mes,
        ((SELECT total FROM _recebimentos_periodo) + (SELECT total FROM _receitas_avulsas))::numeric AS recebido_mes,
        (SELECT total FROM _a_receber)                                                                AS a_receber_mes,
        (SELECT valor_atrasado FROM _atrasos)                                                         AS valor_atrasado,
        CASE WHEN (SELECT qtd_total FROM _atrasos) > 0
             THEN ((SELECT qtd_atrasadas FROM _atrasos)::numeric / (SELECT qtd_total FROM _atrasos)::numeric) * 100
             ELSE 0
        END                                                                                            AS taxa_inadimplencia,
        (SELECT ticket_medio FROM _ticket)                                                            AS ticket_medio,
        (SELECT total FROM _projecao)                                                                  AS projecao,
        (SELECT ativos FROM _ticket)                                                                  AS total_acordos_ativos,
        (SELECT pagas FROM _parcelas_count)                                                           AS total_parcelas_pagas,
        (SELECT abertas FROM _parcelas_count)                                                         AS total_parcelas_abertas,
        (SELECT total FROM _despesas)                                                                  AS total_despesas;
    $body$
  $fn$;

  EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_financeiro_kpis(date, date, text, text, text) TO authenticated';
END;
$$;

-- --------------------------------------------------------------
-- 2. Nova RPC get_projetado_vs_realizado(_meses)
--    Substitui o for-loop de 12 iteracoes (cada uma com 2-3 queries)
--    em useProjetadoVsRealizado. Faz um GROUP BY mes/ano de uma vez
--    e LEFT JOIN com metas_mensais (se existir) para incluir meses
--    sem dados. Se a tabela de metas nao existir, projetado vem 0.
-- --------------------------------------------------------------
DO $$
DECLARE
  _has_metas boolean := to_regclass('public.metas_mensais') IS NOT NULL;
BEGIN
  IF to_regclass('public.transacoes_financeiras') IS NULL
     OR to_regclass('public.parcelas_financeiras') IS NULL THEN
    RAISE NOTICE 'Skipping get_projetado_vs_realizado (tabelas base ausentes)';
    RETURN;
  END IF;

  IF _has_metas THEN
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.get_projetado_vs_realizado(_meses integer DEFAULT 12)
      RETURNS TABLE(
        mes_label  text,
        mes        integer,
        ano        integer,
        realizado  numeric,
        projetado  numeric
      )
      LANGUAGE sql
      STABLE
      SECURITY INVOKER
      SET search_path = public
      AS $body$
        WITH _hoje AS (SELECT CURRENT_DATE AS d),
        _meses_serie AS (
          SELECT
            (date_trunc('month', (SELECT d FROM _hoje)) - (i || ' months')::interval)::date AS inicio_mes
          FROM generate_series(0, GREATEST(_meses, 1) - 1) AS i
        ),
        _periodos AS (
          SELECT
            inicio_mes,
            EXTRACT(MONTH FROM inicio_mes)::int AS mes,
            EXTRACT(YEAR  FROM inicio_mes)::int AS ano
          FROM _meses_serie
        ),
        _receitas_avulsas AS (
          SELECT
            EXTRACT(MONTH FROM data_transacao::date)::int AS mes,
            EXTRACT(YEAR  FROM data_transacao::date)::int AS ano,
            sum(valor)::numeric AS total
          FROM public.transacoes_financeiras
          WHERE tipo_codigo IN ('receita', 'REC')
            AND data_transacao IS NOT NULL
          GROUP BY 1, 2
        ),
        _recebimentos_parcelas AS (
          SELECT
            EXTRACT(MONTH FROM data_pagamento)::int AS mes,
            EXTRACT(YEAR  FROM data_pagamento)::int AS ano,
            sum(valor_pago)::numeric AS total
          FROM public.parcelas_financeiras
          WHERE status = 'pago' AND data_pagamento IS NOT NULL
          GROUP BY 1, 2
        )
        SELECT
          to_char(p.inicio_mes, 'TMMon/YY') AS mes_label,
          p.mes,
          p.ano,
          (COALESCE(ra.total, 0) + COALESCE(rp.total, 0))::numeric AS realizado,
          COALESCE(m.valor, 0)::numeric                            AS projetado
        FROM _periodos p
        LEFT JOIN _receitas_avulsas ra      ON ra.mes = p.mes AND ra.ano = p.ano
        LEFT JOIN _recebimentos_parcelas rp ON rp.mes = p.mes AND rp.ano = p.ano
        LEFT JOIN public.metas_mensais m    ON m.mes  = p.mes AND m.ano  = p.ano
        ORDER BY p.ano ASC, p.mes ASC;
      $body$
    $fn$;
  ELSE
    -- Versao sem metas_mensais: projetado sempre 0.
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.get_projetado_vs_realizado(_meses integer DEFAULT 12)
      RETURNS TABLE(
        mes_label  text,
        mes        integer,
        ano        integer,
        realizado  numeric,
        projetado  numeric
      )
      LANGUAGE sql
      STABLE
      SECURITY INVOKER
      SET search_path = public
      AS $body$
        WITH _hoje AS (SELECT CURRENT_DATE AS d),
        _meses_serie AS (
          SELECT
            (date_trunc('month', (SELECT d FROM _hoje)) - (i || ' months')::interval)::date AS inicio_mes
          FROM generate_series(0, GREATEST(_meses, 1) - 1) AS i
        ),
        _periodos AS (
          SELECT
            inicio_mes,
            EXTRACT(MONTH FROM inicio_mes)::int AS mes,
            EXTRACT(YEAR  FROM inicio_mes)::int AS ano
          FROM _meses_serie
        ),
        _receitas_avulsas AS (
          SELECT
            EXTRACT(MONTH FROM data_transacao::date)::int AS mes,
            EXTRACT(YEAR  FROM data_transacao::date)::int AS ano,
            sum(valor)::numeric AS total
          FROM public.transacoes_financeiras
          WHERE tipo_codigo IN ('receita', 'REC')
            AND data_transacao IS NOT NULL
          GROUP BY 1, 2
        ),
        _recebimentos_parcelas AS (
          SELECT
            EXTRACT(MONTH FROM data_pagamento)::int AS mes,
            EXTRACT(YEAR  FROM data_pagamento)::int AS ano,
            sum(valor_pago)::numeric AS total
          FROM public.parcelas_financeiras
          WHERE status = 'pago' AND data_pagamento IS NOT NULL
          GROUP BY 1, 2
        )
        SELECT
          to_char(p.inicio_mes, 'TMMon/YY') AS mes_label,
          p.mes,
          p.ano,
          (COALESCE(ra.total, 0) + COALESCE(rp.total, 0))::numeric AS realizado,
          0::numeric                                                AS projetado
        FROM _periodos p
        LEFT JOIN _receitas_avulsas ra      ON ra.mes = p.mes AND ra.ano = p.ano
        LEFT JOIN _recebimentos_parcelas rp ON rp.mes = p.mes AND rp.ano = p.ano
        ORDER BY p.ano ASC, p.mes ASC;
      $body$
    $fn$;
  END IF;

  EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_projetado_vs_realizado(integer) TO authenticated';
END;
$$;

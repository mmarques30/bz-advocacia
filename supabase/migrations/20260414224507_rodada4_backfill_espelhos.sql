-- =============================================
-- Rodada 4 — Consolidacao: origens rastreaveis + backfill
--
-- Contexto: a Rodada 1 (PR #13) criou 2 triggers que espelham eventos
-- para transacoes_financeiras — parcela paga -> receita; despesa nova
-- -> despesa. Mas as linhas criadas ANTES desses triggers nao tem
-- espelho. Ate agora o useDespesas compensa com UNION das 2 tabelas,
-- mas a UNION mantem o .limit(10000) nas 2 queries (debito da Rodada 2).
--
-- Esta migration fecha o loop em 3 passos:
--
-- 1. Adiciona colunas de origem (rastreabilidade):
--      transacoes_financeiras.origem_despesa_id    -> uuid (FK despesas.id)
--      transacoes_financeiras.origem_parcela_id    -> uuid (FK parcelas.id)
--    com unique partial index — garantem idempotencia do espelho.
--
-- 2. Atualiza os triggers do PR #13 para preencher as novas colunas.
--
-- 3. Backfill: para cada row em despesas / parcelas pagas que ainda
--    nao tem espelho, cria o espelho correspondente. Idempotente via
--    NOT EXISTS + unique index — rodar duas vezes nao duplica.
--
-- Depois desta migration, useDespesas pode voltar a ler so de
-- transacoes_financeiras (proximo passo no frontend).
--
-- Defensive: to_regclass guards em tudo.
-- =============================================

-- --------------------------------------------------------------
-- 1. Colunas de origem em transacoes_financeiras
-- --------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.transacoes_financeiras') IS NULL THEN
    RAISE NOTICE 'Skipping origem columns (transacoes_financeiras ausente)';
    RETURN;
  END IF;

  -- origem_despesa_id: FK para despesas.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema='public'
       AND table_name='transacoes_financeiras'
       AND column_name='origem_despesa_id'
  ) THEN
    IF to_regclass('public.despesas') IS NOT NULL THEN
      ALTER TABLE public.transacoes_financeiras
        ADD COLUMN origem_despesa_id uuid REFERENCES public.despesas(id) ON DELETE SET NULL;
    ELSE
      ALTER TABLE public.transacoes_financeiras
        ADD COLUMN origem_despesa_id uuid;
    END IF;

    COMMENT ON COLUMN public.transacoes_financeiras.origem_despesa_id IS
      'Quando esta linha e um espelho de uma despesa (trigger trg_despesas_espelho_transacoes), aponta para a despesa original. NULL para transacoes criadas manualmente ou via import.';
  END IF;

  -- origem_parcela_id: FK para parcelas_financeiras.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema='public'
       AND table_name='transacoes_financeiras'
       AND column_name='origem_parcela_id'
  ) THEN
    IF to_regclass('public.parcelas_financeiras') IS NOT NULL THEN
      ALTER TABLE public.transacoes_financeiras
        ADD COLUMN origem_parcela_id uuid REFERENCES public.parcelas_financeiras(id) ON DELETE SET NULL;
    ELSE
      ALTER TABLE public.transacoes_financeiras
        ADD COLUMN origem_parcela_id uuid;
    END IF;

    COMMENT ON COLUMN public.transacoes_financeiras.origem_parcela_id IS
      'Quando esta linha e um espelho de uma parcela paga (trigger trg_parcela_paga_gera_transacao), aponta para a parcela original. NULL para receitas criadas manualmente ou via import.';
  END IF;

  -- Unique partial indexes garantem que cada despesa/parcela tem no
  -- maximo 1 espelho em transacoes_financeiras — permitindo INSERT
  -- repetido ser no-op na pratica (ON CONFLICT DO NOTHING).
  EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_transacoes_origem_despesa_unq
             ON public.transacoes_financeiras(origem_despesa_id)
             WHERE origem_despesa_id IS NOT NULL';

  EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_transacoes_origem_parcela_unq
             ON public.transacoes_financeiras(origem_parcela_id)
             WHERE origem_parcela_id IS NOT NULL';
END;
$$;

-- --------------------------------------------------------------
-- 2. Atualiza os triggers do PR #13 para preencher origem_*
-- --------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.despesas') IS NULL
     OR to_regclass('public.transacoes_financeiras') IS NULL THEN
    RAISE NOTICE 'Skipping trigger update (tabelas ausentes)';
    RETURN;
  END IF;

  -- Redefine despesa_espelha_transacao para preencher origem_despesa_id
  -- e usar ON CONFLICT DO NOTHING — torna INSERT-duplicado inofensivo.
  EXECUTE $fn$
    CREATE OR REPLACE FUNCTION public.despesa_espelha_transacao()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $body$
    DECLARE
      _data_ref date := COALESCE(NEW.data, CURRENT_DATE);
      _mes int := EXTRACT(MONTH FROM _data_ref);
      _ano int := EXTRACT(YEAR FROM _data_ref);
    BEGIN
      INSERT INTO public.transacoes_financeiras (
        mes, ano, mes_nome, tipo_codigo, categoria_codigo, subcategoria_codigo,
        descricao, data_transacao, valor, conta, origem_despesa_id
      )
      VALUES (
        _mes, _ano,
        CASE _mes
          WHEN 1 THEN 'Janeiro'  WHEN 2 THEN 'Fevereiro' WHEN 3  THEN 'Março'
          WHEN 4 THEN 'Abril'    WHEN 5 THEN 'Maio'      WHEN 6  THEN 'Junho'
          WHEN 7 THEN 'Julho'    WHEN 8 THEN 'Agosto'    WHEN 9  THEN 'Setembro'
          WHEN 10 THEN 'Outubro' WHEN 11 THEN 'Novembro' WHEN 12 THEN 'Dezembro'
        END,
        'despesa',
        'pj',
        split_part(COALESCE(NEW.categoria, 'outros'), '_', 1),
        COALESCE(NEW.descricao, 'Despesa'),
        _data_ref::text,
        COALESCE(NEW.valor, 0),
        lower(COALESCE(NEW.conta, 'escritorio')),
        NEW.id
      )
      ON CONFLICT (origem_despesa_id) WHERE origem_despesa_id IS NOT NULL DO NOTHING;

      RETURN NEW;
    END;
    $body$
  $fn$;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.parcelas_financeiras') IS NULL
     OR to_regclass('public.transacoes_financeiras') IS NULL
     OR to_regclass('public.acordos_financeiros') IS NULL THEN
    RAISE NOTICE 'Skipping parcela trigger update (tabelas ausentes)';
    RETURN;
  END IF;

  -- Redefine parcela_paga_gera_transacao para preencher origem_parcela_id
  -- e usar ON CONFLICT DO NOTHING.
  EXECUTE $fn$
    CREATE OR REPLACE FUNCTION public.parcela_paga_gera_transacao()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $body$
    DECLARE
      _acordo   record;
      _data_ref date;
      _mes      int;
      _ano      int;
    BEGIN
      IF NEW.status IS DISTINCT FROM 'pago' THEN
        RETURN NEW;
      END IF;
      IF TG_OP = 'UPDATE' AND OLD.status = 'pago' THEN
        RETURN NEW;
      END IF;

      SELECT tipo_servico, conta, cliente_id
        INTO _acordo
        FROM public.acordos_financeiros
       WHERE id = NEW.acordo_id;

      _data_ref := COALESCE(NEW.data_pagamento, NEW.data_vencimento, CURRENT_DATE);
      _mes := EXTRACT(MONTH FROM _data_ref);
      _ano := EXTRACT(YEAR FROM _data_ref);

      INSERT INTO public.transacoes_financeiras (
        mes, ano, mes_nome, tipo_codigo, categoria_codigo, subcategoria_codigo,
        descricao, data_transacao, valor, conta, origem_parcela_id
      )
      VALUES (
        _mes, _ano,
        CASE _mes
          WHEN 1 THEN 'Janeiro'  WHEN 2 THEN 'Fevereiro' WHEN 3  THEN 'Março'
          WHEN 4 THEN 'Abril'    WHEN 5 THEN 'Maio'      WHEN 6  THEN 'Junho'
          WHEN 7 THEN 'Julho'    WHEN 8 THEN 'Agosto'    WHEN 9  THEN 'Setembro'
          WHEN 10 THEN 'Outubro' WHEN 11 THEN 'Novembro' WHEN 12 THEN 'Dezembro'
        END,
        'receita',
        'pf',
        lower(COALESCE(_acordo.conta, 'escritorio')),
        COALESCE(_acordo.tipo_servico, 'Pagamento de parcela') ||
          ' — parcela ' || NEW.numero_parcela,
        _data_ref::text,
        COALESCE(NEW.valor_pago, NEW.valor),
        lower(COALESCE(_acordo.conta, 'escritorio')),
        NEW.id
      )
      ON CONFLICT (origem_parcela_id) WHERE origem_parcela_id IS NOT NULL DO NOTHING;

      RETURN NEW;
    END;
    $body$
  $fn$;
END;
$$;

-- --------------------------------------------------------------
-- 3. Backfill das rows que existem antes desta migration
-- --------------------------------------------------------------
DO $$
DECLARE
  _inseridas int;
BEGIN
  IF to_regclass('public.despesas') IS NULL
     OR to_regclass('public.transacoes_financeiras') IS NULL THEN
    RAISE NOTICE 'Skipping backfill despesas (tabelas ausentes)';
    RETURN;
  END IF;

  INSERT INTO public.transacoes_financeiras (
    mes, ano, mes_nome, tipo_codigo, categoria_codigo, subcategoria_codigo,
    descricao, data_transacao, valor, conta, origem_despesa_id
  )
  SELECT
    EXTRACT(MONTH FROM COALESCE(d.data, CURRENT_DATE))::int,
    EXTRACT(YEAR  FROM COALESCE(d.data, CURRENT_DATE))::int,
    CASE EXTRACT(MONTH FROM COALESCE(d.data, CURRENT_DATE))::int
      WHEN 1 THEN 'Janeiro'  WHEN 2 THEN 'Fevereiro' WHEN 3  THEN 'Março'
      WHEN 4 THEN 'Abril'    WHEN 5 THEN 'Maio'      WHEN 6  THEN 'Junho'
      WHEN 7 THEN 'Julho'    WHEN 8 THEN 'Agosto'    WHEN 9  THEN 'Setembro'
      WHEN 10 THEN 'Outubro' WHEN 11 THEN 'Novembro' WHEN 12 THEN 'Dezembro'
    END,
    'despesa',
    'pj',
    split_part(COALESCE(d.categoria, 'outros'), '_', 1),
    COALESCE(d.descricao, 'Despesa'),
    COALESCE(d.data, CURRENT_DATE)::text,
    COALESCE(d.valor, 0),
    lower(COALESCE(d.conta, 'escritorio')),
    d.id
  FROM public.despesas d
  WHERE NOT EXISTS (
    SELECT 1 FROM public.transacoes_financeiras t
     WHERE t.origem_despesa_id = d.id
  );

  GET DIAGNOSTICS _inseridas = ROW_COUNT;
  RAISE NOTICE 'Backfill despesas: % espelhos criados', _inseridas;
END;
$$;

DO $$
DECLARE
  _inseridas int;
BEGIN
  IF to_regclass('public.parcelas_financeiras') IS NULL
     OR to_regclass('public.transacoes_financeiras') IS NULL
     OR to_regclass('public.acordos_financeiros') IS NULL THEN
    RAISE NOTICE 'Skipping backfill parcelas (tabelas ausentes)';
    RETURN;
  END IF;

  INSERT INTO public.transacoes_financeiras (
    mes, ano, mes_nome, tipo_codigo, categoria_codigo, subcategoria_codigo,
    descricao, data_transacao, valor, conta, origem_parcela_id
  )
  SELECT
    EXTRACT(MONTH FROM COALESCE(p.data_pagamento, p.data_vencimento, CURRENT_DATE))::int,
    EXTRACT(YEAR  FROM COALESCE(p.data_pagamento, p.data_vencimento, CURRENT_DATE))::int,
    CASE EXTRACT(MONTH FROM COALESCE(p.data_pagamento, p.data_vencimento, CURRENT_DATE))::int
      WHEN 1 THEN 'Janeiro'  WHEN 2 THEN 'Fevereiro' WHEN 3  THEN 'Março'
      WHEN 4 THEN 'Abril'    WHEN 5 THEN 'Maio'      WHEN 6  THEN 'Junho'
      WHEN 7 THEN 'Julho'    WHEN 8 THEN 'Agosto'    WHEN 9  THEN 'Setembro'
      WHEN 10 THEN 'Outubro' WHEN 11 THEN 'Novembro' WHEN 12 THEN 'Dezembro'
    END,
    'receita',
    'pf',
    lower(COALESCE(a.conta, 'escritorio')),
    COALESCE(a.tipo_servico, 'Pagamento de parcela') || ' — parcela ' || p.numero_parcela,
    COALESCE(p.data_pagamento, p.data_vencimento, CURRENT_DATE)::text,
    COALESCE(p.valor_pago, p.valor, 0),
    lower(COALESCE(a.conta, 'escritorio')),
    p.id
  FROM public.parcelas_financeiras p
  JOIN public.acordos_financeiros a ON a.id = p.acordo_id
  WHERE p.status = 'pago'
    AND NOT EXISTS (
      SELECT 1 FROM public.transacoes_financeiras t
       WHERE t.origem_parcela_id = p.id
    );

  GET DIAGNOSTICS _inseridas = ROW_COUNT;
  RAISE NOTICE 'Backfill parcelas pagas: % espelhos criados', _inseridas;
END;
$$;

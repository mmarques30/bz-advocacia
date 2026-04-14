-- =============================================
-- Rodada 1 — Integridade atomica e espelhamento de auditoria
--
-- Entrega 4 coisas:
-- 1. RPC create_despesa_atomica(base, n, intervalo): cria 1 a N despesas
--    numa unica transacao. Substitui o for-loop no NewDespesaDialog.
-- 2. RPC create_acordo_atomico(acordo, parcelas): cria acordo + parcelas
--    numa unica transacao. Substitui as 2 chamadas separadas em useCreateAcordo.
-- 3. Trigger trg_parcela_paga_gera_transacao: ao mudar parcela.status de
--    != 'pago' para 'pago', insere receita em transacoes_financeiras.
--    Compensa a lacuna de auditoria (hoje KPIs somam de parcelas mas
--    auditoria via transacoes_financeiras fica incompleta).
-- 4. Trigger trg_despesas_espelho_transacoes: ao inserir em `despesas`
--    (form novo), espelha em transacoes_financeiras com tipo_codigo='despesa'.
--    Unifica a fonte de auditoria sem quebrar o shape rico de `despesas`.
--
-- Toda a migration e defensive via to_regclass(): se alguma tabela ou
-- coluna nao existir (ambiente staging com schema curto), o bloco
-- correspondente e pulado com NOTICE, sem falhar a migration.
-- =============================================

-- --------------------------------------------------------------
-- 1. RPC create_despesa_atomica
-- --------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.despesas') IS NULL THEN
    RAISE NOTICE 'Skipping create_despesa_atomica (tabela despesas ausente)';
    RETURN;
  END IF;

  EXECUTE $fn$
    CREATE OR REPLACE FUNCTION public.create_despesa_atomica(
      p_descricao         text,
      p_valor_total       numeric,
      p_data_primeira     date,
      p_categoria         text,
      p_conta             text,
      p_numero_parcelas   integer DEFAULT 1,
      p_intervalo_dias    integer DEFAULT 30,
      p_processo_id       uuid    DEFAULT NULL,
      p_forma_pagamento   text    DEFAULT NULL,
      p_status_primeira   text    DEFAULT 'pendente',
      p_observacoes       text    DEFAULT NULL
    )
    RETURNS uuid[]
    LANGUAGE plpgsql
    SECURITY INVOKER
    SET search_path = public
    AS $body$
    DECLARE
      _n                  int := GREATEST(1, p_numero_parcelas);
      _valor_base         numeric := round((p_valor_total / _n) * 100) / 100;
      _soma_base          numeric := _valor_base * (_n - 1);
      _valor_ultima       numeric := round((p_valor_total - _soma_base) * 100) / 100;
      _ids                uuid[] := ARRAY[]::uuid[];
      _novo_id            uuid;
      _i                  int;
      _data_parcela       date;
      _valor_parcela      numeric;
      _descricao_parcela  text;
      _status_parcela     text;
    BEGIN
      FOR _i IN 1.._n LOOP
        _data_parcela := p_data_primeira + ((_i - 1) * p_intervalo_dias);
        _valor_parcela := CASE WHEN _i = _n THEN _valor_ultima ELSE _valor_base END;
        _descricao_parcela := CASE
          WHEN _n > 1 THEN p_descricao || ' (' || _i || '/' || _n || ')'
          ELSE p_descricao
        END;
        _status_parcela := CASE WHEN _i = 1 THEN p_status_primeira ELSE 'pendente' END;

        INSERT INTO public.despesas (
          descricao, valor, data, categoria, conta, processo_id,
          forma_pagamento, status, observacoes, anexo_url
        )
        VALUES (
          _descricao_parcela, _valor_parcela, _data_parcela, p_categoria, p_conta,
          p_processo_id, p_forma_pagamento, _status_parcela, p_observacoes, NULL
        )
        RETURNING id INTO _novo_id;

        _ids := array_append(_ids, _novo_id);
      END LOOP;

      RETURN _ids;
    END;
    $body$
  $fn$;

  EXECUTE 'GRANT EXECUTE ON FUNCTION public.create_despesa_atomica(text, numeric, date, text, text, integer, integer, uuid, text, text, text) TO authenticated';
END;
$$;

-- --------------------------------------------------------------
-- 2. RPC create_acordo_atomico
-- --------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.acordos_financeiros') IS NULL
     OR to_regclass('public.parcelas_financeiras') IS NULL THEN
    RAISE NOTICE 'Skipping create_acordo_atomico (tabelas acordos/parcelas ausentes)';
    RETURN;
  END IF;

  EXECUTE $fn$
    CREATE OR REPLACE FUNCTION public.create_acordo_atomico(
      p_acordo   jsonb,
      p_parcelas jsonb
    )
    RETURNS uuid
    LANGUAGE plpgsql
    SECURITY INVOKER
    SET search_path = public
    AS $body$
    DECLARE
      _novo_acordo_id uuid;
      _parcela        jsonb;
    BEGIN
      -- Insere o acordo a partir do objeto jsonb. Campos ausentes ficam NULL/default.
      INSERT INTO public.acordos_financeiros (
        cliente_id, processo_id, tipo_servico, valor_total, forma_pagamento,
        numero_parcelas, data_primeiro_vencimento, observacoes, conta, status
      )
      VALUES (
        (p_acordo->>'cliente_id')::uuid,
        NULLIF(p_acordo->>'processo_id', '')::uuid,
        p_acordo->>'tipo_servico',
        (p_acordo->>'valor_total')::numeric,
        p_acordo->>'forma_pagamento',
        (p_acordo->>'numero_parcelas')::integer,
        (p_acordo->>'data_primeiro_vencimento')::date,
        p_acordo->>'observacoes',
        p_acordo->>'conta',
        COALESCE(p_acordo->>'status', 'ativo')
      )
      RETURNING id INTO _novo_acordo_id;

      -- Insere cada parcela associada ao acordo criado.
      FOR _parcela IN SELECT * FROM jsonb_array_elements(p_parcelas)
      LOOP
        INSERT INTO public.parcelas_financeiras (
          acordo_id, numero_parcela, valor, data_vencimento, data_pagamento,
          valor_pago, forma_pagamento_recebido, status
        )
        VALUES (
          _novo_acordo_id,
          (_parcela->>'numero_parcela')::integer,
          (_parcela->>'valor')::numeric,
          (_parcela->>'data_vencimento')::date,
          NULLIF(_parcela->>'data_pagamento', '')::date,
          NULLIF(_parcela->>'valor_pago', '')::numeric,
          _parcela->>'forma_pagamento_recebido',
          COALESCE(_parcela->>'status', 'pendente')
        );
      END LOOP;

      RETURN _novo_acordo_id;
    END;
    $body$
  $fn$;

  EXECUTE 'GRANT EXECUTE ON FUNCTION public.create_acordo_atomico(jsonb, jsonb) TO authenticated';
END;
$$;

-- --------------------------------------------------------------
-- 3. Trigger trg_parcela_paga_gera_transacao
--    Quando parcela.status transita para 'pago', insere receita em
--    transacoes_financeiras com metadata do acordo/cliente.
-- --------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.parcelas_financeiras') IS NULL
     OR to_regclass('public.transacoes_financeiras') IS NULL
     OR to_regclass('public.acordos_financeiros') IS NULL THEN
    RAISE NOTICE 'Skipping trg_parcela_paga_gera_transacao (tabelas requeridas ausentes)';
    RETURN;
  END IF;

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
      -- So age na transicao "virou pago" (entrada nova OU mudanca).
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
        descricao, data_transacao, valor, conta
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
        lower(COALESCE(_acordo.conta, 'escritorio'))
      );

      RETURN NEW;
    END;
    $body$
  $fn$;

  EXECUTE 'DROP TRIGGER IF EXISTS trg_parcela_paga_gera_transacao ON public.parcelas_financeiras';
  EXECUTE 'CREATE TRIGGER trg_parcela_paga_gera_transacao
             AFTER INSERT OR UPDATE OF status ON public.parcelas_financeiras
             FOR EACH ROW EXECUTE FUNCTION public.parcela_paga_gera_transacao()';
END;
$$;

-- --------------------------------------------------------------
-- 4. Trigger trg_despesas_espelho_transacoes
--    Espelha INSERTs em `despesas` como row equivalente em
--    transacoes_financeiras (tipo_codigo='despesa'). Garante que a
--    fonte de auditoria (transacoes_financeiras) fica completa sem
--    obrigar a UI a ler das duas tabelas.
-- --------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.despesas') IS NULL
     OR to_regclass('public.transacoes_financeiras') IS NULL THEN
    RAISE NOTICE 'Skipping trg_despesas_espelho_transacoes (tabelas requeridas ausentes)';
    RETURN;
  END IF;

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
        descricao, data_transacao, valor, conta
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
        -- Preserva a categoria legada: "aluguel_condominio" vira "aluguel",
        -- casando com os codigos curtos usados no import CSV.
        split_part(COALESCE(NEW.categoria, 'outros'), '_', 1),
        COALESCE(NEW.descricao, 'Despesa'),
        _data_ref::text,
        COALESCE(NEW.valor, 0),
        lower(COALESCE(NEW.conta, 'escritorio'))
      );

      RETURN NEW;
    END;
    $body$
  $fn$;

  EXECUTE 'DROP TRIGGER IF EXISTS trg_despesas_espelho_transacoes ON public.despesas';
  EXECUTE 'CREATE TRIGGER trg_despesas_espelho_transacoes
             AFTER INSERT ON public.despesas
             FOR EACH ROW EXECUTE FUNCTION public.despesa_espelha_transacao()';
END;
$$;

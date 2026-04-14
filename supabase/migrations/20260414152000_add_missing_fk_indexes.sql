-- =============================================
-- Phase 2.1 — Missing indexes on foreign keys and hot-path filters
--
-- DEFENSIVE VERSION: the migration file originally assumed the
-- "long-name" schema (transacoes_financeiras, parcelas_financeiras,
-- etc.), but the live Lovable Cloud database for this project may
-- still be on the "short-name" schema (transacoes, categorias...).
-- Every index is therefore wrapped in a to_regclass() guard: if the
-- target table isn't present, the statement is skipped.
-- =============================================

DO $$
BEGIN
  IF to_regclass('public.lead_comunicacoes') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_lead_comunicacoes_lead_id
               ON public.lead_comunicacoes(lead_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_lead_comunicacoes_created_at
               ON public.lead_comunicacoes(created_at DESC)';
  ELSE
    RAISE NOTICE 'Skipping lead_comunicacoes indexes (table missing)';
  END IF;

  IF to_regclass('public.parcelas_financeiras') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_parcelas_status_pagamento
               ON public.parcelas_financeiras(status, data_pagamento)
               WHERE status = ''pago''';
  ELSE
    RAISE NOTICE 'Skipping parcelas_financeiras index (table missing)';
  END IF;

  IF to_regclass('public.processos_andamentos') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_andamentos_processo_data
               ON public.processos_andamentos(processo_id, data_andamento DESC)';
  ELSE
    RAISE NOTICE 'Skipping processos_andamentos index (table missing)';
  END IF;

  IF to_regclass('public.transacoes_financeiras') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_transacoes_created_at
               ON public.transacoes_financeiras(created_at DESC)';
  ELSE
    RAISE NOTICE 'Skipping transacoes_financeiras index (table missing)';
  END IF;

  IF to_regclass('public.consultas_realizadas') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_consultas_usuario_created
               ON public.consultas_realizadas(usuario_id, created_at DESC)';
  ELSE
    RAISE NOTICE 'Skipping consultas_realizadas index (table missing)';
  END IF;
END;
$$;

-- =====================================================================
-- NEUTRALIZADA EM 16/06/2026
-- =====================================================================
-- Esta migration originalmente DELETAVA todos os dados financeiros de
-- 2026 (transacoes, despesas, acordos, parcelas, creditos, metas).
--
-- Ela era one-shot — pra zerar antes de relancamento manual — mas o
-- arquivo continuou no historico de migrations. Existe risco do runner
-- do Lovable reaplicar quando reprocessa o conjunto inteiro de
-- migrations (mesmo que `supabase_migrations.schema_migrations` ja
-- tenha a entrada, ja vimos cenarios onde isso falha).
--
-- O conteudo destrutivo foi removido. A "migration" agora e um no-op:
-- so registra no log do banco que o arquivo foi processado.
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE '20260521130000_cleanup_financeiro_2026: NO-OP (conteudo destrutivo removido em 16/06/2026)';
END $$;

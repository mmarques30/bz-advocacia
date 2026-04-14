-- =============================================
-- Fix advisor function_search_path_mutable para public.atualizar_updated_at
--
-- Contexto: o Supabase linter marca como WARN toda funcao PL/pgSQL
-- SECURITY DEFINER que nao tenha o search_path fixado. Quando o
-- search_path esta mutavel, um usuario malicioso com permissao de
-- criar objetos em algum schema alcancavel pode injetar codigo via
-- funcoes homonimas. A correcao e congelar o search_path da funcao.
--
-- Link do lint: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
--
-- Defensive: so aplica o ALTER se a funcao existir. Preserva assinatura,
-- volatilidade e corpo — muda apenas o GUC associado.
-- =============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.proname = 'atualizar_updated_at'
  ) THEN
    EXECUTE 'ALTER FUNCTION public.atualizar_updated_at() SET search_path = ''public''';
  ELSE
    RAISE NOTICE 'Skipping search_path fix (function public.atualizar_updated_at not found)';
  END IF;
END;
$$;

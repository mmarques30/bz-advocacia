-- Garante que mensagens_sdr esta na publication 'supabase_realtime' pra
-- novas mensagens propagarem via postgres_changes. Sem isso, o
-- ConversaBot subscribe nunca recebe e a conversa "fica congelada" ate
-- o usuario sair/voltar. Idempotente.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'mensagens_sdr'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens_sdr';
  END IF;
END $$;

-- Tambem garante a leads_geral, que o ChatPanel/LeadsKanban observam pra
-- status_sdr e bot_pausado.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'leads_geral'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.leads_geral';
  END IF;
END $$;

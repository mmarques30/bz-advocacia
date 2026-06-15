-- Meta Ads integration — cron jobs (ETAPA 4 da integracao)
--
-- Agenda 2 jobs pg_cron pra disparar as edge functions de sync:
--
-- 1) meta-sync-structure: diariamente as 04h SP (07h UTC) — estrutura
--    muda pouco, nao precisa ser frequente.
-- 2) meta-sync-insights:  a cada hora no minuto 5 — captura gasto e
--    cliques recentes (date_preset=last_7d sobrescreve dias parciais).
--
-- Ambos pegam o secret `sdr_webhook_secret` do vault e passam no header
-- `x-webhook-secret`. Mesmo secret usado por cron-followup e
-- campanha-timeout-3d.
--
-- Pre-requisito: o secret `sdr_webhook_secret` precisa estar configurado
-- no vault (ETAPA 6). Se faltar, o cron vai disparar mas a edge function
-- vai responder 401 (e o erro aparece em meta_execution_log).

-- ---------------------------------------------------------------------
-- Idempotencia: remove os jobs antigos antes de criar de novo.
-- Permite re-rodar a migration sem duplicar (ex: ajustar cron expression).
-- ---------------------------------------------------------------------
DO $$
BEGIN
  PERFORM cron.unschedule('meta-sync-structure-daily')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'meta-sync-structure-daily');
  PERFORM cron.unschedule('meta-sync-insights-hourly')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'meta-sync-insights-hourly');
END $$;

-- ---------------------------------------------------------------------
-- Job 1: estrutura — diaria as 07h UTC (04h SP, fora do horario comercial)
-- ---------------------------------------------------------------------
SELECT cron.schedule(
  'meta-sync-structure-daily',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url := 'https://nvkxblrwblhvggndlfax.functions.supabase.co/meta-sync-structure',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'sdr_webhook_secret'
        LIMIT 1
      )
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ---------------------------------------------------------------------
-- Job 2: insights — minuto 5 de cada hora
-- ---------------------------------------------------------------------
SELECT cron.schedule(
  'meta-sync-insights-hourly',
  '5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://nvkxblrwblhvggndlfax.functions.supabase.co/meta-sync-insights',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'sdr_webhook_secret'
        LIMIT 1
      )
    ),
    body := '{}'::jsonb
  );
  $$
);

-- =============================================
-- Phase 2.1 — Missing indexes on foreign keys and hot-path filters
-- Goal: speed up the dashboard financial KPIs, lead drill-downs,
-- and process communication joins. Only adds what's missing.
-- All indexes use IF NOT EXISTS for safety on re-apply.
-- =============================================

-- lead_comunicacoes.lead_id (FK with ON DELETE CASCADE, not indexed).
CREATE INDEX IF NOT EXISTS idx_lead_comunicacoes_lead_id
  ON public.lead_comunicacoes(lead_id);

CREATE INDEX IF NOT EXISTS idx_lead_comunicacoes_created_at
  ON public.lead_comunicacoes(created_at DESC);

-- Hot path in useFinanceiro: filter paid parcels by date range.
CREATE INDEX IF NOT EXISTS idx_parcelas_status_pagamento
  ON public.parcelas_financeiras(status, data_pagamento)
  WHERE status = 'pago';

-- Processos andamentos: composite of processo_id + date DESC helps the
-- timeline view that lists entries ordered by date per process.
CREATE INDEX IF NOT EXISTS idx_andamentos_processo_data
  ON public.processos_andamentos(processo_id, data_andamento DESC);

-- Transacoes financeiras: created_at used for recent activity and ranges.
CREATE INDEX IF NOT EXISTS idx_transacoes_created_at
  ON public.transacoes_financeiras(created_at DESC);

-- Consultas realizadas: composite for "my recent consultations" view.
CREATE INDEX IF NOT EXISTS idx_consultas_usuario_created
  ON public.consultas_realizadas(usuario_id, created_at DESC);

-- Adiciona campos para integracao com bot de WhatsApp.
-- Call 16/04: consolidar andamentos dentro de tarefas.
--
-- info_cliente: texto livre que o bot envia ao cliente quando pergunta
--   sobre o andamento do processo (ex: "Petição protocolada, aguardando").
-- fase_processo: codigo da fase do processo (Distribuição/Audiência/Decisão),
--   gerenciavel via Listas Suspensas (opcoes_sistema grupo 'fase_processo').

ALTER TABLE demandas_internas
  ADD COLUMN IF NOT EXISTS info_cliente TEXT,
  ADD COLUMN IF NOT EXISTS fase_processo TEXT;

-- Seed das 3 fases acordadas na call (gerenciaveis pelo admin depois).
INSERT INTO opcoes_sistema (grupo, valor, label, ativo, ordem) VALUES
  ('fase_processo', 'distribuicao', 'Distribuição', true, 1),
  ('fase_processo', 'audiencia', 'Audiência', true, 2),
  ('fase_processo', 'decisao', 'Decisão', true, 3)
ON CONFLICT DO NOTHING;

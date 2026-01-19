-- Adicionar novos campos para categorias e vínculos
ALTER TABLE demandas_internas
ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'geral',
ADD COLUMN IF NOT EXISTS processo_id UUID REFERENCES processos(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES contact_submissions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS data_limite DATE;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_demandas_categoria ON demandas_internas(categoria);
CREATE INDEX IF NOT EXISTS idx_demandas_processo_id ON demandas_internas(processo_id);
CREATE INDEX IF NOT EXISTS idx_demandas_lead_id ON demandas_internas(lead_id);
CREATE INDEX IF NOT EXISTS idx_demandas_data_limite ON demandas_internas(data_limite);
CREATE INDEX IF NOT EXISTS idx_demandas_status ON demandas_internas(status);
CREATE INDEX IF NOT EXISTS idx_demandas_prioridade ON demandas_internas(prioridade);

-- Comentário para documentação
COMMENT ON COLUMN demandas_internas.categoria IS 'Categoria da demanda: processos, vendas, pagamentos, administrativo, geral';
COMMENT ON COLUMN demandas_internas.processo_id IS 'Vínculo opcional com um processo';
COMMENT ON COLUMN demandas_internas.lead_id IS 'Vínculo opcional com um lead/cliente';
COMMENT ON COLUMN demandas_internas.data_limite IS 'Data limite para conclusão da demanda';
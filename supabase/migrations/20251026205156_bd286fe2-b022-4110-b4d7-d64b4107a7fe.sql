-- Fase 1: Criar estrutura completa de Gestão Financeira

-- 1.1 Criar tabela acordos_financeiros
CREATE TABLE IF NOT EXISTS acordos_financeiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES contact_submissions(id) ON DELETE CASCADE,
  processo_id UUID REFERENCES processos(id) ON DELETE SET NULL,
  tipo_servico TEXT NOT NULL,
  valor_total NUMERIC NOT NULL CHECK (valor_total > 0),
  forma_pagamento TEXT NOT NULL CHECK (forma_pagamento IN ('a_vista', 'parcelado')),
  numero_parcelas INTEGER DEFAULT 1 CHECK (numero_parcelas > 0),
  data_primeiro_vencimento DATE,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'concluido', 'cancelado')),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Índices para acordos_financeiros
CREATE INDEX IF NOT EXISTS idx_acordos_cliente ON acordos_financeiros(cliente_id);
CREATE INDEX IF NOT EXISTS idx_acordos_status ON acordos_financeiros(status);
CREATE INDEX IF NOT EXISTS idx_acordos_processo ON acordos_financeiros(processo_id);

-- RLS para acordos_financeiros
ALTER TABLE acordos_financeiros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage acordos"
ON acordos_financeiros FOR ALL
TO authenticated USING (true) WITH CHECK (true);

-- 1.2 Criar tabela parcelas_financeiras
CREATE TABLE IF NOT EXISTS parcelas_financeiras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acordo_id UUID NOT NULL REFERENCES acordos_financeiros(id) ON DELETE CASCADE,
  numero_parcela INTEGER NOT NULL CHECK (numero_parcela > 0),
  valor NUMERIC NOT NULL CHECK (valor > 0),
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  valor_pago NUMERIC CHECK (valor_pago >= 0),
  forma_pagamento_recebido TEXT CHECK (forma_pagamento_recebido IN ('pix', 'boleto', 'cartao', 'dinheiro', 'transferencia')),
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  pago_por UUID REFERENCES auth.users(id),
  
  UNIQUE(acordo_id, numero_parcela)
);

-- Índices para parcelas_financeiras
CREATE INDEX IF NOT EXISTS idx_parcelas_acordo ON parcelas_financeiras(acordo_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_vencimento ON parcelas_financeiras(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_parcelas_status ON parcelas_financeiras(status);

-- RLS para parcelas_financeiras
ALTER TABLE parcelas_financeiras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage parcelas"
ON parcelas_financeiras FOR ALL
TO authenticated USING (true) WITH CHECK (true);

-- 1.3 Criar tabela historico_pagamentos
CREATE TABLE IF NOT EXISTS historico_pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcela_id UUID NOT NULL REFERENCES parcelas_financeiras(id) ON DELETE CASCADE,
  valor NUMERIC NOT NULL,
  data_pagamento DATE NOT NULL,
  forma_pagamento TEXT NOT NULL,
  observacoes TEXT,
  registrado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para historico_pagamentos
CREATE INDEX IF NOT EXISTS idx_historico_parcela ON historico_pagamentos(parcela_id);
CREATE INDEX IF NOT EXISTS idx_historico_data ON historico_pagamentos(data_pagamento DESC);

-- RLS para historico_pagamentos
ALTER TABLE historico_pagamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read historico"
ON historico_pagamentos FOR SELECT
TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert historico"
ON historico_pagamentos FOR INSERT
TO authenticated WITH CHECK (true);

-- 1.4 Função para atualizar status do acordo
CREATE OR REPLACE FUNCTION atualizar_status_acordo()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE acordos_financeiros
  SET status = CASE
    WHEN (SELECT COUNT(*) FROM parcelas_financeiras WHERE acordo_id = NEW.acordo_id AND status = 'pago') = 
         (SELECT numero_parcelas FROM acordos_financeiros WHERE id = NEW.acordo_id) THEN 'concluido'
    ELSE 'ativo'
  END
  WHERE id = NEW.acordo_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar status
DROP TRIGGER IF EXISTS trigger_atualizar_status_acordo ON parcelas_financeiras;
CREATE TRIGGER trigger_atualizar_status_acordo
AFTER INSERT OR UPDATE ON parcelas_financeiras
FOR EACH ROW
EXECUTE FUNCTION atualizar_status_acordo();
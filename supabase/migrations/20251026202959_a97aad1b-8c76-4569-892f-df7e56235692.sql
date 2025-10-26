-- Adicionar novas colunas na tabela processos
ALTER TABLE processos
ADD COLUMN IF NOT EXISTS tribunal TEXT,
ADD COLUMN IF NOT EXISTS comarca TEXT,
ADD COLUMN IF NOT EXISTS vara TEXT,
ADD COLUMN IF NOT EXISTS responsavel_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS observacoes TEXT,
ADD COLUMN IF NOT EXISTS data_distribuicao DATE,
ADD COLUMN IF NOT EXISTS autor TEXT,
ADD COLUMN IF NOT EXISTS reu TEXT;

-- Atualizar CHECK constraint do status
ALTER TABLE processos 
DROP CONSTRAINT IF EXISTS processos_status_check;

ALTER TABLE processos 
ADD CONSTRAINT processos_status_check 
CHECK (status IN ('em_andamento', 'concluido', 'arquivado', 'suspenso'));

-- Atualizar registros existentes com status 'ativo' para 'em_andamento'
UPDATE processos 
SET status = 'em_andamento' 
WHERE status = 'ativo';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_processos_numero ON processos(numero_processo);
CREATE INDEX IF NOT EXISTS idx_processos_status ON processos(status);
CREATE INDEX IF NOT EXISTS idx_processos_prazo ON processos(prazo_proximo) WHERE prazo_proximo IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_processos_tribunal ON processos(tribunal);
CREATE INDEX IF NOT EXISTS idx_processos_responsavel ON processos(responsavel_id);

-- Criar tabela processos_andamentos
CREATE TABLE IF NOT EXISTS public.processos_andamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id UUID NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
  data_andamento DATE NOT NULL,
  tipo_andamento TEXT NOT NULL CHECK (tipo_andamento IN ('audiencia', 'decisao', 'peticao', 'recurso', 'outro')),
  descricao TEXT NOT NULL,
  responsavel_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- RLS Policies para processos_andamentos
ALTER TABLE processos_andamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read andamentos"
ON processos_andamentos FOR SELECT
TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert andamentos"
ON processos_andamentos FOR INSERT
TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update andamentos"
ON processos_andamentos FOR UPDATE
TO authenticated USING (true);

-- Índices para processos_andamentos
CREATE INDEX IF NOT EXISTS idx_andamentos_processo ON processos_andamentos(processo_id);
CREATE INDEX IF NOT EXISTS idx_andamentos_data ON processos_andamentos(data_andamento DESC);

-- Criar tabela processos_prazos
CREATE TABLE IF NOT EXISTS public.processos_prazos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id UUID NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  data_prazo DATE NOT NULL,
  tipo_prazo TEXT NOT NULL CHECK (tipo_prazo IN ('recurso', 'contestacao', 'audiencia', 'outro')),
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'cumprido', 'cancelado')),
  responsavel_id UUID REFERENCES auth.users(id),
  alerta_dias_antes INTEGER DEFAULT 7,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- RLS Policies para processos_prazos
ALTER TABLE processos_prazos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage prazos"
ON processos_prazos FOR ALL
TO authenticated USING (true)
WITH CHECK (true);

-- Índices para processos_prazos
CREATE INDEX IF NOT EXISTS idx_prazos_processo ON processos_prazos(processo_id);
CREATE INDEX IF NOT EXISTS idx_prazos_data ON processos_prazos(data_prazo);
CREATE INDEX IF NOT EXISTS idx_prazos_status ON processos_prazos(status);
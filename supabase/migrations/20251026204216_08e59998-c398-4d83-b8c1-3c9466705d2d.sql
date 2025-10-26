-- Fase 1: Ajustes completos no banco de dados para Gestão de Processos

-- 1.1 Atualizar tabela processos
ALTER TABLE processos 
ADD COLUMN IF NOT EXISTS data_prevista_conclusao DATE;

-- Garantir constraint correto do status
ALTER TABLE processos 
DROP CONSTRAINT IF EXISTS processos_status_check;

ALTER TABLE processos 
ADD CONSTRAINT processos_status_check 
CHECK (status IN ('em_andamento', 'concluido', 'arquivado', 'suspenso'));

-- 1.2 Atualizar tabela processos_prazos
ALTER TABLE processos_prazos
ADD COLUMN IF NOT EXISTS prioridade TEXT CHECK (prioridade IN ('alta', 'media', 'baixa')) DEFAULT 'media',
ADD COLUMN IF NOT EXISTS alerta_7_dias BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS alerta_3_dias BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS alerta_1_dia BOOLEAN DEFAULT false;

-- 1.3 Criar tabela processos_documentos
CREATE TABLE IF NOT EXISTS processos_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id UUID NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
  andamento_id UUID REFERENCES processos_andamentos(id) ON DELETE SET NULL,
  nome_arquivo TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('peticao', 'decisao', 'prova', 'parecer', 'outro')),
  caminho_storage TEXT NOT NULL,
  tamanho_bytes BIGINT,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id)
);

-- RLS para documentos
ALTER TABLE processos_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage documentos"
ON processos_documentos FOR ALL
TO authenticated USING (true) WITH CHECK (true);

-- Índices para documentos
CREATE INDEX IF NOT EXISTS idx_documentos_processo ON processos_documentos(processo_id);
CREATE INDEX IF NOT EXISTS idx_documentos_andamento ON processos_documentos(andamento_id);
CREATE INDEX IF NOT EXISTS idx_documentos_categoria ON processos_documentos(categoria);

-- 1.4 Criar tabela processos_historico
CREATE TABLE IF NOT EXISTS processos_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id UUID NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
  entidade_tipo TEXT NOT NULL,
  entidade_id UUID,
  acao TEXT NOT NULL,
  campo_alterado TEXT,
  valor_anterior TEXT,
  valor_novo TEXT,
  usuario_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para histórico
ALTER TABLE processos_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read historico"
ON processos_historico FOR SELECT
TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert historico"
ON processos_historico FOR INSERT
TO authenticated WITH CHECK (true);

-- Índices para histórico
CREATE INDEX IF NOT EXISTS idx_historico_processo ON processos_historico(processo_id);
CREATE INDEX IF NOT EXISTS idx_historico_created ON processos_historico(created_at DESC);

-- 1.5 Criar Storage Bucket para documentos
INSERT INTO storage.buckets (id, name, public)
VALUES ('processo-documentos', 'processo-documentos', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para processo-documentos
CREATE POLICY "Authenticated users can view processo documentos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'processo-documentos');

CREATE POLICY "Authenticated users can upload processo documentos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'processo-documentos');

CREATE POLICY "Authenticated users can update processo documentos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'processo-documentos');

CREATE POLICY "Authenticated users can delete processo documentos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'processo-documentos');

-- Adicionar política de DELETE para processos
CREATE POLICY "Authenticated users can delete processos"
ON processos FOR DELETE
TO authenticated
USING (true);
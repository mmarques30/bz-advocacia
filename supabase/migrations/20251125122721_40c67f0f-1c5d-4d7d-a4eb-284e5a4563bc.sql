-- Criar tabela para documentos do Google Drive vinculados aos processos
CREATE TABLE public.documentos_drive (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id uuid NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
  tipo_documento text NOT NULL,
  nome text NOT NULL,
  descricao text,
  drive_url text NOT NULL,
  drive_file_id text NOT NULL,
  data_documento date,
  tags text[],
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Índices para performance
CREATE INDEX idx_documentos_drive_processo ON documentos_drive(processo_id);
CREATE INDEX idx_documentos_drive_tipo ON documentos_drive(tipo_documento);

-- Row Level Security
ALTER TABLE documentos_drive ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage documentos_drive" 
ON documentos_drive FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_documentos_drive_updated_at 
BEFORE UPDATE ON documentos_drive
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
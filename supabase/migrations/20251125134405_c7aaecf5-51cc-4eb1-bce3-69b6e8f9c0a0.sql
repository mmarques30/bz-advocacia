-- Adicionar campos específicos do Bot WhatsApp à tabela contact_submissions
ALTER TABLE contact_submissions 
ADD COLUMN IF NOT EXISTS bot_finalizado boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS perguntas_respondidas integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS conversa_bot_completa jsonb,
ADD COLUMN IF NOT EXISTS whatsapp_id text,
ADD COLUMN IF NOT EXISTS utm_source text,
ADD COLUMN IF NOT EXISTS utm_medium text,
ADD COLUMN IF NOT EXISTS utm_campaign text,
ADD COLUMN IF NOT EXISTS primeiro_contato_em timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS ultimo_contato_em timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS canal_especifico text;

-- Criar índice único no telefone para evitar duplicatas
CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_submissions_telefone 
ON contact_submissions(telefone);

-- Criar tabela de interações do lead
CREATE TABLE IF NOT EXISTS lead_interacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES contact_submissions(id) ON DELETE CASCADE NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('mensagem_bot', 'mensagem_manual', 'email', 'ligacao', 'nota_interna')),
  canal text NOT NULL CHECK (canal IN ('whatsapp', 'email', 'telefone')),
  mensagem text NOT NULL,
  eh_bot boolean DEFAULT false,
  direcao text NOT NULL CHECK (direcao IN ('entrada', 'saida')),
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS na tabela lead_interacoes
ALTER TABLE lead_interacoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para lead_interacoes
CREATE POLICY "Authenticated users can read lead_interacoes" 
ON lead_interacoes 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert lead_interacoes" 
ON lead_interacoes 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_lead_interacoes_lead ON lead_interacoes(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_interacoes_created ON lead_interacoes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_bot ON contact_submissions(bot_finalizado, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_origem ON contact_submissions(origem, created_at DESC);
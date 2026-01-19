-- Adicionar campos para dados contratuais em contact_submissions
ALTER TABLE public.contact_submissions
ADD COLUMN IF NOT EXISTS cpf text,
ADD COLUMN IF NOT EXISTS rg text,
ADD COLUMN IF NOT EXISTS nacionalidade text DEFAULT 'brasileiro(a)',
ADD COLUMN IF NOT EXISTS profissao text,
ADD COLUMN IF NOT EXISTS endereco_cep text,
ADD COLUMN IF NOT EXISTS endereco_cidade text,
ADD COLUMN IF NOT EXISTS endereco_estado text;

-- Criar tabela para armazenar contratos gerados
CREATE TABLE public.contratos_gerados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.contact_submissions(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  tipo_contrato TEXT NOT NULL,
  conteudo_final TEXT NOT NULL,
  pdf_url TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho',
  valores JSONB DEFAULT '{}',
  dados_contrato JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Índices para performance
CREATE INDEX idx_contratos_gerados_cliente ON public.contratos_gerados(cliente_id);
CREATE INDEX idx_contratos_gerados_status ON public.contratos_gerados(status);
CREATE INDEX idx_contratos_gerados_created ON public.contratos_gerados(created_at DESC);

-- Enable RLS
ALTER TABLE public.contratos_gerados ENABLE ROW LEVEL SECURITY;

-- Policies para contratos_gerados
CREATE POLICY "Usuários autenticados podem ver contratos"
ON public.contratos_gerados
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem criar contratos"
ON public.contratos_gerados
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar contratos"
ON public.contratos_gerados
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem deletar contratos"
ON public.contratos_gerados
FOR DELETE
TO authenticated
USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_contratos_gerados_updated_at
BEFORE UPDATE ON public.contratos_gerados
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar bucket para PDFs de contratos
INSERT INTO storage.buckets (id, name, public)
VALUES ('contratos-pdf', 'contratos-pdf', false)
ON CONFLICT (id) DO NOTHING;

-- Policies para storage de contratos
CREATE POLICY "Usuários autenticados podem ver PDFs"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'contratos-pdf');

CREATE POLICY "Usuários autenticados podem fazer upload de PDFs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'contratos-pdf');

CREATE POLICY "Usuários autenticados podem deletar PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'contratos-pdf');
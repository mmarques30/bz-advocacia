
-- Tabela para versionamento de templates
CREATE TABLE public.templates_versoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  versao INTEGER NOT NULL DEFAULT 1,
  nome TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  descricao TEXT,
  variaveis TEXT[],
  editado_por UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.templates_versoes ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read versions
CREATE POLICY "Authenticated users can read template versions"
ON public.templates_versoes
FOR SELECT
USING (true);

-- Authenticated users can insert versions
CREATE POLICY "Authenticated users can insert template versions"
ON public.templates_versoes
FOR INSERT
WITH CHECK (true);

-- Index for fast lookup by template_id
CREATE INDEX idx_templates_versoes_template_id ON public.templates_versoes(template_id);

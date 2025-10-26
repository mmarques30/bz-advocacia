-- Criar tabela de notas dos leads
CREATE TABLE public.lead_notas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES contact_submissions(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL,
  texto TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- RLS para lead_notas
ALTER TABLE public.lead_notas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read lead_notas"
ON public.lead_notas FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert lead_notas"
ON public.lead_notas FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update their own lead_notas"
ON public.lead_notas FOR UPDATE
TO authenticated
USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete their own lead_notas"
ON public.lead_notas FOR DELETE
TO authenticated
USING (auth.uid() = usuario_id);

-- Criar tabela de comunicações
CREATE TABLE public.lead_comunicacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES contact_submissions(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('email', 'whatsapp', 'ligacao')),
  template_usado TEXT,
  mensagem TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'enviado' CHECK (status IN ('enviado', 'entregue', 'lido', 'erro')),
  enviado_por UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS para lead_comunicacoes
ALTER TABLE public.lead_comunicacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read lead_comunicacoes"
ON public.lead_comunicacoes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert lead_comunicacoes"
ON public.lead_comunicacoes FOR INSERT
TO authenticated
WITH CHECK (true);

-- Adicionar campos novos em contact_submissions
ALTER TABLE public.contact_submissions 
ADD COLUMN IF NOT EXISTS prioridade TEXT DEFAULT 'media' CHECK (prioridade IN ('alta', 'media', 'baixa'));

ALTER TABLE public.contact_submissions 
ADD COLUMN IF NOT EXISTS tags TEXT[];
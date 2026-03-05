
-- Create enum for improvement types
CREATE TYPE public.tipo_melhoria AS ENUM ('correcao', 'melhoria', 'nova_funcionalidade');

-- Create melhorias_registro table
CREATE TABLE public.melhorias_registro (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  tipo tipo_melhoria NOT NULL DEFAULT 'melhoria',
  data_implementacao DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.melhorias_registro ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read
CREATE POLICY "Authenticated users can read melhorias"
  ON public.melhorias_registro
  FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can insert (no WITH CHECK needed for service role, but allow system inserts)
CREATE POLICY "System can insert melhorias"
  ON public.melhorias_registro
  FOR INSERT
  WITH CHECK (true);

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Criar tabela de demandas internas
CREATE TABLE public.demandas_internas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('melhoria', 'bug', 'sugestao', 'tarefa')),
  prioridade TEXT NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'cancelado')),
  criado_por UUID,
  responsavel_id UUID,
  data_conclusao DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.demandas_internas ENABLE ROW LEVEL SECURITY;

-- Policy: Todos usuários autenticados podem visualizar demandas
CREATE POLICY "Authenticated users can read demandas"
ON public.demandas_internas
FOR SELECT
USING (true);

-- Policy: Apenas admins podem criar demandas
CREATE POLICY "Admins can insert demandas"
ON public.demandas_internas
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Apenas admins podem atualizar demandas
CREATE POLICY "Admins can update demandas"
ON public.demandas_internas
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Apenas admins podem deletar demandas
CREATE POLICY "Admins can delete demandas"
ON public.demandas_internas
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_demandas_internas_updated_at
BEFORE UPDATE ON public.demandas_internas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create rotinas_calendario table
CREATE TABLE public.rotinas_calendario (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo text NOT NULL,
  data date NOT NULL,
  horario text,
  tipo text NOT NULL DEFAULT 'outro',
  recorrente boolean DEFAULT false,
  recorrencia text,
  prioridade text DEFAULT 'media',
  status text DEFAULT 'pendente',
  observacoes text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rotinas_calendario ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can manage rotinas"
ON public.rotinas_calendario
FOR ALL
USING (true)
WITH CHECK (true);

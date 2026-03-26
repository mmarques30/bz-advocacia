
CREATE TABLE public.treinamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text,
  drive_url text NOT NULL,
  categoria text DEFAULT 'geral',
  ordem integer DEFAULT 0,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.treinamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read treinamentos" ON public.treinamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage treinamentos" ON public.treinamentos FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.senhas_sistema (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  url text,
  usuario text,
  senha text NOT NULL,
  categoria text DEFAULT 'geral',
  observacoes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.senhas_sistema ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage senhas" ON public.senhas_sistema FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

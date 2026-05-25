CREATE TABLE IF NOT EXISTS public.numeros_bloqueados_bot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telefone text NOT NULL UNIQUE,
  nome text,
  motivo text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_numeros_bloqueados_bot_tel ON public.numeros_bloqueados_bot(telefone);

ALTER TABLE public.numeros_bloqueados_bot ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins manage bloqueados" ON public.numeros_bloqueados_bot;
CREATE POLICY "admins manage bloqueados"
ON public.numeros_bloqueados_bot
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "authenticated read bloqueados" ON public.numeros_bloqueados_bot;
CREATE POLICY "authenticated read bloqueados"
ON public.numeros_bloqueados_bot
FOR SELECT
TO authenticated
USING (true);

INSERT INTO public.numeros_bloqueados_bot (telefone, nome, motivo)
VALUES ('555599382149', 'Natã Andrei Da Rosa', 'advogado')
ON CONFLICT (telefone) DO NOTHING;
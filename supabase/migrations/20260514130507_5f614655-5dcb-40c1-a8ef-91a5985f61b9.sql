-- Item 3: mapeamento explícito advogados_sdr ↔ auth.users
ALTER TABLE public.advogados_sdr
  ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_advogados_sdr_user_id ON public.advogados_sdr(user_id);

-- Backfill por email (case-insensitive)
UPDATE public.advogados_sdr a
SET user_id = u.id
FROM auth.users u
WHERE a.user_id IS NULL
  AND a.email IS NOT NULL
  AND lower(a.email) = lower(u.email);

-- Permitir auto-onboard: usuário autenticado pode criar/atualizar SEU próprio registro
DROP POLICY IF EXISTS advogados_sdr_insert_self ON public.advogados_sdr;
CREATE POLICY advogados_sdr_insert_self
  ON public.advogados_sdr
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS advogados_sdr_update_self ON public.advogados_sdr;
CREATE POLICY advogados_sdr_update_self
  ON public.advogados_sdr
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin pode tudo
DROP POLICY IF EXISTS advogados_sdr_admin_all ON public.advogados_sdr;
CREATE POLICY advogados_sdr_admin_all
  ON public.advogados_sdr
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Item 4 (preparação): coluna de leitura para badge de não-lidas
ALTER TABLE public.leads_geral
  ADD COLUMN IF NOT EXISTS ultima_leitura_humano timestamptz;
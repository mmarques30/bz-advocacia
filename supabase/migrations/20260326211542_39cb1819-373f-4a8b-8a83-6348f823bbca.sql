
-- Add advogado RLS policies for opcoes_sistema (so non-admin advogadas can also manage lists)
CREATE POLICY "Advogados can insert opcoes_sistema"
ON public.opcoes_sistema
FOR INSERT
TO public
WITH CHECK (has_role(auth.uid(), 'advogado'::app_role));

CREATE POLICY "Advogados can update opcoes_sistema"
ON public.opcoes_sistema
FOR UPDATE
TO public
USING (has_role(auth.uid(), 'advogado'::app_role));

CREATE POLICY "Advogados can delete opcoes_sistema"
ON public.opcoes_sistema
FOR DELETE
TO public
USING (has_role(auth.uid(), 'advogado'::app_role));

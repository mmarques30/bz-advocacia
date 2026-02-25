
-- Enable RLS on leads_geral
ALTER TABLE public.leads_geral ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all leads
CREATE POLICY "Authenticated users can read leads_geral"
ON public.leads_geral FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Authenticated users can insert leads
CREATE POLICY "Authenticated users can insert leads_geral"
ON public.leads_geral FOR INSERT
WITH CHECK (true);

-- Authenticated users can update leads
CREATE POLICY "Authenticated users can update leads_geral"
ON public.leads_geral FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Authenticated users can delete leads
CREATE POLICY "Authenticated users can delete leads_geral"
ON public.leads_geral FOR DELETE
USING (auth.uid() IS NOT NULL);

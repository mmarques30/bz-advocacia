
CREATE TABLE public.leads_status_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_csv_id text UNIQUE NOT NULL,
  lead_status text NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.leads_status_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read overrides"
ON public.leads_status_overrides FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert overrides"
ON public.leads_status_overrides FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update overrides"
ON public.leads_status_overrides FOR UPDATE
USING (auth.uid() IS NOT NULL);

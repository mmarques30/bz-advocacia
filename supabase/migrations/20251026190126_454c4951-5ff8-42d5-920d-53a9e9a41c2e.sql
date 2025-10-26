-- Create table for contact form submissions
CREATE TABLE public.contact_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_completo TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT NOT NULL,
  tipo_processo TEXT NOT NULL,
  como_conheceu TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  
  -- Conditional fields for Divórcio
  regime_casamento TEXT,
  tem_filhos BOOLEAN,
  bens_partilhar TEXT,
  
  -- Conditional fields for Inventário
  valor_estimado_bens TEXT,
  numero_herdeiros INTEGER,
  
  -- Conditional fields for Pensão Alimentícia
  situacao_atual TEXT,
  valor_pretendido TEXT,
  
  -- Document uploads (array of file paths)
  documentos TEXT[],
  
  -- LGPD consent
  lgpd_consent BOOLEAN NOT NULL DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'novo',
  notas_internas TEXT
);

-- Enable Row Level Security
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous inserts (public form)
CREATE POLICY "Allow anonymous submissions" 
ON public.contact_submissions 
FOR INSERT 
WITH CHECK (true);

-- Create policy to prevent public reads (only admins can view)
CREATE POLICY "No public reads" 
ON public.contact_submissions 
FOR SELECT 
USING (false);

-- Create index for faster queries
CREATE INDEX idx_contact_submissions_created_at ON public.contact_submissions(created_at DESC);
CREATE INDEX idx_contact_submissions_tipo_processo ON public.contact_submissions(tipo_processo);
CREATE INDEX idx_contact_submissions_status ON public.contact_submissions(status);

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('contact-documents', 'contact-documents', false);

-- Storage policies for document uploads
CREATE POLICY "Allow anonymous uploads" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'contact-documents');

CREATE POLICY "No public reads on documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'contact-documents' AND false);
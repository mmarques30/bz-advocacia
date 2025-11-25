-- Adicionar foreign keys na tabela demandas_internas
ALTER TABLE public.demandas_internas
ADD CONSTRAINT demandas_internas_criado_por_fkey 
FOREIGN KEY (criado_por) REFERENCES public.profiles(id);

ALTER TABLE public.demandas_internas
ADD CONSTRAINT demandas_internas_responsavel_id_fkey 
FOREIGN KEY (responsavel_id) REFERENCES public.profiles(id);
-- Reativa categorias de despesa que a Mariana solicitou trazer de volta.
-- O hook useCategoriasDespesa lista as opcoes ativas em opcoes_sistema
-- (grupo='categoria_despesa'). Se as 3 abaixo estiverem desativadas ou
-- ausentes, viram "Outros" no select e poluem a categorizacao.
--
-- UPSERT idempotente: se o registro existe, marca ativo=true e atualiza
-- label/ordem. Se nao existe, insere com a ordem informada.

INSERT INTO public.opcoes_sistema (grupo, valor, label, ativo, ordem)
VALUES
  ('categoria_despesa', 'marketing_publicidade', 'Marketing',  true, 10),
  ('categoria_despesa', 'telefonia_internet',    'Internet',   true, 20),
  ('categoria_despesa', 'energia_agua',          'Energia',    true, 30)
ON CONFLICT (grupo, valor)
DO UPDATE SET
  label = EXCLUDED.label,
  ativo = true,
  ordem = EXCLUDED.ordem;

NOTIFY pgrst, 'reload schema';

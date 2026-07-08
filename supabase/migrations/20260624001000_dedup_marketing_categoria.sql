-- Havia dois codigos diferentes com o mesmo label "Marketing" em
-- opcoes_sistema (grupo=categoria_despesa):
--   - 'marketing'               (seed antigo, 2026-02-11)
--   - 'marketing_publicidade'   (seed novo, alinhado com o enum TS)
--
-- O select mostrava duas linhas "Marketing" iguais, entao a usuaria
-- gravava despesas em ambos e depois nao conseguia agregar direito.
-- Deixa apenas 'marketing_publicidade' ativo (mesmo codigo que o enum
-- CategoriaDespesa e o resolveCategoriaLabel esperam). O antigo fica
-- desativado (soft delete) pra preservar historico gravado.

UPDATE public.opcoes_sistema
SET ativo = false
WHERE grupo = 'categoria_despesa'
  AND valor = 'marketing';

NOTIFY pgrst, 'reload schema';

-- Meta Ads integration — seed da credencial unica (ETAPA 2 da integracao)
--
-- IDs da B&Z fornecidos pela Mariana / Juliana:
-- - Business Manager: 918894670181107
-- - App ID:           1046556887799244
-- - Ad Account:       act_1077194864075798
-- - Page ID:          454173584453480
-- - Pixel ID:         511652845204065 (nao usado hoje, salvo p/ futuro)
--
-- ON CONFLICT DO NOTHING: ad_account_id e UNIQUE; rodar de novo nao quebra
-- (mas tambem nao atualiza valores). Pra atualizar, mexer manualmente.

INSERT INTO public.meta_credentials
  (app_id, business_id, ad_account_id, page_id, pixel_id, active)
VALUES
  ('1046556887799244',
   '918894670181107',
   'act_1077194864075798',
   '454173584453480',
   '511652845204065',
   true)
ON CONFLICT (ad_account_id) DO NOTHING;

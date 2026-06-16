-- Meta Ads: RPC pra disparar sync via UI ("Sincronizar agora").
--
-- Frontend chama supabase.rpc('trigger_meta_sync', { target: 'structure' | 'insights' }).
-- A funcao usa o secret do vault e dispara a edge function correspondente
-- via net.http_post. So admin pode chamar.

CREATE OR REPLACE FUNCTION public.trigger_meta_sync(target text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, net
AS $$
DECLARE
  v_url text;
  v_secret text;
  v_req_id bigint;
BEGIN
  -- So admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;

  IF target NOT IN ('structure', 'insights') THEN
    RAISE EXCEPTION 'target invalido: %', target;
  END IF;

  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets
  WHERE name = 'sdr_webhook_secret'
  LIMIT 1;

  IF v_secret IS NULL THEN
    RAISE EXCEPTION 'sdr_webhook_secret nao configurado no vault';
  END IF;

  v_url := 'https://nvkxblrwblhvggndlfax.functions.supabase.co/meta-sync-' || target;

  SELECT net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', v_secret
    ),
    body := '{}'::jsonb
  ) INTO v_req_id;

  RETURN jsonb_build_object('triggered', target, 'request_id', v_req_id);
END;
$$;

REVOKE ALL ON FUNCTION public.trigger_meta_sync(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.trigger_meta_sync(text) TO authenticated;

COMMENT ON FUNCTION public.trigger_meta_sync(text) IS
  'Dispara meta-sync-structure ou meta-sync-insights. So admin pode chamar.';

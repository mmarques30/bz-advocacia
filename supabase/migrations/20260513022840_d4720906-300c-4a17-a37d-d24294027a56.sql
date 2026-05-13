create or replace function public.get_sdr_webhook_secret()
returns text
language sql
security definer
set search_path = public, vault
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'sdr_webhook_secret' limit 1;
$$;
revoke all on function public.get_sdr_webhook_secret() from public, anon, authenticated;
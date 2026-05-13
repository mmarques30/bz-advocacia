-- Rotacionar autenticação do trigger SDR: service_role → shared webhook secret

-- 1) Inserir/atualizar o segredo compartilhado no Vault com novo nome
do $$
declare
  v_id uuid;
begin
  select id into v_id from vault.secrets where name = 'sdr_webhook_secret';
  if v_id is null then
    perform vault.create_secret(
      'e07dc1a7-c030-417d-8946-54e560d29088-c9e87d06-3f6d-4ac4-aa0d-f812cc51a86b',
      'sdr_webhook_secret',
      'Shared secret usado pelo trigger trg_on_new_lead_webhook ao chamar a Edge Function on-new-lead'
    );
  else
    perform vault.update_secret(v_id, 'e07dc1a7-c030-417d-8946-54e560d29088-c9e87d06-3f6d-4ac4-aa0d-f812cc51a86b');
  end if;
end $$;

-- 2) Recriar a função do trigger usando X-Webhook-Secret
create or replace function public.trg_on_new_lead_webhook()
returns trigger
language plpgsql
security definer
set search_path = public, vault, net
as $$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret
    from vault.decrypted_secrets
    where name = 'sdr_webhook_secret'
    limit 1;

  if v_secret is null then
    return new;
  end if;

  perform net.http_post(
    url := 'https://nvkxblrwblhvggndlfax.functions.supabase.co/on-new-lead',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Webhook-Secret', v_secret
    ),
    body := jsonb_build_object(
      'type',   'INSERT',
      'table',  'leads_geral',
      'record', row_to_json(new)
    )
  );
  return new;
end;
$$;

-- 3) Remover o segredo antigo (não usado mais)
do $$
declare
  v_id uuid;
begin
  select id into v_id from vault.secrets where name = 'sdr_service_role_key';
  if v_id is not null then
    delete from vault.secrets where id = v_id;
  end if;
end $$;
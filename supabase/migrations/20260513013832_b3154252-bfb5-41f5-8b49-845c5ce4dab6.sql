-- 1) Extensões
create extension if not exists "uuid-ossp";
create extension if not exists pg_net;

-- 2) Colunas extras em leads_geral
alter table public.leads_geral
  add column if not exists status_sdr        text   default 'novo',
  add column if not exists fluxo_sdr         text,
  add column if not exists area_normalizada  text,
  add column if not exists score             int    default 0,
  add column if not exists motivo_qualificacao text,
  add column if not exists humano_responsavel uuid,
  add column if not exists assumido_em       timestamptz,
  add column if not exists bot_pausado       boolean default false,
  add column if not exists ultima_mensagem_em timestamptz,
  add column if not exists call_agendada_em  timestamptz,
  add column if not exists etapa_qualificacao text default 'M0',
  add column if not exists origem_sdr        text;

do $$
begin
  if not exists (
    select 1 from information_schema.check_constraints
    where constraint_name = 'leads_geral_status_sdr_check'
  ) then
    alter table public.leads_geral
      add constraint leads_geral_status_sdr_check check (status_sdr in (
        'novo','em_atendimento_bot','mql_frio','aguardando_triagem',
        'sql_aguardando_humano','assumido_humano','agendado','perdido','cliente'
      ));
  end if;
end$$;

create index if not exists idx_leads_geral_status_sdr on public.leads_geral(status_sdr);
create index if not exists idx_leads_geral_fluxo on public.leads_geral(fluxo_sdr);

-- 3) Tabelas novas (lead_id é TEXT)
create table if not exists public.advogados_sdr (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  email text unique,
  telefone text,
  areas text[] not null default '{}',
  ativo boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists public.mensagens_sdr (
  id uuid primary key default uuid_generate_v4(),
  lead_id text not null references public.leads_geral(id) on delete cascade,
  origem text not null check (origem in ('lead','bot','humano')),
  conteudo text not null,
  metadata jsonb default '{}',
  enviada_em timestamptz default now()
);
create index if not exists idx_mensagens_sdr_lead on public.mensagens_sdr(lead_id, enviada_em);

create table if not exists public.qualificacoes_sdr (
  id uuid primary key default uuid_generate_v4(),
  lead_id text not null references public.leads_geral(id) on delete cascade,
  pergunta_codigo text not null,
  pergunta_texto text not null,
  resposta_texto text,
  resposta_estruturada jsonb,
  created_at timestamptz default now()
);
create unique index if not exists idx_qualif_sdr_lead_pergunta
  on public.qualificacoes_sdr(lead_id, pergunta_codigo);

create table if not exists public.eventos_sdr (
  id uuid primary key default uuid_generate_v4(),
  lead_id text references public.leads_geral(id) on delete cascade,
  tipo text not null,
  payload jsonb default '{}',
  created_at timestamptz default now()
);

create table if not exists public.servicos_sdr (
  id uuid primary key default uuid_generate_v4(),
  area_codigo text not null,
  area_nome text not null,
  servico text not null,
  fluxo text not null,
  link_pagamento text,
  valor_consulta numeric,
  modalidade_honorarios text,
  advogado_id uuid references public.advogados_sdr(id),
  ativo boolean default true,
  created_at timestamptz default now()
);
create index if not exists idx_servicos_sdr_area on public.servicos_sdr(area_codigo);

do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'leads_geral_humano_responsavel_fkey'
  ) then
    alter table public.leads_geral
      add constraint leads_geral_humano_responsavel_fkey
      foreign key (humano_responsavel) references public.advogados_sdr(id);
  end if;
end$$;

-- 4) Trigger ultima_mensagem_em
create or replace function public.trg_atualizar_ultima_msg_sdr()
returns trigger language plpgsql
set search_path = public
as $$
begin
  update public.leads_geral
    set ultima_mensagem_em = new.enviada_em
    where id = new.lead_id;
  return new;
end;
$$;

drop trigger if exists trg_mensagens_sdr_atualizar_lead on public.mensagens_sdr;
create trigger trg_mensagens_sdr_atualizar_lead
after insert on public.mensagens_sdr
for each row execute function public.trg_atualizar_ultima_msg_sdr();

-- 5) Seed servicos_sdr
delete from public.servicos_sdr where area_codigo in
  ('saude','inventario','familia','civel','consumidor','trabalhista','previdenciario');

insert into public.servicos_sdr (area_codigo, area_nome, servico, fluxo, link_pagamento, modalidade_honorarios) values
  ('saude','Direito da Saúde','Ações contra planos de saúde','saude','https://borgesezembruski.com/','entrada+parcelas'),
  ('saude','Direito da Saúde','Cobertura via SUS','saude','https://borgesezembruski.com/','entrada+parcelas'),
  ('saude','Direito da Saúde','Liberação de medicamentos','saude','https://borgesezembruski.com/','entrada+parcelas'),
  ('saude','Direito da Saúde','Cumprimento provisório de decisão','saude','https://borgesezembruski.com/','entrada+parcelas'),
  ('saude','Direito da Saúde','Juizado Especial da Fazenda Pública','saude','https://borgesezembruski.com/','entrada+parcelas'),
  ('inventario','Inventário','Inventário judicial','inventario',null,'entrada+parcelas'),
  ('inventario','Inventário','Inventário extrajudicial','inventario',null,'entrada+parcelas'),
  ('inventario','Inventário','Partilha de bens','inventario',null,'entrada+parcelas'),
  ('inventario','Inventário','Alvará judicial','inventario',null,'entrada+parcelas'),
  ('familia','Direito de Família','Divórcio Consensual','qualificacao_geral',null,'entrada+parcelas'),
  ('familia','Direito de Família','Divórcio Litigioso','qualificacao_geral',null,'entrada+parcelas'),
  ('familia','Direito de Família','União Estável','qualificacao_geral',null,'entrada+parcelas'),
  ('familia','Direito de Família','Pensão Alimentícia','qualificacao_geral',null,'entrada+parcelas'),
  ('familia','Direito de Família','Guarda','qualificacao_geral',null,'entrada+parcelas'),
  ('familia','Direito de Família','Alienação Parental','qualificacao_geral',null,'entrada+parcelas'),
  ('familia','Direito de Família','Arbitramento de Aluguel','qualificacao_geral',null,'entrada+parcelas'),
  ('civel','Direito Cível','Indenização por danos morais e materiais','qualificacao_geral',null,'entrada+parcelas+exito'),
  ('civel','Direito Cível','Procedimento comum cível','qualificacao_geral',null,'entrada+parcelas+exito'),
  ('civel','Direito Cível','Cumprimento de sentença','qualificacao_geral',null,'entrada+parcelas+exito'),
  ('civel','Direito Cível','Tutela antecipada antecedente','qualificacao_geral',null,'entrada+parcelas+exito'),
  ('civel','Direito Cível','Execução de título extrajudicial','qualificacao_geral',null,'entrada+parcelas+exito'),
  ('civel','Direito Cível','Agravo de instrumento','qualificacao_geral',null,'entrada+parcelas+exito'),
  ('consumidor','Direito do Consumidor','Rescisão contratual','qualificacao_geral',null,'entrada+parcelas+exito'),
  ('consumidor','Direito do Consumidor','Restituição de quantias','qualificacao_geral',null,'entrada+parcelas+exito'),
  ('consumidor','Direito do Consumidor','Superendividamento','qualificacao_geral',null,'entrada+parcelas+exito'),
  ('consumidor','Direito do Consumidor','Danos morais em relações de consumo','qualificacao_geral',null,'entrada+parcelas+exito'),
  ('trabalhista','Direito Trabalhista','Reclamações trabalhistas','qualificacao_geral',null,'entrada+parcelas+exito'),
  ('previdenciario','Direito Previdenciário','Demandas previdenciárias','qualificacao_geral',null,'entrada+parcelas');

-- 6) View clientes ativos (mapeia phone_number/full_name → telefone/nome)
create or replace view public.vw_clientes_ativos as
select distinct l.id as lead_id, l.phone_number as telefone, l.full_name as nome
from public.leads_geral l
where exists (
  select 1 from public.processos p where p.lead_id::text = l.id
);

-- 7) RLS nas tabelas novas
alter table public.advogados_sdr     enable row level security;
alter table public.mensagens_sdr     enable row level security;
alter table public.qualificacoes_sdr enable row level security;
alter table public.eventos_sdr       enable row level security;
alter table public.servicos_sdr      enable row level security;

drop policy if exists "advogados_sdr_select_auth"     on public.advogados_sdr;
drop policy if exists "mensagens_sdr_select_auth"     on public.mensagens_sdr;
drop policy if exists "qualificacoes_sdr_select_auth" on public.qualificacoes_sdr;
drop policy if exists "servicos_sdr_select_auth"      on public.servicos_sdr;
drop policy if exists "eventos_sdr_select_admin"      on public.eventos_sdr;

create policy "advogados_sdr_select_auth"     on public.advogados_sdr     for select to authenticated using (true);
create policy "mensagens_sdr_select_auth"     on public.mensagens_sdr     for select to authenticated using (true);
create policy "qualificacoes_sdr_select_auth" on public.qualificacoes_sdr for select to authenticated using (true);
create policy "servicos_sdr_select_auth"      on public.servicos_sdr      for select to authenticated using (true);
create policy "eventos_sdr_select_admin"      on public.eventos_sdr       for select to authenticated using (public.has_role(auth.uid(),'admin'));

-- 8) Vault: placeholder pro service_role_key
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'sdr_service_role_key') then
    perform vault.create_secret('REPLACE_WITH_SERVICE_ROLE_KEY', 'sdr_service_role_key', 'Service role key usado pelo trigger pg_net do bot SDR');
  end if;
end$$;

-- 9) Trigger pg_net: AFTER INSERT em leads_geral → POST on-new-lead
create or replace function public.trg_on_new_lead_webhook()
returns trigger language plpgsql security definer
set search_path = public, vault, net
as $$
declare
  v_key text;
begin
  select decrypted_secret into v_key
    from vault.decrypted_secrets
    where name = 'sdr_service_role_key'
    limit 1;

  if v_key is null or v_key = 'REPLACE_WITH_SERVICE_ROLE_KEY' then
    return new;
  end if;

  perform net.http_post(
    url := 'https://nvkxblrwblhvggndlfax.functions.supabase.co/on-new-lead',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
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

drop trigger if exists trg_leads_geral_on_new_lead on public.leads_geral;
create trigger trg_leads_geral_on_new_lead
after insert on public.leads_geral
for each row execute function public.trg_on_new_lead_webhook();
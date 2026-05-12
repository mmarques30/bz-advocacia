-- =====================================================
-- SDR Advocacia — Migration aditiva
-- Versão: 2.0 (code-first com Edge Functions)
--
-- Esta migration NÃO destrói nada do schema existente.
-- Usa ADD COLUMN IF NOT EXISTS e CREATE TABLE IF NOT EXISTS.
-- Pode rodar com segurança no Supabase atual.
-- =====================================================

-- ---------- 1) Extensões necessárias ----------

create extension if not exists "uuid-ossp";
create extension if not exists pg_cron;
create extension if not exists pg_net;  -- para chamar Edge Functions via HTTP

-- ---------- 2) Campos extras na tabela leads (aditivo) ----------
-- Assumindo que a tabela leads já existe com: nome, telefone, tipo_de_processo, origem

alter table public.leads
  add column if not exists status_sdr text not null default 'novo',
  add column if not exists area_normalizada text,
  add column if not exists score int not null default 0,
  add column if not exists motivo_qualificacao text,
  add column if not exists humano_responsavel uuid,
  add column if not exists assumido_em timestamptz,
  add column if not exists bot_pausado boolean not null default false,
  add column if not exists ultima_mensagem_em timestamptz,
  add column if not exists call_agendada_em timestamptz,
  add column if not exists etapa_qualificacao text not null default 'M0';
  -- etapa_qualificacao: 'M0' | 'M1' | 'M2' | 'M3' | 'finalizado'

-- Domínio dos status do SDR (text + check, para não conflitar com enum existente)
do $$
begin
  if not exists (
    select 1 from information_schema.check_constraints
    where constraint_name = 'leads_status_sdr_check'
  ) then
    alter table public.leads
      add constraint leads_status_sdr_check check (status_sdr in (
        'novo',
        'em_atendimento_bot',
        'mql_frio',
        'sql_aguardando_humano',
        'assumido_humano',
        'agendado',
        'perdido',
        'cliente'
      ));
  end if;
end$$;

create index if not exists idx_leads_status_sdr on public.leads(status_sdr);
create index if not exists idx_leads_telefone on public.leads(telefone);
create index if not exists idx_leads_humano on public.leads(humano_responsavel);

-- ---------- 3) Tabelas novas ----------

create table if not exists public.advogados (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  email text unique not null,
  telefone text,
  areas text[] not null default '{}',
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.mensagens (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  origem text not null check (origem in ('lead', 'bot', 'humano')),
  conteudo text not null,
  metadata jsonb default '{}',
  enviada_em timestamptz not null default now()
);
create index if not exists idx_mensagens_lead on public.mensagens(lead_id, enviada_em);

create table if not exists public.qualificacoes (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  pergunta_codigo text not null,        -- 'M1' | 'M2' | 'M3'
  pergunta_texto text not null,
  resposta_texto text,
  resposta_estruturada jsonb,
  created_at timestamptz not null default now()
);
create unique index if not exists idx_qualif_lead_pergunta
  on public.qualificacoes(lead_id, pergunta_codigo);

create table if not exists public.eventos_bot (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references public.leads(id) on delete cascade,
  tipo text not null,
  payload jsonb default '{}',
  created_at timestamptz not null default now()
);

-- ---------- 4) FK do humano_responsavel ----------

do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'leads_humano_responsavel_fkey'
  ) then
    alter table public.leads
      add constraint leads_humano_responsavel_fkey
      foreign key (humano_responsavel) references public.advogados(id);
  end if;
end$$;

-- ---------- 5) Trigger: atualiza ultima_mensagem_em ----------

create or replace function public.trg_atualizar_ultima_msg()
returns trigger language plpgsql as $$
begin
  update public.leads
    set ultima_mensagem_em = new.enviada_em
    where id = new.lead_id;
  return new;
end;
$$;

drop trigger if exists trg_mensagens_atualizar_lead on public.mensagens;
create trigger trg_mensagens_atualizar_lead
after insert on public.mensagens
for each row execute function public.trg_atualizar_ultima_msg();

-- ---------- 6) Database Webhook — disparar Edge Function on-new-lead ----------
-- IMPORTANTE: o webhook é criado pela UI do Supabase, não por SQL.
-- Vá em Database > Webhooks > Create > escolha tabela leads, evento INSERT,
-- aponte para: https://<project-ref>.functions.supabase.co/on-new-lead
-- e adicione header: Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>

-- ---------- 7) pg_cron — disparar follow-ups e timeouts ----------
-- Roda a cada 6 horas e chama a Edge Function de follow-up.
-- Substitua <PROJECT_REF> e <SERVICE_ROLE_KEY> antes de aplicar.

-- select cron.schedule(
--   'sdr_followup_cron',
--   '0 */6 * * *',
--   $$
--     select net.http_post(
--       url := 'https://<PROJECT_REF>.functions.supabase.co/cron-followup',
--       headers := jsonb_build_object(
--         'Content-Type', 'application/json',
--         'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
--       )
--     );
--   $$
-- );

-- ---------- 8) Seed de advogados (opcional) ----------

-- insert into public.advogados (nome, email, telefone, areas) values
--   ('Dr. Trabalhista', 'trabalhista@escritorio.com', '5511999999999', '{trabalhista}'),
--   ('Dra. Cível',      'civel@escritorio.com',      '5511988888888', '{civel,familia,sucessoes}'),
--   ('Dr. Empresarial', 'empresarial@escritorio.com','5511977777777', '{empresarial,tributario,consultivo}')
-- on conflict (email) do nothing;

-- ---------- FIM ----------

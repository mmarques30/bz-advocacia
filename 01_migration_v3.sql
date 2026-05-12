-- =====================================================
-- SDR Advocacia — Migration V3
-- B&Z Advocacia | Schema-aware (leads_geral, processos)
--
-- Esta migration é 100% aditiva. Não altera nenhuma
-- coluna ou tabela existente do CRM. Pode ser rodada
-- com segurança no projeto nvkxblrwblhvggndlfax.
-- =====================================================

-- ---------- 1) Extensões ----------
create extension if not exists "uuid-ossp";
-- pg_cron e pg_net opcionais (precisam ser ativadas na UI Extensions antes)

-- ---------- 2) Campos extras na leads_geral ----------
-- Tudo aditivo, sem mexer em coluna existente.

alter table public.leads_geral
  add column if not exists status_sdr        text   default 'novo',
  add column if not exists fluxo_sdr         text,          -- 'saude' | 'inventario' | 'qualificacao_geral' | 'fora_escopo'
  add column if not exists area_normalizada  text,
  add column if not exists score             int    default 0,
  add column if not exists motivo_qualificacao text,
  add column if not exists humano_responsavel uuid,
  add column if not exists assumido_em       timestamptz,
  add column if not exists bot_pausado       boolean default false,
  add column if not exists ultima_mensagem_em timestamptz,
  add column if not exists call_agendada_em  timestamptz,
  add column if not exists etapa_qualificacao text default 'M0',
  add column if not exists origem_sdr        text;           -- 'whatsapp_direto' | 'meta_lead_ads' | 'form_site' | 'manual'

-- Check do status_sdr
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

-- ---------- 3) Tabelas novas ----------

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
  lead_id uuid not null references public.leads_geral(id) on delete cascade,
  origem text not null check (origem in ('lead', 'bot', 'humano')),
  conteudo text not null,
  metadata jsonb default '{}',
  enviada_em timestamptz default now()
);
create index if not exists idx_mensagens_sdr_lead on public.mensagens_sdr(lead_id, enviada_em);

create table if not exists public.qualificacoes_sdr (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid not null references public.leads_geral(id) on delete cascade,
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
  lead_id uuid references public.leads_geral(id) on delete cascade,
  tipo text not null,
  payload jsonb default '{}',
  created_at timestamptz default now()
);

create table if not exists public.servicos_sdr (
  id uuid primary key default uuid_generate_v4(),
  area_codigo text not null,         -- 'saude','inventario','familia','civel','consumidor','trabalhista','previdenciario'
  area_nome text not null,
  servico text not null,
  fluxo text not null,                -- 'saude','inventario','qualificacao_geral','fora_escopo'
  link_pagamento text,
  valor_consulta numeric,
  modalidade_honorarios text,         -- 'entrada+parcelas' | 'entrada+parcelas+exito' | 'consulta'
  advogado_id uuid references public.advogados_sdr(id),
  ativo boolean default true,
  created_at timestamptz default now()
);
create index if not exists idx_servicos_sdr_area on public.servicos_sdr(area_codigo);

-- FK do humano_responsavel em leads_geral
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

-- ---------- 4) Trigger: ultima_mensagem_em ----------

create or replace function public.trg_atualizar_ultima_msg_sdr()
returns trigger language plpgsql as $$
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

-- ---------- 5) Seed: serviços B&Z ----------
-- Idempotente: deleta seed anterior e insere a partir do zero.

delete from public.servicos_sdr where area_codigo in
  ('saude','inventario','familia','civel','consumidor','trabalhista','previdenciario');

insert into public.servicos_sdr (area_codigo, area_nome, servico, fluxo, link_pagamento, modalidade_honorarios) values
  -- SAÚDE (fluxo com link de pagamento)
  ('saude','Direito da Saúde','Ações contra planos de saúde','saude','https://borgesezembruski.com/','entrada+parcelas'),
  ('saude','Direito da Saúde','Cobertura via SUS','saude','https://borgesezembruski.com/','entrada+parcelas'),
  ('saude','Direito da Saúde','Liberação de medicamentos','saude','https://borgesezembruski.com/','entrada+parcelas'),
  ('saude','Direito da Saúde','Cumprimento provisório de decisão','saude','https://borgesezembruski.com/','entrada+parcelas'),
  ('saude','Direito da Saúde','Juizado Especial da Fazenda Pública','saude','https://borgesezembruski.com/','entrada+parcelas'),

  -- INVENTÁRIO (fluxo com handoff direto, sem link)
  ('inventario','Inventário','Inventário judicial','inventario',null,'entrada+parcelas'),
  ('inventario','Inventário','Inventário extrajudicial','inventario',null,'entrada+parcelas'),
  ('inventario','Inventário','Partilha de bens','inventario',null,'entrada+parcelas'),
  ('inventario','Inventário','Alvará judicial','inventario',null,'entrada+parcelas'),

  -- FAMÍLIA (qualificação geral)
  ('familia','Direito de Família','Divórcio Consensual','qualificacao_geral',null,'entrada+parcelas'),
  ('familia','Direito de Família','Divórcio Litigioso','qualificacao_geral',null,'entrada+parcelas'),
  ('familia','Direito de Família','União Estável','qualificacao_geral',null,'entrada+parcelas'),
  ('familia','Direito de Família','Pensão Alimentícia','qualificacao_geral',null,'entrada+parcelas'),
  ('familia','Direito de Família','Guarda','qualificacao_geral',null,'entrada+parcelas'),
  ('familia','Direito de Família','Alienação Parental','qualificacao_geral',null,'entrada+parcelas'),
  ('familia','Direito de Família','Arbitramento de Aluguel','qualificacao_geral',null,'entrada+parcelas'),

  -- CÍVEL
  ('civel','Direito Cível','Indenização por danos morais e materiais','qualificacao_geral',null,'entrada+parcelas+exito'),
  ('civel','Direito Cível','Procedimento comum cível','qualificacao_geral',null,'entrada+parcelas+exito'),
  ('civel','Direito Cível','Cumprimento de sentença','qualificacao_geral',null,'entrada+parcelas+exito'),
  ('civel','Direito Cível','Tutela antecipada antecedente','qualificacao_geral',null,'entrada+parcelas+exito'),
  ('civel','Direito Cível','Execução de título extrajudicial','qualificacao_geral',null,'entrada+parcelas+exito'),
  ('civel','Direito Cível','Agravo de instrumento','qualificacao_geral',null,'entrada+parcelas+exito'),

  -- CONSUMIDOR
  ('consumidor','Direito do Consumidor','Rescisão contratual','qualificacao_geral',null,'entrada+parcelas+exito'),
  ('consumidor','Direito do Consumidor','Restituição de quantias','qualificacao_geral',null,'entrada+parcelas+exito'),
  ('consumidor','Direito do Consumidor','Superendividamento','qualificacao_geral',null,'entrada+parcelas+exito'),
  ('consumidor','Direito do Consumidor','Danos morais em relações de consumo','qualificacao_geral',null,'entrada+parcelas+exito'),

  -- TRABALHISTA
  ('trabalhista','Direito Trabalhista','Reclamações trabalhistas','qualificacao_geral',null,'entrada+parcelas+exito'),

  -- PREVIDENCIÁRIO
  ('previdenciario','Direito Previdenciário','Demandas previdenciárias','qualificacao_geral',null,'entrada+parcelas');

-- ---------- 6) View: clientes ativos (por processo) ----------
-- Lead vira cliente quando aparece em algum processo.
-- Esta view é usada pelo bot pra filtrar.

create or replace view public.vw_clientes_ativos as
select distinct l.id as lead_id, l.telefone, l.nome
from public.leads_geral l
where exists (
  select 1 from public.processos p
  where p.lead_id = l.id   -- pode precisar ajustar se a relação for outra coluna; ver TODO no README
);

-- ---------- FIM ----------
-- Próximos passos manuais (UI Supabase):
--   1) Database > Webhooks > criar hook em leads_geral (opcional, só pra leads vindos do Meta Lead Ads)
--   2) Z-API > Webhooks > apontar pra .../whatsapp-inbound
--   3) (opcional) ativar pg_cron + pg_net e agendar cron-followup

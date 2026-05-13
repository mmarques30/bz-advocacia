create table if not exists public.mensagens_inbound_lock (
  message_id text primary key,
  created_at timestamptz not null default now()
);
create index if not exists idx_lock_created on public.mensagens_inbound_lock(created_at);
alter table public.mensagens_inbound_lock enable row level security;
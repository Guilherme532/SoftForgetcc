-- SoftForge: tabelas do quiz. Cole no SQL Editor do Supabase e clique em Run.
-- Segurança: RLS ligado e SEM políticas = o navegador não lê nem escreve nada.
-- Só a função "quiz" (que usa a chave de serviço, guardada no servidor) acessa as tabelas.

create table if not exists attempts (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  nickname_key text not null,
  device_id text not null,
  plan jsonb not null,                 -- perguntas sorteadas e ordem das alternativas
  status text not null default 'active',
  score int,
  total int,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_ms int
);
create index if not exists attempts_key_idx on attempts (nickname_key);

create table if not exists answers (
  attempt_id uuid not null references attempts(id) on delete cascade,
  qid int not null,
  chosen int not null,
  correct boolean not null,
  answered_at timestamptz not null default now(),
  primary key (attempt_id, qid)
);

create table if not exists notifications (
  id bigserial primary key,
  attempt_id uuid references attempts(id) on delete cascade,
  channel text not null,
  status text not null,                -- sent | failed | skipped
  detail text,
  created_at timestamptz not null default now()
);

alter table attempts enable row level security;
alter table answers enable row level security;
alter table notifications enable row level security;

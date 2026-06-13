create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  date_label text,
  uf text,
  city text not null,
  category text not null,
  indicator_type text,
  indicator text,
  risk text,
  loss numeric default 0,
  company text,
  profile text,
  age text,
  sex text,
  education text,
  channel text,
  growth integer default 121,
  report_text text
);

alter table public.reports enable row level security;

drop policy if exists "Public reports are readable" on public.reports;
create policy "Public reports are readable"
on public.reports for select
to anon
using (true);

drop policy if exists "Anyone can submit reports" on public.reports;
create policy "Anyone can submit reports"
on public.reports for insert
to anon
with check (
  city is not null
  and length(trim(city)) between 2 and 120
  and category is not null
  and length(trim(category)) between 2 and 120
);

create table if not exists public.lookups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  date_label text,
  query_type text,
  query_hash text,
  query_domain text,
  score integer not null,
  label text not null,
  suspicious boolean not null default false,
  high_risk boolean not null default false,
  signals jsonb not null default '[]'::jsonb,
  known_match_count integer not null default 0,
  report_match_count integer not null default 0
);

alter table public.lookups enable row level security;

drop policy if exists "Public lookups are readable" on public.lookups;
create policy "Public lookups are readable"
on public.lookups for select
to anon
using (true);

drop policy if exists "Anyone can submit sanitized lookups" on public.lookups;
create policy "Anyone can submit sanitized lookups"
on public.lookups for insert
to anon
with check (
  score between 0 and 100
  and label in ('Risco baixo', 'Risco medio', 'Alto risco')
  and query_hash is not null
  and length(query_hash) between 8 and 32
);

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

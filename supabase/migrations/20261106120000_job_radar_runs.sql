-- Radar CDI à la demande (décision d'Alex, 2026-11-06) : plus de collecte quotidienne, c'est le
-- freelance qui lance sa recherche depuis /radar. Version gratuite : une seule recherche.
-- Chaque recherche est tracée (job_radar_runs) et ses offres sont rattachées au freelance
-- (job_radar_user_offers) : un freelance ne voit que les offres de ses propres recherches.

create table if not exists public.job_radar_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  ran_at timestamptz not null default now(),
  status text not null default 'running' check (status in ('running', 'done', 'failed')),
  credits_used integer not null default 0,
  offers_found integer not null default 0,
  error text
);

create index if not exists job_radar_runs_user_idx on public.job_radar_runs (user_id, ran_at desc);

create table if not exists public.job_radar_user_offers (
  user_id uuid not null references auth.users (id) on delete cascade,
  offer_id text not null references public.job_radar_offers (id) on delete cascade,
  run_id uuid references public.job_radar_runs (id) on delete set null,
  found_at timestamptz not null default now(),
  primary key (user_id, offer_id)
);

alter table public.job_radar_runs enable row level security;
alter table public.job_radar_user_offers enable row level security;

drop policy if exists "Chacun lit ses recherches radar" on public.job_radar_runs;
create policy "Chacun lit ses recherches radar" on public.job_radar_runs
  for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

drop policy if exists "Chacun lit ses offres radar" on public.job_radar_user_offers;
create policy "Chacun lit ses offres radar" on public.job_radar_user_offers
  for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- Les offres ne sont plus lisibles par toute la communauté : seulement celles de ses recherches.
drop policy if exists "Freelances et admins lisent le radar" on public.job_radar_offers;
drop policy if exists "Chacun lit les offres de ses recherches" on public.job_radar_offers;
create policy "Chacun lit les offres de ses recherches" on public.job_radar_offers
  for select to authenticated
  using (
    public.has_role(auth.uid(), 'admin')
    or exists (select 1 from public.job_radar_user_offers u where u.offer_id = id and u.user_id = auth.uid())
  );

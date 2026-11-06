-- Radar CDI des freelances : offres d'emploi CDI collectées chaque jour via TheirStack
-- (fonction job-radar-refresh), partagées par toute la communauté et classées côté site selon
-- le profil de chaque freelance. Écriture réservée au service (fonction), lecture aux
-- freelances inscrits et aux admins.

create table if not exists public.job_radar_offers (
  id text primary key,                 -- identifiant TheirStack de l'offre
  metier text not null,                -- métier Kistone de la recherche, ou « Recrutement »
  job_title text not null,
  company_name text not null,
  company_domain text,
  company_logo text,
  company_industry text,
  company_employees integer,
  company_funding text,
  location text,
  cities text[] not null default '{}',
  remote boolean not null default false,
  hybrid boolean not null default false,
  url text not null,
  source_url text,
  date_posted date,
  fetched_at timestamptz not null default now()
);

create index if not exists job_radar_offers_date_idx on public.job_radar_offers (date_posted desc);

alter table public.job_radar_offers enable row level security;

drop policy if exists "Freelances et admins lisent le radar" on public.job_radar_offers;
create policy "Freelances et admins lisent le radar" on public.job_radar_offers
  for select to authenticated
  using (
    public.has_role(auth.uid(), 'admin')
    or exists (select 1 from public.recruiter_profiles r where r.user_id = auth.uid())
  );

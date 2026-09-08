-- ============================================================================
-- Kistone RPO — schéma MONO-TENANT (plateforme interne Gotam)
-- Dérivé de kistone-connect (Lovable), débarrassé de tenants/tenant_members/
-- tenant_settings/tenant_billing et des helpers has_tenant_role/is_tenant_member.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ── Enums ───────────────────────────────────────────────────────────────────
do $$ begin create type public.app_role      as enum ('admin','client','freelance');            exception when duplicate_object then null; end $$;
do $$ begin create type public.remote_policy as enum ('onsite','hybrid','remote','flexible');   exception when duplicate_object then null; end $$;
do $$ begin create type public.need_status   as enum ('open','matching','in_progress','closed');exception when duplicate_object then null; end $$;
do $$ begin create type public.pipeline_status as enum ('suggested','shortlisted','interview','validated','rejected'); exception when duplicate_object then null; end $$;
do $$ begin create type public.mission_status as enum ('active','ended','cancelled');           exception when duplicate_object then null; end $$;
do $$ begin create type public.application_status as enum ('pending','accepted','rejected');    exception when duplicate_object then null; end $$;

-- ── updated_at ──────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- ============================================================================
-- Rôles. Table séparée de auth.users : jamais de rôle stocké côté client,
-- sinon une élévation de privilège suffit à devenir admin.
-- ============================================================================
create table if not exists public.user_roles (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role    public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

-- security definer : contourne la RLS de user_roles, sinon récursion infinie
-- quand une policy de user_roles appelle has_role().
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role); $$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$ select public.has_role(auth.uid(), 'admin'); $$;

-- ============================================================================
-- recruiter_profiles — le freelance (onboarding : compétences, TJM, dispo)
-- ============================================================================
create table if not exists public.recruiter_profiles (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid unique references auth.users(id) on delete cascade,
  -- identité
  first_name        text not null default '',
  last_name         text not null default '',
  email             text not null default '',
  phone             text,
  photo_url         text,
  linkedin_url      text,
  job_title         text,
  persona           text not null default 'rpo',      -- rpo | hr | finance
  -- expertise
  skills            text[] not null default '{}',
  sectors           text[] not null default '{}',
  tech_specialties  text[] not null default '{}',
  hr_specialties    text[] not null default '{}',
  finance_specialties text[] not null default '{}',
  tools             text[] not null default '{}',
  clients           text[] not null default '{}',     -- clients majeurs accompagnés
  languages         jsonb not null default '[]',      -- [{language, level}]
  english_level     text,
  has_linkedin_license boolean not null default false,
  -- mobilité & disponibilité
  mobility          text[] not null default '{}',     -- villes
  remote_preference public.remote_policy not null default 'flexible',
  work_time         text,                             -- temps plein / partiel
  available         boolean not null default true,
  availability_date date,
  -- commercial
  tjm               integer,                          -- TJM recruteur, HORS marge
  model             text,                             -- rpo | success | regie
  intro_text        text,
  missions          jsonb not null default '[]',      -- [{client, role, kpis, period}]
  -- qualification interne (admin uniquement, jamais exposée au freelance)
  admin_rating      smallint check (admin_rating between 0 and 5) default 0,
  admin_comments    text,
  super_tam         boolean not null default false,
  -- administratif / contrats
  company_name      text,
  siren             text,
  legal_form        text,
  tva_number        text,
  company_address   text,
  rib_document_url        text,
  urssaf_document_url     text,
  insurance_document_url  text,
  -- suivi
  onboarding_completed boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists rp_available_idx on public.recruiter_profiles (available, availability_date);
create index if not exists rp_tjm_idx       on public.recruiter_profiles (tjm);
create index if not exists rp_skills_idx    on public.recruiter_profiles using gin (skills);
create index if not exists rp_sectors_idx   on public.recruiter_profiles using gin (sectors);

drop trigger if exists set_updated_at on public.recruiter_profiles;
create trigger set_updated_at before update on public.recruiter_profiles
  for each row execute function public.set_updated_at();

-- ============================================================================
-- client_profiles — l'entreprise qui recrute
-- ============================================================================
create table if not exists public.client_profiles (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid unique references auth.users(id) on delete cascade,
  first_name   text not null default '',
  last_name    text not null default '',
  email        text not null default '',
  phone        text,
  job_title    text,
  company_name text not null default '',
  cities       text[] not null default '{}',
  -- informations légales (contrats)
  siren        text,
  legal_form   text,
  company_address text,
  representative_name  text,
  representative_title text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.client_profiles;
create trigger set_updated_at before update on public.client_profiles
  for each row execute function public.set_updated_at();

-- ============================================================================
-- client_needs — le besoin déposé par le client
-- ============================================================================
create table if not exists public.client_needs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  job_title       text not null,
  description     text,
  persona         text not null default 'rpo',
  profile_types   text[] not null default '{}',
  sectors         text[] not null default '{}',
  mission_location text not null default '',
  remote_policy   public.remote_policy not null default 'hybrid',
  -- budget exprimé en PRIX CLIENT (marge incluse)
  budget_tjm_min  integer,
  budget_tjm_max  integer,
  start_date      date,
  duration_text   text,
  -- dénormalisé pour l'affichage admin sans jointure
  company_name    text not null default '',
  contact_name    text not null default '',
  contact_email   text not null default '',
  status          public.need_status not null default 'open',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists cn_status_idx on public.client_needs (status);
create index if not exists cn_user_idx   on public.client_needs (user_id);

drop trigger if exists set_updated_at on public.client_needs;
create trigger set_updated_at before update on public.client_needs
  for each row execute function public.set_updated_at();

-- ============================================================================
-- profile_suggestions — résultat du matching + pipeline
-- ============================================================================
create table if not exists public.profile_suggestions (
  id                  uuid primary key default gen_random_uuid(),
  need_id             uuid not null references public.client_needs(id) on delete cascade,
  recruiter_profile_id uuid not null references public.recruiter_profiles(id) on delete cascade,
  -- le client ne voit qu'un label anonyme tant que le profil n'est pas validé
  anonymous_label     text not null default '',
  recruiter_first_name text,
  match_score         smallint not null default 0 check (match_score between 0 and 100),
  match_reasons       text[] not null default '{}',
  rule_score          smallint,   -- part déterministe, pour auditer l'IA
  super_tam           boolean not null default false,
  pipeline_status     public.pipeline_status not null default 'suggested',
  status_updated_at   timestamptz,
  created_at          timestamptz not null default now(),
  unique (need_id, recruiter_profile_id)
);
create index if not exists ps_need_idx on public.profile_suggestions (need_id, match_score desc);

-- ============================================================================
-- need_applications — candidature spontanée du freelance sur un besoin ouvert
-- ============================================================================
create table if not exists public.need_applications (
  id                  uuid primary key default gen_random_uuid(),
  need_id             uuid not null references public.client_needs(id) on delete cascade,
  recruiter_profile_id uuid not null references public.recruiter_profiles(id) on delete cascade,
  motivation          text,
  status              public.application_status not null default 'pending',
  created_at          timestamptz not null default now(),
  unique (need_id, recruiter_profile_id)
);

-- ============================================================================
-- missions — le placement effectif
-- ============================================================================
create table if not exists public.missions (
  id                  uuid primary key default gen_random_uuid(),
  need_id             uuid references public.client_needs(id) on delete set null,
  suggestion_id       uuid references public.profile_suggestions(id) on delete set null,
  recruiter_profile_id uuid not null references public.recruiter_profiles(id) on delete cascade,
  created_by          uuid references auth.users(id) on delete set null,
  title               text not null,
  company_name        text not null default '',
  location            text not null default '',
  recruiter_tjm       integer not null,   -- ce que touche le freelance
  client_tjm          integer not null,   -- ce que paie le client (marge incluse)
  start_date          date not null,
  end_date            date,
  duration_text       text,
  status              public.mission_status not null default 'active',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists missions_recruiter_idx on public.missions (recruiter_profile_id, status);

drop trigger if exists set_updated_at on public.missions;
create trigger set_updated_at before update on public.missions
  for each row execute function public.set_updated_at();

-- ============================================================================
-- specialties — référentiel alimenté par l'admin (skills suggérées par persona)
-- ============================================================================
create table if not exists public.specialties (
  id         uuid primary key default gen_random_uuid(),
  persona    text not null default 'rpo',
  label      text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (persona, label)
);

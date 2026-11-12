-- CGU et recherche de profils par les clients (décision d'Alex, 2026-11-12).
-- 1. Chaque utilisateur (freelance ou client) accepte les CGU dans leur version en vigueur ;
--    une nouvelle version redemande l'acceptation.
-- 2. Les clients connectés parcourent les profils freelance disponibles ou bientôt disponibles.
--    N'apparaissent que les freelances qui ont accepté les CGU (elles prévoient cette visibilité).

create table if not exists public.terms_acceptances (
  user_id uuid not null references auth.users (id) on delete cascade,
  version text not null,
  accepted_at timestamptz not null default now(),
  primary key (user_id, version)
);

alter table public.terms_acceptances enable row level security;

drop policy if exists "Chacun lit ses acceptations de CGU" on public.terms_acceptances;
create policy "Chacun lit ses acceptations de CGU" on public.terms_acceptances
  for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

drop policy if exists "Chacun accepte les CGU pour lui-même" on public.terms_acceptances;
create policy "Chacun accepte les CGU pour lui-même" on public.terms_acceptances
  for insert to authenticated
  with check (user_id = auth.uid());

grant select, insert on public.terms_acceptances to authenticated;

-- Profils visibles des clients connectés (et de l'admin) : CGU acceptées, profil complet (TJM),
-- disponible ou disponible sous 90 jours. Jamais le nom de famille, les coordonnées ni les
-- champs admin. Le TJM est celui du freelance : aucune marge depuis novembre 2026.
create or replace function public.search_freelances()
returns setof jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', p.id,
    'first_name', split_part(trim(p.first_name), ' ', 1),
    'photo_url', p.photo_url,
    'job_title', p.job_title,
    'vertical', p.vertical,
    'skills', p.skills,
    'tech_specialties', p.tech_specialties,
    'specialties', p.specialties,
    'sectors', p.sectors,
    'intro_text', p.intro_text,
    'years_experience', p.years_experience,
    'weekly_capacity', p.weekly_capacity,
    'mobility', p.mobility,
    'remote_preference', p.remote_preference,
    'available', p.available,
    'availability_date', p.availability_date,
    'tjm', p.tjm,
    'clients', p.clients,
    'missions', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'client_name', m->>'client_name',
        'profile_types', m->>'profile_types',
        'kpis', m->>'kpis',
        'duration', m->>'duration'
      )), '[]'::jsonb)
      from jsonb_array_elements(case when jsonb_typeof(p.missions) = 'array' then p.missions else '[]'::jsonb end) m
    ),
    'languages', p.languages,
    'english_level', p.admin_english_rating
  )
  from public.recruiter_profiles p
  where (public.has_role(auth.uid(), 'client') or public.has_role(auth.uid(), 'admin'))
    and p.tjm is not null
    and coalesce(p.email, '') not like '%@test.kistone.invalid'
    and exists (select 1 from public.terms_acceptances t where t.user_id = p.user_id)
    and (p.available is distinct from false or (p.availability_date is not null and p.availability_date <= current_date + 90))
  order by p.admin_rating desc nulls last, p.created_at desc;
$$;

revoke all on function public.search_freelances() from public, anon;
grant execute on function public.search_freelances() to authenticated;

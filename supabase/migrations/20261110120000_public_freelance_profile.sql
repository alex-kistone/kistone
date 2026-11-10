-- Profil public d'un freelance (décision d'Alex, 2026-11-10) : le freelance promeut son profil
-- sur LinkedIn avec un lien vers kistone.fr/profil/<id>. La page n'existe que s'il l'active
-- (public_profile). Elle montre le prénom, la photo, le métier, les spécialités, les clients et
-- les missions ; jamais le nom de famille, les coordonnées, le TJM ni les champs admin.

alter table public.recruiter_profiles
  add column if not exists public_profile boolean not null default false;

create or replace function public.get_public_profile(_id uuid)
returns jsonb
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
    'languages', p.languages
  )
  from public.recruiter_profiles p
  where p.id = _id and p.public_profile;
$$;

revoke all on function public.get_public_profile(uuid) from public;
grant execute on function public.get_public_profile(uuid) to anon, authenticated;

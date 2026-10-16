-- Anonymisation des profils mis en avant : le prénom seul, sans l'initiale du nom (demande d'Alex, 2026-10-16).

-- Derniers freelances inscrits d'une fonction, notés 4 ou 5 étoiles par l'admin, profil complet.
-- Lisible sans compte (pages /recruter/…) : uniquement des informations anonymisées
-- (prénom seul, poste, expérience, spécialités, rythme, disponibilité). Jamais d'email,
-- de téléphone, de LinkedIn, de photo, d'entreprise ni de TJM.
create or replace function public.list_featured_freelances(_vertical text, _limit integer default 6)
returns table (
  display_name text,
  job_title text,
  years_experience smallint,
  specialties text[],
  weekly_capacity smallint,
  available boolean,
  availability_date date,
  rating integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    initcap(split_part(trim(rp.first_name), ' ', 1)),
    rp.job_title,
    rp.years_experience,
    -- RPO : les métiers recrutés ; autres fonctions : les spécialités
    case when rp.vertical = 'rpo' then rp.skills else rp.specialties end,
    rp.weekly_capacity,
    rp.available,
    rp.availability_date::date,
    rp.admin_rating
  from public.recruiter_profiles rp
  where rp.vertical = _vertical
    and rp.admin_rating >= 4
    and rp.onboarding_completed
    and coalesce(trim(rp.first_name), '') <> ''
    and coalesce(trim(rp.last_name), '') <> ''
  order by rp.created_at desc
  limit least(greatest(coalesce(_limit, 6), 1), 12);
$$;

revoke all on function public.list_featured_freelances(text, integer) from public;
grant execute on function public.list_featured_freelances(text, integer) to anon, authenticated;

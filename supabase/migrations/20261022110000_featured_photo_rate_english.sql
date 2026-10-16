-- Profils mis en avant : photo, TJM client (marge incluse) et niveau d'anglais, pour l'aperçu
-- des profils avant la création du compte client (demande d'Alex, 2026-10-16).

-- Derniers freelances inscrits d'une fonction, notés 4 ou 5 étoiles par l'admin, profil complet.
-- Lisible sans compte : prénom seul, photo, poste, expérience, spécialités, rythme, disponibilité,
-- niveau d'anglais et prix client (TJM + 20 %, arrondi à l'euro supérieur, comme clientPrice).
-- Jamais d'email, de téléphone, de LinkedIn, d'entreprise ni du TJM du freelance.
drop function if exists public.list_featured_freelances(text, integer);

create function public.list_featured_freelances(_vertical text, _limit integer default 6)
returns table (
  display_name text,
  job_title text,
  years_experience smallint,
  specialties text[],
  weekly_capacity smallint,
  available boolean,
  availability_date date,
  rating integer,
  photo_url text,
  client_tjm integer,
  english_level smallint
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
    rp.admin_rating,
    nullif(trim(rp.photo_url), ''),
    case when rp.tjm > 0 then ceil(rp.tjm * 1.2)::integer end,
    -- La note d'anglais de l'admin prime sur le niveau déclaré par le freelance
    coalesce(
      rp.admin_english_rating,
      (select case lower(l->>'level')
                when 'débutant' then 1 when 'intermédiaire' then 2 when 'avancé' then 3
                when 'courant' then 4 when 'natif' then 5 end
       from jsonb_array_elements(case when jsonb_typeof(rp.languages) = 'array' then rp.languages else '[]'::jsonb end) l
       where l->>'language' = 'Anglais'
       limit 1)
    )::smallint
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

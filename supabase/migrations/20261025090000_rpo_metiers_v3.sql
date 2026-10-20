-- Métiers RPO revus par Alex (2026-10-20) : Tech, Data/AI, Product, GTM, Sales, Autres
-- (champ Jarvi « Spécialités RPO »). Le détail tech (Engineering, Infra/Cloud, Cyber, Data/IA)
-- passe dans les spécialités tech saisies par l'admin (champ Jarvi « Spécialités RPO Tech »).

create or replace function pg_temp.rename_metiers(_vals text[])
returns text[]
language sql
immutable
as $$
  select coalesce(array_agg(v order by ord), '{}')
  from (
    select distinct on (v) v, ord
    from unnest(_vals) with ordinality as t(old, ord)
    cross join lateral (select case old
      when 'Data/IA' then 'Data/AI'
      when 'Data' then 'Data/AI'
      when 'IA' then 'Data/AI'
      when 'Engineering' then 'Tech'
      when 'Dev' then 'Tech'
      when 'Infra/Cloud' then 'Tech'
      when 'Infra' then 'Tech'
      when 'Cloud' then 'Tech'
      when 'Cyber' then 'Tech'
      when 'Autre' then 'Autres'
      else old end as v) m
    order by v, ord
  ) s;
$$;

-- Le détail tech coché par le freelance est conservé dans ses spécialités tech
update public.recruiter_profiles
set tech_specialties = (
  select coalesce(array_agg(distinct t), '{}')
  from unnest(coalesce(tech_specialties, '{}') || array(
    select x from unnest(skills) x where x in ('Engineering', 'Infra/Cloud', 'Cyber', 'Data/IA')
  )) t
)
where skills && array['Engineering', 'Infra/Cloud', 'Cyber', 'Data/IA'];

update public.recruiter_profiles
set skills = pg_temp.rename_metiers(skills)
where skills && array['Data/IA', 'Data', 'IA', 'Engineering', 'Dev', 'Infra/Cloud', 'Infra', 'Cloud', 'Cyber', 'Autre'];

update public.client_needs
set profile_types = pg_temp.rename_metiers(profile_types)
where profile_types && array['Data/IA', 'Data', 'IA', 'Engineering', 'Dev', 'Infra/Cloud', 'Infra', 'Cloud', 'Cyber', 'Autre'];

-- Métiers RPO revus par Alex (2026-10-20) : Data/IA, Engineering, Product, Infra/Cloud, Cyber, GTM
-- (et « Autre »). Les anciennes valeurs des profils et des besoins sont renommées ; les doublons
-- éventuels sont retirés.

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
      when 'Data/AI' then 'Data/IA'
      when 'Data' then 'Data/IA'
      when 'IA' then 'Data/IA'
      when 'Dev' then 'Engineering'
      when 'Tech' then 'Engineering'
      when 'Infra' then 'Infra/Cloud'
      else old end as v) m
    order by v, ord
  ) s;
$$;

update public.recruiter_profiles
set skills = pg_temp.rename_metiers(skills)
where skills && array['Data/AI', 'Data', 'IA', 'Dev', 'Tech', 'Infra'];

update public.recruiter_profiles
set tech_specialties = pg_temp.rename_metiers(tech_specialties)
where tech_specialties && array['Data/AI', 'Data', 'IA', 'Dev', 'Tech', 'Infra'];

update public.client_needs
set profile_types = pg_temp.rename_metiers(profile_types)
where profile_types && array['Data/AI', 'Data', 'IA', 'Dev', 'Tech', 'Infra'];

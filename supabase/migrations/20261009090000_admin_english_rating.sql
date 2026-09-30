-- Note d'anglais donnée par l'admin (1 à 5 étoiles) : elle prime sur le niveau déclaré par
-- le freelance, pour le matching comme pour Jarvi (champ « English »). Comme les autres
-- champs admin, le freelance ne peut pas la modifier.
alter table public.recruiter_profiles
  add column if not exists admin_english_rating smallint check (admin_english_rating between 1 and 5);

create or replace function public.guard_recruiter_admin_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.has_role(auth.uid(), 'admin') then
    return new;
  end if;
  new.admin_rating         := old.admin_rating;
  new.admin_comments       := old.admin_comments;
  new.admin_english_rating := old.admin_english_rating;
  new.super_tam            := old.super_tam;
  new.tech_specialties     := old.tech_specialties;
  new.jarvi_profile_id     := old.jarvi_profile_id;
  new.jarvi_synced_at      := old.jarvi_synced_at;
  new.jarvi_sync_error     := old.jarvi_sync_error;
  return new;
end;
$$;

-- Spécialités tech alignées sur le champ Jarvi « Spécialités RPO Tech »
-- (Cyber, Data/AI, Dev, Infra, SAP) : conversion des anciennes valeurs.
update public.recruiter_profiles set tech_specialties = (
  select coalesce(array_agg(distinct v), '{}') from (
    select case s
      when 'Dev JS' then 'Dev' when 'Mobile' then 'Dev' when 'Java' then 'Dev' when '.NET' then 'Dev' when 'PHP' then 'Dev'
      when 'Cloud/Devops' then 'Infra' when 'ERP' then 'SAP'
      when 'Cyber' then 'Cyber' when 'Infra' then 'Infra'
      when 'Dev' then 'Dev' when 'Data/AI' then 'Data/AI' when 'SAP' then 'SAP'
      else null end v
    from unnest(tech_specialties) s
  ) t where v is not null
) where tech_specialties is not null and cardinality(tech_specialties) > 0;

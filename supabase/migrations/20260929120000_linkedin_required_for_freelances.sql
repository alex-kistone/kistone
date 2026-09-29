-- URL LinkedIn obligatoire pour les freelances : c'est la clé de rapprochement avec
-- l'ATS (Jarvi). Format canonique imposé (le front normalise avant d'enregistrer),
-- et un profil sans URL n'est pas « onboardé » : il n'entre pas dans le matching.

alter table public.recruiter_profiles drop constraint if exists recruiter_profiles_linkedin_url_format;
alter table public.recruiter_profiles add constraint recruiter_profiles_linkedin_url_format
  check (linkedin_url is null or linkedin_url ~ '^https://www\.linkedin\.com/in/[A-Za-z0-9_%-]{3,100}$');

create or replace function public.compute_onboarding_completed()
returns trigger
language plpgsql
as $$
begin
  new.onboarding_completed :=
    new.tjm is not null
    and coalesce(array_length(new.skills, 1), 0) > 0
    and new.linkedin_url is not null;
  return new;
end;
$$;

-- Recalcule le drapeau des profils existants
update public.recruiter_profiles set tjm = tjm;

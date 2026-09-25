-- Un compte est soit freelance (rôle 'user'), soit client (rôle 'client'), jamais les deux.
-- Les fonctions assign-client-role / assign-freelance-role le vérifient déjà ; ces
-- déclencheurs le garantissent aussi en base, quel que soit le chemin d'écriture.

create or replace function public.enforce_exclusive_account_roles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Freelance = rôle 'user' ou profil freelance déjà créé
  if new.role = 'client' and (
    exists (select 1 from public.user_roles where user_id = new.user_id and role = 'user')
    or exists (select 1 from public.recruiter_profiles where user_id = new.user_id)
  ) then
    raise exception 'ROLE_CONFLICT: ce compte est déjà un compte freelance' using errcode = 'P0001';
  end if;

  if new.role = 'user' and exists (
    select 1 from public.user_roles where user_id = new.user_id and role = 'client'
  ) then
    raise exception 'ROLE_CONFLICT: ce compte est déjà un compte client' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_exclusive_account_roles on public.user_roles;
create trigger enforce_exclusive_account_roles
  before insert or update of role on public.user_roles
  for each row execute function public.enforce_exclusive_account_roles();

-- Un client (hors admin) ne peut pas se créer de profil freelance.
create or replace function public.prevent_client_recruiter_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is not null
     and public.has_role(new.user_id, 'client')
     and not public.has_role(new.user_id, 'admin') then
    raise exception 'ROLE_CONFLICT: ce compte est déjà un compte client' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_client_recruiter_profile on public.recruiter_profiles;
create trigger prevent_client_recruiter_profile
  before insert on public.recruiter_profiles
  for each row execute function public.prevent_client_recruiter_profile();

-- Rattrapage : les freelances inscrits avant ce correctif n'ont jamais reçu le rôle 'user'.
insert into public.user_roles (user_id, role)
select distinct rp.user_id, 'user'::app_role
from public.recruiter_profiles rp
where rp.user_id is not null
  and not exists (select 1 from public.user_roles ur where ur.user_id = rp.user_id and ur.role in ('user', 'client'))
on conflict (user_id, role) do nothing;

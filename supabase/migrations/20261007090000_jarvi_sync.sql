-- Synchronisation des profils freelance vers Jarvi (ATS de Kistone), faite par la fonction
-- jarvi-sync : identifiant Jarvi du profil, date et erreur de la dernière synchro.
alter table public.recruiter_profiles
  add column if not exists jarvi_profile_id text,
  add column if not exists jarvi_synced_at timestamptz,
  add column if not exists jarvi_sync_error text;

-- Le freelance ne modifie ni les champs admin ni le suivi Jarvi ; le serveur (service role)
-- et l'admin, si.
create or replace function public.guard_recruiter_admin_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.has_role(auth.uid(), 'admin') then
    return new;
  end if;
  new.admin_rating     := old.admin_rating;
  new.admin_comments   := old.admin_comments;
  new.super_tam        := old.super_tam;
  new.jarvi_profile_id := old.jarvi_profile_id;
  new.jarvi_synced_at  := old.jarvi_synced_at;
  new.jarvi_sync_error := old.jarvi_sync_error;
  return new;
end;
$$;

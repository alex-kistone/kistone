-- Location du freelance, renseignée par l'admin à la qualification (ville, département, pays),
-- envoyée au champ Jarvi « Location » (lieu géocodé). Réservée à l'admin, comme la note.
alter table public.recruiter_profiles
  add column if not exists admin_location text check (char_length(admin_location) <= 200);

create or replace function public.guard_recruiter_admin_fields()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if auth.uid() is null or public.has_role(auth.uid(), 'admin') then
    return new;
  end if;
  new.admin_rating         := old.admin_rating;
  new.admin_comments       := old.admin_comments;
  new.admin_english_rating := old.admin_english_rating;
  new.admin_location       := old.admin_location;
  new.super_tam            := old.super_tam;
  new.tech_specialties     := old.tech_specialties;
  new.jarvi_profile_id     := old.jarvi_profile_id;
  new.jarvi_synced_at      := old.jarvi_synced_at;
  new.jarvi_sync_error     := old.jarvi_sync_error;
  return new;
end;
$function$;

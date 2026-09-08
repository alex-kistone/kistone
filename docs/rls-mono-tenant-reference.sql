-- ============================================================================
-- Kistone RPO — Row-Level Security
-- Trois rôles : admin (Gotam), client (entreprise), freelance (recruteur indé).
-- Principe : le client ne voit JAMAIS la table recruiter_profiles en direct.
-- Il ne voit que des suggestions anonymisées ; l'identité n'est révélée qu'au
-- statut 'validated'.
-- ============================================================================

alter table public.user_roles          enable row level security;
alter table public.recruiter_profiles  enable row level security;
alter table public.client_profiles     enable row level security;
alter table public.client_needs        enable row level security;
alter table public.profile_suggestions enable row level security;
alter table public.need_applications   enable row level security;
alter table public.missions            enable row level security;
alter table public.specialties         enable row level security;

-- ── user_roles ──────────────────────────────────────────────────────────────
-- Lecture de son propre rôle ; seul l'admin attribue les rôles.
drop policy if exists ur_select on public.user_roles;
create policy ur_select on public.user_roles
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists ur_admin_write on public.user_roles;
create policy ur_admin_write on public.user_roles
  for all using (public.is_admin()) with check (public.is_admin());

-- ── recruiter_profiles ──────────────────────────────────────────────────────
drop policy if exists rp_select on public.recruiter_profiles;
create policy rp_select on public.recruiter_profiles
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists rp_insert on public.recruiter_profiles;
create policy rp_insert on public.recruiter_profiles
  for insert with check (user_id = auth.uid());

-- Le freelance édite son profil mais PAS sa qualification interne : les colonnes
-- admin_rating / admin_comments / super_tam sont protégées par le trigger
-- guard_recruiter_admin_fields ci-dessous (Postgres n'a pas de RLS par colonne).
drop policy if exists rp_update on public.recruiter_profiles;
create policy rp_update on public.recruiter_profiles
  for update using (user_id = auth.uid() or public.is_admin())
  with check  (user_id = auth.uid() or public.is_admin());

drop policy if exists rp_admin_delete on public.recruiter_profiles;
create policy rp_admin_delete on public.recruiter_profiles
  for delete using (public.is_admin());

create or replace function public.guard_recruiter_admin_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then return new; end if;
  new.admin_rating   := old.admin_rating;
  new.admin_comments := old.admin_comments;
  new.super_tam      := old.super_tam;
  return new;
end;
$$;

drop trigger if exists guard_admin_fields on public.recruiter_profiles;
create trigger guard_admin_fields before update on public.recruiter_profiles
  for each row execute function public.guard_recruiter_admin_fields();

-- ── client_profiles ─────────────────────────────────────────────────────────
drop policy if exists cp_select on public.client_profiles;
create policy cp_select on public.client_profiles
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists cp_insert on public.client_profiles;
create policy cp_insert on public.client_profiles
  for insert with check (user_id = auth.uid());

drop policy if exists cp_update on public.client_profiles;
create policy cp_update on public.client_profiles
  for update using (user_id = auth.uid() or public.is_admin())
  with check  (user_id = auth.uid() or public.is_admin());

-- ── client_needs ────────────────────────────────────────────────────────────
-- Le freelance ne passe PAS par cette table (elle contient company_name et les
-- coordonnées du contact) : il lit la vue public.open_needs.
drop policy if exists cn_select on public.client_needs;
create policy cn_select on public.client_needs
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists cn_insert on public.client_needs;
create policy cn_insert on public.client_needs
  for insert with check (user_id = auth.uid() and public.has_role(auth.uid(), 'client'));

drop policy if exists cn_update on public.client_needs;
create policy cn_update on public.client_needs
  for update using (user_id = auth.uid() or public.is_admin())
  with check  (user_id = auth.uid() or public.is_admin());

drop policy if exists cn_delete on public.client_needs;
create policy cn_delete on public.client_needs
  for delete using (user_id = auth.uid() or public.is_admin());

-- Vue anonymisée des besoins ouverts, destinée aux freelances.
-- Volontairement SECURITY DEFINER (défaut) : elle contourne la RLS de
-- client_needs et n'expose que des colonnes non identifiantes.
drop view if exists public.open_needs;
create view public.open_needs as
  select id, job_title, description, persona, profile_types, sectors,
         mission_location, remote_policy, budget_tjm_min, budget_tjm_max,
         start_date, duration_text, status, created_at
  from public.client_needs
  where status in ('open', 'matching');

grant select on public.open_needs to authenticated;

-- ── profile_suggestions ─────────────────────────────────────────────────────
-- admin : tout. client : les suggestions de SES besoins. freelance : les siennes.
drop policy if exists ps_select on public.profile_suggestions;
create policy ps_select on public.profile_suggestions
  for select using (
    public.is_admin()
    or need_id in (select id from public.client_needs where user_id = auth.uid())
    or recruiter_profile_id in (select id from public.recruiter_profiles where user_id = auth.uid())
  );

-- Écriture réservée à l'admin et à l'edge function (service role).
drop policy if exists ps_admin_write on public.profile_suggestions;
create policy ps_admin_write on public.profile_suggestions
  for all using (public.is_admin()) with check (public.is_admin());

-- Le client peut faire avancer le pipeline sur ses propres besoins.
drop policy if exists ps_client_update on public.profile_suggestions;
create policy ps_client_update on public.profile_suggestions
  for update using (need_id in (select id from public.client_needs where user_id = auth.uid()))
  with check  (need_id in (select id from public.client_needs where user_id = auth.uid()));

-- ── need_applications ───────────────────────────────────────────────────────
drop policy if exists na_select on public.need_applications;
create policy na_select on public.need_applications
  for select using (
    public.is_admin()
    or recruiter_profile_id in (select id from public.recruiter_profiles where user_id = auth.uid())
    or need_id in (select id from public.client_needs where user_id = auth.uid())
  );

drop policy if exists na_insert on public.need_applications;
create policy na_insert on public.need_applications
  for insert with check (
    recruiter_profile_id in (select id from public.recruiter_profiles where user_id = auth.uid())
  );

drop policy if exists na_admin_write on public.need_applications;
create policy na_admin_write on public.need_applications
  for all using (public.is_admin()) with check (public.is_admin());

-- ── missions ────────────────────────────────────────────────────────────────
drop policy if exists m_select on public.missions;
create policy m_select on public.missions
  for select using (
    public.is_admin()
    or recruiter_profile_id in (select id from public.recruiter_profiles where user_id = auth.uid())
    or need_id in (select id from public.client_needs where user_id = auth.uid())
  );

drop policy if exists m_admin_write on public.missions;
create policy m_admin_write on public.missions
  for all using (public.is_admin()) with check (public.is_admin());

-- ── specialties (référentiel) ───────────────────────────────────────────────
drop policy if exists sp_select on public.specialties;
create policy sp_select on public.specialties
  for select to authenticated using (true);

drop policy if exists sp_admin_write on public.specialties;
create policy sp_admin_write on public.specialties
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- Storage : photos de profil (publiques) et documents légaux (privés)
-- ============================================================================
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public)
  values ('documents', 'documents', false)
  on conflict (id) do nothing;

-- Chaque utilisateur écrit dans son propre dossier : documents/<uid>/rib.pdf
drop policy if exists avatars_read on storage.objects;
create policy avatars_read on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists avatars_write on storage.objects;
create policy avatars_write on storage.objects
  for all to authenticated
  using      (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists documents_own on storage.objects;
create policy documents_own on storage.objects
  for all to authenticated
  using      (bucket_id = 'documents' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()))
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

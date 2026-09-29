-- Phase 1 du module ADV (docs/plan-adv.md) : accord client, mise en place de la mission,
-- dossiers KYC des deux parties, contrats, démarrage.

-- ── Aides d'accès (security definer : client et freelance ne lisent pas missions) ──
create or replace function public.is_mission_client(_mission_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.missions m join public.client_needs cn on cn.id = m.need_id
    where m.id = _mission_id and cn.user_id = auth.uid()
  );
$$;

create or replace function public.is_mission_freelance(_mission_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.missions m join public.recruiter_profiles rp on rp.id = m.recruiter_profile_id
    where m.id = _mission_id and rp.user_id = auth.uid()
  );
$$;

-- ── 1. Accord du client sur un profil ─────────────────────────────────────────
-- Le client présélectionne, retient (accepted) ou écarte (rejected) un profil proposé
-- sur ses besoins ; il ne touche à rien d'autre (score, raisons, libellé).
drop policy if exists "Clients can update their own suggestions to shortlisted" on public.profile_suggestions;
drop policy if exists "Clients can move their own suggestions" on public.profile_suggestions;
create policy "Clients can move their own suggestions" on public.profile_suggestions
  for update to authenticated
  using (need_id in (select id from public.client_needs where user_id = auth.uid()))
  with check (
    need_id in (select id from public.client_needs where user_id = auth.uid())
    and pipeline_status in ('shortlisted', 'accepted', 'rejected')
  );

create or replace function public.guard_suggestion_client_update()
returns trigger language plpgsql security definer set search_path = public as $$
declare changed text[];
begin
  if public.has_role(auth.uid(), 'admin'::app_role) or auth.uid() is null then
    return new;
  end if;
  select coalesce(array_agg(n.key), '{}') into changed
  from jsonb_each(to_jsonb(new)) n
  where n.value is distinct from (to_jsonb(old) -> n.key);
  if not changed <@ array['pipeline_status', 'status_updated_at'] then
    raise exception 'Le client peut seulement faire avancer ou écarter un profil proposé';
  end if;
  return new;
end;
$$;
drop trigger if exists guard_suggestion_client_update on public.profile_suggestions;
create trigger guard_suggestion_client_update before update on public.profile_suggestions
  for each row execute function public.guard_suggestion_client_update();

-- ── 2. Dossiers KYC ──────────────────────────────────────────────────────────
-- Informations société : dans les profils. Freelance : SIRET, IBAN, BIC en plus.
alter table public.recruiter_profiles add column if not exists siret text;
alter table public.recruiter_profiles add column if not exists iban text;
alter table public.recruiter_profiles add column if not exists bic text;
-- Client : SIRET, TVA intracommunautaire, email de facturation.
alter table public.client_profiles add column if not exists siret text;
alter table public.client_profiles add column if not exists vat_number text;
alter table public.client_profiles add column if not exists billing_email text;

create table if not exists public.kyc_dossiers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  party text not null check (party in ('client', 'freelance')),
  status text not null default 'incomplete' check (status in ('incomplete', 'submitted', 'approved', 'rejected')),
  rejection_reason text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.kyc_dossiers enable row level security;

drop policy if exists "Owners can view their dossier" on public.kyc_dossiers;
create policy "Owners can view their dossier" on public.kyc_dossiers
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "Owners can submit their dossier" on public.kyc_dossiers;
create policy "Owners can submit their dossier" on public.kyc_dossiers
  for update to authenticated using (user_id = auth.uid() and status in ('incomplete', 'rejected'))
  with check (user_id = auth.uid() and status = 'submitted');
drop policy if exists "Admins can manage dossiers" on public.kyc_dossiers;
create policy "Admins can manage dossiers" on public.kyc_dossiers
  for all to authenticated using (public.has_role(auth.uid(), 'admin'::app_role))
  with check (public.has_role(auth.uid(), 'admin'::app_role));

-- Le titulaire ne fait qu'envoyer son dossier : la décision revient à l'admin.
create or replace function public.guard_kyc_dossier_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.has_role(auth.uid(), 'admin'::app_role) or auth.uid() is null then
    if new.status in ('approved', 'rejected') and new.status is distinct from old.status then
      new.reviewed_at := now();
      new.reviewed_by := auth.uid();
    end if;
    return new;
  end if;
  if new.party is distinct from old.party or new.rejection_reason is distinct from old.rejection_reason
     or new.reviewed_at is distinct from old.reviewed_at or new.reviewed_by is distinct from old.reviewed_by then
    raise exception 'Seul l''admin peut valider ou refuser un dossier';
  end if;
  new.submitted_at := now();
  return new;
end;
$$;
drop trigger if exists guard_kyc_dossier_update on public.kyc_dossiers;
create trigger guard_kyc_dossier_update before update on public.kyc_dossiers
  for each row execute function public.guard_kyc_dossier_update();
drop trigger if exists update_kyc_dossiers_updated_at on public.kyc_dossiers;
create trigger update_kyc_dossiers_updated_at before update on public.kyc_dossiers
  for each row execute function public.update_updated_at_column();

-- Pièces justificatives (fichiers dans le bucket privé admin-documents, dossier <user_id>/)
create table if not exists public.kyc_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('kbis', 'identity', 'rib', 'insurance', 'urssaf', 'other')),
  path text not null unique,
  file_name text not null,
  mime text,
  size integer,
  expires_at date,
  uploaded_at timestamptz not null default now()
);
create index if not exists kyc_documents_user_idx on public.kyc_documents (user_id);
alter table public.kyc_documents enable row level security;

-- Le titulaire lit toujours ses pièces, mais n'en ajoute ou n'en retire que tant que
-- son dossier est ouvert (ni envoyé, ni validé).
create or replace function public.kyc_dossier_is_open(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select not exists (select 1 from public.kyc_dossiers d where d.user_id = _user_id and d.status in ('submitted', 'approved'));
$$;
drop policy if exists "Owners manage documents of an open dossier" on public.kyc_documents;
drop policy if exists "Owners can view their documents" on public.kyc_documents;
create policy "Owners can view their documents" on public.kyc_documents
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "Owners can add documents to an open dossier" on public.kyc_documents;
create policy "Owners can add documents to an open dossier" on public.kyc_documents
  for insert to authenticated with check (user_id = auth.uid() and public.kyc_dossier_is_open(auth.uid()));
drop policy if exists "Owners can remove documents from an open dossier" on public.kyc_documents;
create policy "Owners can remove documents from an open dossier" on public.kyc_documents
  for delete to authenticated using (user_id = auth.uid() and public.kyc_dossier_is_open(auth.uid()));
drop policy if exists "Admins can manage documents" on public.kyc_documents;
create policy "Admins can manage documents" on public.kyc_documents
  for all to authenticated using (public.has_role(auth.uid(), 'admin'::app_role))
  with check (public.has_role(auth.uid(), 'admin'::app_role));

-- Le bucket admin-documents servait aux seuls freelances : ouvert à tout titulaire de dossier.
drop policy if exists "Freelancers can upload own admin documents" on storage.objects;
drop policy if exists "Freelancers can update own admin documents" on storage.objects;
drop policy if exists "Freelancers can delete own admin documents" on storage.objects;
drop policy if exists "Freelancers can view own admin documents" on storage.objects;
drop policy if exists "Owners can manage own admin documents" on storage.objects;
create policy "Owners can manage own admin documents" on storage.objects
  for all to authenticated
  using (bucket_id = 'admin-documents' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'admin-documents' and (storage.foldername(name))[1] = auth.uid()::text);

-- ── 3. Mission : mise en place ────────────────────────────────────────────────
alter table public.missions alter column status set default 'onboarding';

-- À la création d'une mission, on ouvre le dossier des deux parties (sauf s'il existe déjà).
create or replace function public.open_mission_dossiers()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.kyc_dossiers (user_id, party)
  select cn.user_id, 'client' from public.client_needs cn where cn.id = new.need_id
  on conflict (user_id) do nothing;
  insert into public.kyc_dossiers (user_id, party)
  select rp.user_id, 'freelance' from public.recruiter_profiles rp
  where rp.id = new.recruiter_profile_id and rp.user_id is not null
  on conflict (user_id) do nothing;
  return new;
end;
$$;
drop trigger if exists open_mission_dossiers on public.missions;
create trigger open_mission_dossiers after insert on public.missions
  for each row execute function public.open_mission_dossiers();

-- ── 4. Contrats ──────────────────────────────────────────────────────────────
-- Un contrat client et un contrat freelance par mission. Yousign : colonnes prévues,
-- branchées quand company_settings.yousign_enabled et la clé seront disponibles.
create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  party text not null check (party in ('client', 'freelance')),
  status text not null default 'draft' check (status in ('draft', 'sent', 'signed', 'declined', 'expired')),
  document_path text,
  signed_document_path text,
  yousign_request_id text,
  sent_at timestamptz,
  signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mission_id, party)
);
alter table public.contracts enable row level security;

drop policy if exists "Admins can manage contracts" on public.contracts;
create policy "Admins can manage contracts" on public.contracts
  for all to authenticated using (public.has_role(auth.uid(), 'admin'::app_role))
  with check (public.has_role(auth.uid(), 'admin'::app_role));
drop policy if exists "Parties can view their contract" on public.contracts;
create policy "Parties can view their contract" on public.contracts
  for select to authenticated using (
    (party = 'client' and public.is_mission_client(mission_id))
    or (party = 'freelance' and public.is_mission_freelance(mission_id))
  );
drop trigger if exists update_contracts_updated_at on public.contracts;
create trigger update_contracts_updated_at before update on public.contracts
  for each row execute function public.update_updated_at_column();

-- Fichiers : contracts/<mission_id>/<party>/<fichier>. Chaque partie ne lit que le sien.
drop policy if exists "Clients can view their contracts" on storage.objects;
drop policy if exists "Freelancers can view their contracts" on storage.objects;
drop policy if exists "Parties can view their contract files" on storage.objects;
create policy "Parties can view their contract files" on storage.objects
  for select to authenticated using (
    bucket_id = 'contracts' and (
      ((storage.foldername(name))[2] = 'client' and public.is_mission_client(((storage.foldername(name))[1])::uuid))
      or ((storage.foldername(name))[2] = 'freelance' and public.is_mission_freelance(((storage.foldername(name))[1])::uuid))
    )
  );

-- ── 5. Démarrage de la mission ───────────────────────────────────────────────
-- Réservé à l'admin : dossiers des deux parties validés et deux contrats signés.
create or replace function public.activate_mission(_mission_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  m record;
  missing text[] := '{}';
begin
  if not public.has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'Réservé à l''administration';
  end if;
  select mi.*, cn.user_id as client_uid, rp.user_id as freelance_uid into m
  from public.missions mi
  join public.client_needs cn on cn.id = mi.need_id
  join public.recruiter_profiles rp on rp.id = mi.recruiter_profile_id
  where mi.id = _mission_id;
  if m.id is null then raise exception 'Mission introuvable'; end if;
  if m.status <> 'onboarding' then raise exception 'La mission n''est pas en mise en place'; end if;

  if not exists (select 1 from public.kyc_dossiers where user_id = m.client_uid and status = 'approved') then
    missing := array_append(missing, 'dossier client');
  end if;
  if not exists (select 1 from public.kyc_dossiers where user_id = m.freelance_uid and status = 'approved') then
    missing := array_append(missing, 'dossier freelance');
  end if;
  if not exists (select 1 from public.contracts where mission_id = _mission_id and party = 'client' and status = 'signed') then
    missing := array_append(missing, 'contrat client');
  end if;
  if not exists (select 1 from public.contracts where mission_id = _mission_id and party = 'freelance' and status = 'signed') then
    missing := array_append(missing, 'contrat freelance');
  end if;
  if array_length(missing, 1) > 0 then
    raise exception 'Il manque : %', array_to_string(missing, ', ');
  end if;

  update public.missions set status = 'active' where id = _mission_id;
end;
$$;
revoke all on function public.activate_mission(uuid) from public, anon;
grant execute on function public.activate_mission(uuid) to authenticated;

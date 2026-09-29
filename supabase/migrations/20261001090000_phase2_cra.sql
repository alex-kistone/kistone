-- Phase 2 : CRA signés.
-- 1. Saisie encadrée : un CRA par mission et par mois, jours dans le mois et la période
--    de mission, total recalculé en base à l'envoi.
-- 2. Validation du client uniquement par signature (fonction cra-sign, service role) ;
--    le client peut seulement refuser, motif obligatoire. Validation de secours par l'admin.
-- 3. Taux figés à la validation, dans une table réservée à l'admin (pas de fuite de marge).
-- 4. Frais de mission rattachés au CRA, justificatif dans un bucket privé.
-- 5. Preuve de signature (PDF + empreinte SHA-256), codes à usage unique côté serveur.
-- 6. Relances quotidiennes (pg_cron → fonction remind-cra).

-- ── 1. CRA : colonnes, unicité, garde-fous ─────────────────────────────────────
alter table public.timesheets
  add column if not exists signed_at timestamptz,
  add column if not exists approval_method text check (approval_method in ('otp_email', 'admin')),
  add column if not exists admin_approval_reason text,
  add column if not exists client_reminded_at timestamptz;

create unique index if not exists timesheets_mission_month_key
  on public.timesheets (mission_id, year, month) where mission_id is not null;

-- Création par le freelance : sur sa mission en cours, pour un mois couvert par la mission
-- et déjà commencé ; les références sont recopiées depuis la mission.
create or replace function public.guard_timesheet_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare m record;
begin
  if auth.uid() is null or public.has_role(auth.uid(), 'admin'::app_role) then
    return new;
  end if;
  if new.mission_id is null or not public.is_mission_freelance(new.mission_id) then
    raise exception 'CRA : mission introuvable';
  end if;
  select * into m from public.missions where id = new.mission_id;
  if m.status <> 'active' then
    raise exception 'CRA : la mission n''est pas en cours';
  end if;
  if make_date(new.year, new.month, 1) > current_date
     or (make_date(new.year, new.month, 1) + interval '1 month' - interval '1 day')::date < m.start_date
     or (m.end_date is not null and make_date(new.year, new.month, 1) > m.end_date) then
    raise exception 'CRA : ce mois n''est pas couvert par la mission';
  end if;
  new.need_id := m.need_id;
  new.suggestion_id := m.suggestion_id;
  new.recruiter_profile_id := m.recruiter_profile_id;
  new.status := 'draft';
  new.total_days := 0;
  new.submitted_at := null;
  new.signed_at := null;
  new.approval_method := null;
  return new;
end;
$$;
drop trigger if exists guard_timesheet_insert_trg on public.timesheets;
create trigger guard_timesheet_insert_trg before insert on public.timesheets
  for each row execute function public.guard_timesheet_insert();

-- Mise à jour : qui peut changer quoi.
create or replace function public.enforce_timesheet_freelancer_update()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  changed text[];
  is_client boolean;
begin
  -- Service role (fonction cra-sign, relances) et admin : pas de restriction ici.
  if auth.uid() is null or public.has_role(auth.uid(), 'admin'::app_role) then
    return new;
  end if;

  select coalesce(array_agg(n.key), '{}') into changed
  from jsonb_each(to_jsonb(new)) n
  where n.value is distinct from (to_jsonb(old) -> n.key)
    and n.key <> 'updated_at';

  is_client := exists (select 1 from public.client_needs where id = old.need_id and user_id = auth.uid());

  if is_client then
    -- Le client refuse un CRA soumis (motif obligatoire). La validation passe par la signature.
    if not changed <@ array['status', 'client_reviewed_at', 'client_reviewed_by', 'client_comment', 'rejection_reason']
       or old.status <> 'submitted'
       or new.status <> 'client_rejected'
       or coalesce(trim(new.rejection_reason), '') = '' then
      raise exception 'Le client peut seulement refuser un CRA soumis, avec un motif ; la validation se fait par signature';
    end if;
    new.client_reviewed_at := now();
    new.client_reviewed_by := auth.uid();
    return new;
  end if;

  -- Freelance : saisie et envoi de son CRA, rien d'autre.
  if not changed <@ array['status', 'total_days', 'submitted_at', 'freelancer_comment', 'recruitments_count']
     or old.status not in ('draft', 'client_rejected')
     or new.status not in ('draft', 'submitted') then
    raise exception 'Le freelance peut seulement saisir et envoyer son CRA';
  end if;
  return new;
end;
$$;

-- Envoi : total recalculé depuis les jours saisis, jamais repris du navigateur.
-- (Nom choisi pour passer après enforce_timesheet_freelancer_update_trg.)
create or replace function public.prepare_timesheet_submission()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'submitted' and old.status is distinct from 'submitted' then
    select coalesce(sum(value), 0) into new.total_days from public.timesheet_days where timesheet_id = new.id;
    if new.total_days <= 0 then
      raise exception 'CRA vide : saisissez au moins un jour';
    end if;
    new.submitted_at := now();
    new.rejection_reason := null;
    new.client_reviewed_at := null;
    new.client_reviewed_by := null;
    new.client_reminded_at := null;
  elsif new.status in ('draft', 'client_rejected') then
    select coalesce(sum(value), 0) into new.total_days from public.timesheet_days where timesheet_id = new.id;
  end if;
  return new;
end;
$$;
drop trigger if exists timesheet_submission_trg on public.timesheets;
create trigger timesheet_submission_trg before update on public.timesheets
  for each row execute function public.prepare_timesheet_submission();

-- Politique client : il ne peut plus écrire que « client_rejected ».
drop policy if exists "Clients can review submitted timesheets" on public.timesheets;
create policy "Clients can reject submitted timesheets" on public.timesheets
  for update to authenticated
  using (need_id in (select id from public.client_needs where user_id = auth.uid()) and status = 'submitted')
  with check (need_id in (select id from public.client_needs where user_id = auth.uid()) and status = 'client_rejected');

-- Jours : dans le mois du CRA et dans la période de mission.
create or replace function public.guard_timesheet_day()
returns trigger language plpgsql security definer set search_path = public as $$
declare t record;
begin
  select ts.month, ts.year, m.start_date, m.end_date into t
  from public.timesheets ts left join public.missions m on m.id = ts.mission_id
  where ts.id = new.timesheet_id;
  if extract(month from new.day_date) <> t.month or extract(year from new.day_date) <> t.year then
    raise exception 'Jour hors du mois du CRA';
  end if;
  if t.start_date is not null and (new.day_date < t.start_date or (t.end_date is not null and new.day_date > t.end_date)) then
    raise exception 'Jour hors de la période de mission';
  end if;
  return new;
end;
$$;
drop trigger if exists guard_timesheet_day_trg on public.timesheet_days;
create trigger guard_timesheet_day_trg before insert or update on public.timesheet_days
  for each row execute function public.guard_timesheet_day();

-- ── 2. Frais de mission ────────────────────────────────────────────────────────
create table if not exists public.timesheet_expenses (
  id uuid primary key default gen_random_uuid(),
  timesheet_id uuid not null references public.timesheets(id) on delete cascade,
  expense_date date not null,
  category text not null check (category in ('transport', 'hebergement', 'repas', 'autre')),
  label text not null check (length(trim(label)) > 0),
  amount_ht numeric(10,2) not null check (amount_ht > 0),
  vat_amount numeric(10,2) not null default 0 check (vat_amount >= 0),
  receipt_path text,
  created_at timestamptz not null default now()
);
create index if not exists timesheet_expenses_ts_idx on public.timesheet_expenses (timesheet_id);
alter table public.timesheet_expenses enable row level security;

create or replace function public.timesheet_is_editable_by_me(_timesheet_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.timesheets ts join public.recruiter_profiles rp on rp.id = ts.recruiter_profile_id
    where ts.id = _timesheet_id and rp.user_id = auth.uid() and ts.status in ('draft', 'client_rejected')
  );
$$;

create or replace function public.can_view_timesheet(_timesheet_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'admin'::app_role) or exists (
    select 1 from public.timesheets ts
    left join public.recruiter_profiles rp on rp.id = ts.recruiter_profile_id
    left join public.client_needs cn on cn.id = ts.need_id
    where ts.id = _timesheet_id and (rp.user_id = auth.uid() or cn.user_id = auth.uid())
  );
$$;

drop policy if exists "Parties can view expenses" on public.timesheet_expenses;
create policy "Parties can view expenses" on public.timesheet_expenses
  for select to authenticated using (public.can_view_timesheet(timesheet_id));
drop policy if exists "Freelancers can add expenses to an open timesheet" on public.timesheet_expenses;
create policy "Freelancers can add expenses to an open timesheet" on public.timesheet_expenses
  for insert to authenticated with check (public.timesheet_is_editable_by_me(timesheet_id));
drop policy if exists "Freelancers can edit expenses of an open timesheet" on public.timesheet_expenses;
create policy "Freelancers can edit expenses of an open timesheet" on public.timesheet_expenses
  for update to authenticated using (public.timesheet_is_editable_by_me(timesheet_id))
  with check (public.timesheet_is_editable_by_me(timesheet_id));
drop policy if exists "Freelancers can remove expenses of an open timesheet" on public.timesheet_expenses;
create policy "Freelancers can remove expenses of an open timesheet" on public.timesheet_expenses
  for delete to authenticated using (public.timesheet_is_editable_by_me(timesheet_id));
drop policy if exists "Admins can manage expenses" on public.timesheet_expenses;
create policy "Admins can manage expenses" on public.timesheet_expenses
  for all to authenticated using (public.has_role(auth.uid(), 'admin'::app_role))
  with check (public.has_role(auth.uid(), 'admin'::app_role));
grant select, insert, update, delete on public.timesheet_expenses to authenticated;

-- Justificatifs : bucket privé, chemin <timesheet_id>/<fichier>.
insert into storage.buckets (id, name, public, file_size_limit)
values ('expense-receipts', 'expense-receipts', false, 10485760)
on conflict (id) do nothing;

drop policy if exists "Parties can read expense receipts" on storage.objects;
create policy "Parties can read expense receipts" on storage.objects
  for select to authenticated
  using (bucket_id = 'expense-receipts' and public.can_view_timesheet(((storage.foldername(name))[1])::uuid));
drop policy if exists "Freelancers can upload expense receipts" on storage.objects;
create policy "Freelancers can upload expense receipts" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'expense-receipts' and public.timesheet_is_editable_by_me(((storage.foldername(name))[1])::uuid));
drop policy if exists "Freelancers can remove expense receipts" on storage.objects;
create policy "Freelancers can remove expense receipts" on storage.objects
  for delete to authenticated
  using (bucket_id = 'expense-receipts' and public.timesheet_is_editable_by_me(((storage.foldername(name))[1])::uuid));
drop policy if exists "Admins can manage expense receipts" on storage.objects;
create policy "Admins can manage expense receipts" on storage.objects
  for all to authenticated
  using (bucket_id = 'expense-receipts' and public.has_role(auth.uid(), 'admin'::app_role))
  with check (bucket_id = 'expense-receipts' and public.has_role(auth.uid(), 'admin'::app_role));

-- ── 3. Taux figés à la validation (admin uniquement) ───────────────────────────
create table if not exists public.timesheet_rates (
  timesheet_id uuid primary key references public.timesheets(id) on delete cascade,
  client_tjm integer not null,
  freelance_tjm integer not null,
  total_days numeric not null,
  client_amount numeric(12,2) not null,
  freelance_amount numeric(12,2) not null,
  expenses_ht numeric(12,2) not null default 0,
  expenses_vat numeric(12,2) not null default 0,
  frozen_at timestamptz not null default now()
);
alter table public.timesheet_rates enable row level security;
drop policy if exists "Admins can view frozen rates" on public.timesheet_rates;
create policy "Admins can view frozen rates" on public.timesheet_rates
  for select to authenticated using (public.has_role(auth.uid(), 'admin'::app_role));
grant select on public.timesheet_rates to authenticated;

create or replace function public.freeze_timesheet_rates()
returns trigger language plpgsql security definer set search_path = public as $$
declare m record; ex record;
begin
  if new.status = 'client_approved' and old.status is distinct from 'client_approved' then
    select client_tjm, recruiter_tjm into m from public.missions where id = new.mission_id;
    if m is null then return new; end if;
    select coalesce(sum(amount_ht), 0) ht, coalesce(sum(vat_amount), 0) vat into ex
    from public.timesheet_expenses where timesheet_id = new.id;
    insert into public.timesheet_rates (timesheet_id, client_tjm, freelance_tjm, total_days,
      client_amount, freelance_amount, expenses_ht, expenses_vat, frozen_at)
    values (new.id, m.client_tjm, m.recruiter_tjm, new.total_days,
      new.total_days * m.client_tjm, new.total_days * m.recruiter_tjm, ex.ht, ex.vat, now())
    on conflict (timesheet_id) do update set
      client_tjm = excluded.client_tjm, freelance_tjm = excluded.freelance_tjm,
      total_days = excluded.total_days, client_amount = excluded.client_amount,
      freelance_amount = excluded.freelance_amount, expenses_ht = excluded.expenses_ht,
      expenses_vat = excluded.expenses_vat, frozen_at = excluded.frozen_at;
  end if;
  return new;
end;
$$;
drop trigger if exists freeze_timesheet_rates_trg on public.timesheets;
create trigger freeze_timesheet_rates_trg after update on public.timesheets
  for each row execute function public.freeze_timesheet_rates();

-- ── 4. Signature : codes (serveur uniquement) et preuves ───────────────────────
create table if not exists public.timesheet_signature_codes (
  id uuid primary key default gen_random_uuid(),
  timesheet_id uuid not null references public.timesheets(id) on delete cascade,
  signer_id uuid not null references auth.users(id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists timesheet_signature_codes_ts_idx
  on public.timesheet_signature_codes (timesheet_id, created_at desc);
alter table public.timesheet_signature_codes enable row level security;
-- Aucune politique : seul le service role y accède.

create table if not exists public.timesheet_signatures (
  id uuid primary key default gen_random_uuid(),
  timesheet_id uuid not null unique references public.timesheets(id) on delete cascade,
  signer_id uuid not null references auth.users(id) on delete restrict,
  signer_name text not null,
  signer_email text not null,
  method text not null check (method in ('otp_email', 'admin')),
  signed_at timestamptz not null default now(),
  ip text,
  user_agent text,
  document_path text not null,
  document_sha256 text not null,
  certificate jsonb not null default '{}'::jsonb
);
alter table public.timesheet_signatures enable row level security;
-- La preuve porte le TJM client : lisible par l'admin et le client, pas par le freelance.
drop policy if exists "Admins and clients can view signatures" on public.timesheet_signatures;
create policy "Admins and clients can view signatures" on public.timesheet_signatures
  for select to authenticated using (
    public.has_role(auth.uid(), 'admin'::app_role) or exists (
      select 1 from public.timesheets ts join public.client_needs cn on cn.id = ts.need_id
      where ts.id = timesheet_signatures.timesheet_id and cn.user_id = auth.uid()
    )
  );
grant select on public.timesheet_signatures to authenticated;

-- PDF de preuve : écrits par le service role, lus par URL signée depuis la fonction.
insert into storage.buckets (id, name, public, file_size_limit)
values ('timesheet-proofs', 'timesheet-proofs', false, 10485760)
on conflict (id) do nothing;

-- ── 5. Relances quotidiennes ───────────────────────────────────────────────────
-- L'URL du projet et le secret partagé sont lus dans le vault (clés « project_url » et
-- « cron_secret »), jamais écrits dans le code. Sans eux, l'appel échoue sans effet.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'remind-cra-daily') then
    perform cron.unschedule('remind-cra-daily');
  end if;
  perform cron.schedule('remind-cra-daily', '0 7 * * *', $cron$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/remind-cra',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
      ),
      body := '{}'::jsonb
    );
  $cron$);
end $$;

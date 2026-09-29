-- Phase 3 : facturation.
-- 1. Factures client : brouillon depuis un CRA validé (taux figés), émission avec numéro
--    chronologique sans trou (KS-AAAA-NNNN), figée une fois émise ; annulation par avoir
--    (AV-AAAA-NNNN) ; paiement ; relances. PDF produit par la fonction `invoices`.
-- 2. Factures freelance : déposées par le freelance sur un CRA validé, montant attendu
--    calculé en base (jours × TJM freelance + frais), validation, refus motivé, paiement.
-- 3. Coordonnées bancaires de Kistone pour les factures, relances quotidiennes (pg_cron).

-- ── 0. Paramètres ──────────────────────────────────────────────────────────────
alter table public.company_settings
  add column if not exists iban text,
  add column if not exists bic text,
  add column if not exists vat_rate numeric(5,2) not null default 20,
  add column if not exists invoice_prefix text not null default 'KS',
  add column if not exists credit_note_prefix text not null default 'AV';

-- Compteurs par type et par année, verrouillés à chaque émission (pas de trou, pas de doublon).
create table if not exists public.invoice_counters (
  kind text not null check (kind in ('invoice', 'credit_note')),
  year int not null,
  last_value int not null default 0,
  primary key (kind, year)
);
alter table public.invoice_counters enable row level security;
-- Aucune politique : manipulé seulement par les fonctions ci-dessous.

-- ── 1. Factures client ─────────────────────────────────────────────────────────
create table if not exists public.client_invoices (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'invoice' check (kind in ('invoice', 'credit_note')),
  number text unique,
  status text not null default 'draft' check (status in ('draft', 'issued', 'paid', 'cancelled')),
  timesheet_id uuid references public.timesheets(id) on delete restrict,
  mission_id uuid references public.missions(id) on delete restrict,
  client_user_id uuid not null references auth.users(id) on delete restrict,
  period_month int check (period_month between 1 and 12),
  period_year int,
  issue_date date,
  due_date date,
  -- Lignes : [{ label, quantity, unit, unit_price_ht, total_ht }]
  lines jsonb not null default '[]'::jsonb,
  total_ht numeric(12,2) not null default 0,
  vat_rate numeric(5,2) not null default 20,
  total_vat numeric(12,2) not null default 0,
  total_ttc numeric(12,2) not null default 0,
  seller jsonb,
  buyer jsonb,
  notes text,
  pdf_path text,
  pdf_sha256 text,
  paid_at date,
  paid_amount numeric(12,2),
  payment_reference text,
  credit_note_of uuid references public.client_invoices(id) on delete restrict,
  cancel_reason text,
  reminder_count int not null default 0,
  last_reminded_at timestamptz,
  pennylane_id text,
  pennylane_synced_at timestamptz,
  pennylane_error text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Un CRA n'a qu'une facture vivante (une facture annulée par avoir libère le CRA).
create unique index if not exists client_invoices_one_per_timesheet
  on public.client_invoices (timesheet_id) where kind = 'invoice' and status <> 'cancelled';
create index if not exists client_invoices_client_idx on public.client_invoices (client_user_id);

alter table public.client_invoices enable row level security;
drop policy if exists "Admins can manage client invoices" on public.client_invoices;
create policy "Admins can manage client invoices" on public.client_invoices
  for all to authenticated using (public.has_role(auth.uid(), 'admin'::app_role))
  with check (public.has_role(auth.uid(), 'admin'::app_role));
drop policy if exists "Clients can view their issued invoices" on public.client_invoices;
create policy "Clients can view their issued invoices" on public.client_invoices
  for select to authenticated using (client_user_id = auth.uid() and status <> 'draft');
grant select, insert, update, delete on public.client_invoices to authenticated;

drop trigger if exists update_client_invoices_updated_at on public.client_invoices;
create trigger update_client_invoices_updated_at before update on public.client_invoices
  for each row execute function public.update_updated_at_column();

-- Une facture émise est figée : seuls le paiement, l'annulation, le PDF, les relances et la
-- synchronisation comptable évoluent. Un brouillon seul peut être supprimé.
create or replace function public.guard_client_invoice()
returns trigger language plpgsql as $$
declare changed text[];
begin
  if tg_op = 'DELETE' then
    if old.status <> 'draft' then raise exception 'Une facture émise ne se supprime pas : faites un avoir'; end if;
    return old;
  end if;
  if old.status = 'draft' then return new; end if;
  select coalesce(array_agg(n.key), '{}') into changed
  from jsonb_each(to_jsonb(new)) n
  where n.value is distinct from (to_jsonb(old) -> n.key) and n.key <> 'updated_at';
  if not changed <@ array['status', 'paid_at', 'paid_amount', 'payment_reference', 'cancel_reason',
      'pdf_path', 'pdf_sha256', 'reminder_count', 'last_reminded_at',
      'pennylane_id', 'pennylane_synced_at', 'pennylane_error'] then
    raise exception 'Facture émise : seuls le paiement, l''annulation et le suivi peuvent changer';
  end if;
  if new.status = 'draft' then raise exception 'Une facture émise ne redevient pas un brouillon'; end if;
  if old.status = 'cancelled' and new.status <> 'cancelled' then raise exception 'Facture annulée'; end if;
  return new;
end;
$$;
drop trigger if exists guard_client_invoice_trg on public.client_invoices;
create trigger guard_client_invoice_trg before update or delete on public.client_invoices
  for each row execute function public.guard_client_invoice();

-- Brouillon depuis un CRA validé, à partir des taux figés.
create or replace function public.create_invoice_draft(_timesheet_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  ts record; r record; m record; cs record; client uuid; lines jsonb; ht numeric; new_id uuid;
  month_label text;
begin
  if not public.has_role(auth.uid(), 'admin'::app_role) then raise exception 'Réservé à l''administration'; end if;
  select * into ts from public.timesheets where id = _timesheet_id;
  if ts is null then raise exception 'CRA introuvable'; end if;
  if ts.status not in ('client_approved', 'admin_invoiced') then raise exception 'Le CRA doit être validé avant d''être facturé'; end if;
  select * into r from public.timesheet_rates where timesheet_id = _timesheet_id;
  if r is null then raise exception 'Taux non figés pour ce CRA'; end if;
  if exists (select 1 from public.client_invoices where timesheet_id = _timesheet_id and kind = 'invoice' and status <> 'cancelled') then
    raise exception 'Ce CRA a déjà une facture';
  end if;
  select * into m from public.missions where id = ts.mission_id;
  select user_id into client from public.client_needs where id = ts.need_id;
  select * into cs from public.company_settings where id = 1;
  month_label := (array['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'])[ts.month] || ' ' || ts.year;

  lines := jsonb_build_array(jsonb_build_object(
    'label', 'Prestation de recrutement — ' || m.title || ' — ' || month_label,
    'quantity', r.total_days, 'unit', 'jour', 'unit_price_ht', r.client_tjm, 'total_ht', r.client_amount));
  if r.expenses_ht > 0 then
    lines := lines || jsonb_build_object(
      'label', 'Frais de mission refacturés — ' || month_label,
      'quantity', 1, 'unit', 'forfait', 'unit_price_ht', r.expenses_ht, 'total_ht', r.expenses_ht);
  end if;
  ht := r.client_amount + r.expenses_ht;

  insert into public.client_invoices (kind, status, timesheet_id, mission_id, client_user_id, period_month, period_year,
    lines, total_ht, vat_rate, total_vat, total_ttc, created_by)
  values ('invoice', 'draft', _timesheet_id, ts.mission_id, client, ts.month, ts.year,
    lines, ht, coalesce(cs.vat_rate, 20), round(ht * coalesce(cs.vat_rate, 20) / 100, 2),
    ht + round(ht * coalesce(cs.vat_rate, 20) / 100, 2), auth.uid())
  returning id into new_id;
  return new_id;
end;
$$;

-- Numéro suivant (verrou sur le compteur de l'année).
create or replace function public.next_invoice_number(_kind text, _year int)
returns text language plpgsql security definer set search_path = public as $$
declare n int; prefix text;
begin
  insert into public.invoice_counters (kind, year, last_value) values (_kind, _year, 0) on conflict do nothing;
  update public.invoice_counters set last_value = last_value + 1
    where kind = _kind and year = _year returning last_value into n;
  select case when _kind = 'invoice' then invoice_prefix else credit_note_prefix end into prefix
    from public.company_settings where id = 1;
  return coalesce(prefix, case when _kind = 'invoice' then 'KS' else 'AV' end) || '-' || _year || '-' || lpad(n::text, 4, '0');
end;
$$;
revoke all on function public.next_invoice_number(text, int) from public, anon, authenticated;

-- Émission : numéro, dates, identités figées ; le CRA passe « facturé ».
create or replace function public.issue_client_invoice(_invoice_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare inv record; cs record; cp record; email text; num text;
begin
  if auth.uid() is not null and not public.has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'Réservé à l''administration';
  end if;
  select * into inv from public.client_invoices where id = _invoice_id for update;
  if inv is null then raise exception 'Facture introuvable'; end if;
  if inv.status <> 'draft' then raise exception 'Facture déjà émise'; end if;
  if inv.total_ht = 0 then raise exception 'Facture vide'; end if;
  select * into cs from public.company_settings where id = 1;
  select * into cp from public.client_profiles where user_id = inv.client_user_id;
  select u.email into email from auth.users u where u.id = inv.client_user_id;
  num := public.next_invoice_number(inv.kind, extract(year from current_date)::int);
  update public.client_invoices set
    number = num,
    status = 'issued',
    issue_date = current_date,
    due_date = case when inv.kind = 'invoice' then current_date + coalesce(cs.client_payment_terms_days, 30) else null end,
    seller = jsonb_build_object('legal_name', cs.legal_name, 'legal_form', cs.legal_form, 'siren', cs.siren,
      'vat_number', cs.vat_number, 'address', cs.address, 'contact_email', cs.contact_email,
      'iban', cs.iban, 'bic', cs.bic, 'payment_terms_days', cs.client_payment_terms_days),
    buyer = jsonb_build_object('company_name', cp.company_name, 'legal_form', cp.legal_form, 'siren', cp.siren,
      'siret', cp.siret, 'vat_number', cp.vat_number, 'address', cp.company_address,
      'billing_email', coalesce(nullif(cp.billing_email, ''), email))
  where id = _invoice_id;
  if inv.kind = 'invoice' and inv.timesheet_id is not null then
    update public.timesheets set status = 'admin_invoiced', admin_invoiced_at = now()
      where id = inv.timesheet_id and status = 'client_approved';
  end if;
  return num;
end;
$$;

-- Avoir : copie négative de la facture, émis aussitôt ; la facture est annulée et le CRA
-- redevient facturable.
create or replace function public.create_credit_note(_invoice_id uuid, _reason text)
returns uuid language plpgsql security definer set search_path = public as $$
declare inv record; new_id uuid; neg jsonb;
begin
  if auth.uid() is not null and not public.has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'Réservé à l''administration';
  end if;
  if coalesce(trim(_reason), '') = '' then raise exception 'Motif de l''avoir obligatoire'; end if;
  select * into inv from public.client_invoices where id = _invoice_id for update;
  if inv is null or inv.kind <> 'invoice' then raise exception 'Facture introuvable'; end if;
  if inv.status not in ('issued', 'paid') then raise exception 'Seule une facture émise peut faire l''objet d''un avoir'; end if;
  select coalesce(jsonb_agg(l || jsonb_build_object(
      'unit_price_ht', -(l->>'unit_price_ht')::numeric, 'total_ht', -(l->>'total_ht')::numeric)), '[]'::jsonb)
    into neg from jsonb_array_elements(inv.lines) l;
  insert into public.client_invoices (kind, status, timesheet_id, mission_id, client_user_id, period_month, period_year,
    lines, total_ht, vat_rate, total_vat, total_ttc, credit_note_of, notes, created_by)
  values ('credit_note', 'draft', inv.timesheet_id, inv.mission_id, inv.client_user_id, inv.period_month, inv.period_year,
    neg, -inv.total_ht, inv.vat_rate, -inv.total_vat, -inv.total_ttc, inv.id,
    'Avoir sur la facture ' || inv.number || ' : ' || trim(_reason), auth.uid())
  returning id into new_id;
  perform public.issue_client_invoice(new_id);
  update public.client_invoices set status = 'cancelled', cancel_reason = trim(_reason) where id = inv.id;
  if inv.timesheet_id is not null then
    update public.timesheets set status = 'client_approved', admin_invoiced_at = null
      where id = inv.timesheet_id and status = 'admin_invoiced';
  end if;
  return new_id;
end;
$$;

-- PDF des factures : bucket privé, chemin <client_user_id>/<numéro>.pdf, écrit par la fonction.
insert into storage.buckets (id, name, public, file_size_limit)
values ('invoices', 'invoices', false, 10485760)
on conflict (id) do nothing;
drop policy if exists "Clients can read their invoices" on storage.objects;
create policy "Clients can read their invoices" on storage.objects
  for select to authenticated
  using (bucket_id = 'invoices' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Admins can read invoices" on storage.objects;
create policy "Admins can read invoices" on storage.objects
  for select to authenticated
  using (bucket_id = 'invoices' and public.has_role(auth.uid(), 'admin'::app_role));

-- ── 2. Factures freelance ──────────────────────────────────────────────────────
create table if not exists public.freelance_invoices (
  id uuid primary key default gen_random_uuid(),
  timesheet_id uuid not null references public.timesheets(id) on delete restrict,
  mission_id uuid references public.missions(id) on delete restrict,
  freelance_user_id uuid not null references auth.users(id) on delete restrict,
  invoice_number text not null check (length(trim(invoice_number)) > 0),
  invoice_date date not null,
  amount_ht numeric(12,2) not null check (amount_ht > 0),
  vat_amount numeric(12,2) not null default 0 check (vat_amount >= 0),
  amount_ttc numeric(12,2) generated always as (amount_ht + vat_amount) stored,
  expected_ht numeric(12,2),
  file_path text not null,
  status text not null default 'submitted' check (status in ('submitted', 'approved', 'rejected', 'paid')),
  rejection_reason text,
  reviewed_at timestamptz,
  due_date date,
  paid_at date,
  payment_reference text,
  pennylane_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists freelance_invoices_one_per_timesheet on public.freelance_invoices (timesheet_id);
alter table public.freelance_invoices enable row level security;

create or replace function public.freelance_can_invoice(_timesheet_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.timesheets ts join public.recruiter_profiles rp on rp.id = ts.recruiter_profile_id
    where ts.id = _timesheet_id and rp.user_id = auth.uid() and ts.status in ('client_approved', 'admin_invoiced')
  );
$$;

drop policy if exists "Freelancers can view their invoices" on public.freelance_invoices;
create policy "Freelancers can view their invoices" on public.freelance_invoices
  for select to authenticated using (freelance_user_id = auth.uid());
drop policy if exists "Freelancers can submit an invoice" on public.freelance_invoices;
create policy "Freelancers can submit an invoice" on public.freelance_invoices
  for insert to authenticated with check (freelance_user_id = auth.uid() and public.freelance_can_invoice(timesheet_id));
drop policy if exists "Freelancers can correct a rejected invoice" on public.freelance_invoices;
create policy "Freelancers can correct a rejected invoice" on public.freelance_invoices
  for update to authenticated using (freelance_user_id = auth.uid() and status = 'rejected')
  with check (freelance_user_id = auth.uid());
drop policy if exists "Admins can manage freelance invoices" on public.freelance_invoices;
create policy "Admins can manage freelance invoices" on public.freelance_invoices
  for all to authenticated using (public.has_role(auth.uid(), 'admin'::app_role))
  with check (public.has_role(auth.uid(), 'admin'::app_role));
grant select, insert, update, delete on public.freelance_invoices to authenticated;

drop trigger if exists update_freelance_invoices_updated_at on public.freelance_invoices;
create trigger update_freelance_invoices_updated_at before update on public.freelance_invoices
  for each row execute function public.update_updated_at_column();

-- Dépôt et correction par le freelance : montant attendu calculé en base, statut « envoyée »,
-- échéance selon les conditions de paiement ; il ne touche ni au statut ni au paiement.
create or replace function public.guard_freelance_invoice()
returns trigger language plpgsql security definer set search_path = public as $$
declare r record; terms int;
begin
  if auth.uid() is null or public.has_role(auth.uid(), 'admin'::app_role) then
    if new.status = 'approved' and old.status is distinct from 'approved' then new.reviewed_at := now(); end if;
    if new.status = 'rejected' and coalesce(trim(new.rejection_reason), '') = '' then
      raise exception 'Motif du refus obligatoire';
    end if;
    return new;
  end if;
  if tg_op = 'UPDATE' and (new.timesheet_id <> old.timesheet_id or new.freelance_user_id <> old.freelance_user_id) then
    raise exception 'Facture : CRA non modifiable';
  end if;
  select * into r from public.timesheet_rates where timesheet_id = new.timesheet_id;
  select freelance_payment_terms_days into terms from public.company_settings where id = 1;
  new.expected_ht := case when r is null then null else r.freelance_amount + r.expenses_ht end;
  new.mission_id := (select mission_id from public.timesheets where id = new.timesheet_id);
  new.status := 'submitted';
  new.rejection_reason := null;
  new.reviewed_at := null;
  new.paid_at := null;
  new.payment_reference := null;
  new.due_date := current_date + coalesce(terms, 30);
  return new;
end;
$$;
drop trigger if exists guard_freelance_invoice_trg on public.freelance_invoices;
create trigger guard_freelance_invoice_trg before insert or update on public.freelance_invoices
  for each row execute function public.guard_freelance_invoice();

-- Fichiers : bucket privé, chemin <freelance_user_id>/<timesheet_id>/<fichier>.
insert into storage.buckets (id, name, public, file_size_limit)
values ('freelance-invoices', 'freelance-invoices', false, 10485760)
on conflict (id) do nothing;
drop policy if exists "Freelancers can upload their invoices" on storage.objects;
create policy "Freelancers can upload their invoices" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'freelance-invoices' and (storage.foldername(name))[1] = auth.uid()::text
    and public.freelance_can_invoice(((storage.foldername(name))[2])::uuid));
drop policy if exists "Freelancers can read their invoices" on storage.objects;
create policy "Freelancers can read their invoices" on storage.objects
  for select to authenticated
  using (bucket_id = 'freelance-invoices' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Admins can manage freelance invoice files" on storage.objects;
create policy "Admins can manage freelance invoice files" on storage.objects
  for all to authenticated
  using (bucket_id = 'freelance-invoices' and public.has_role(auth.uid(), 'admin'::app_role))
  with check (bucket_id = 'freelance-invoices' and public.has_role(auth.uid(), 'admin'::app_role));

-- ── 3. Relances de paiement (chaque matin, après les CRA) ──────────────────────
do $$
begin
  if exists (select 1 from cron.job where jobname = 'remind-invoices-daily') then
    perform cron.unschedule('remind-invoices-daily');
  end if;
  perform cron.schedule('remind-invoices-daily', '10 7 * * *', $cron$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/remind-invoices',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
      ),
      body := '{}'::jsonb
    );
  $cron$);
end $$;

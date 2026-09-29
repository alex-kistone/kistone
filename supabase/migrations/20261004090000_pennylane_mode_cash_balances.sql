-- Facturation en mode Pennylane (décision d'Alex, 2026-09-29) : les factures client sont
-- émises et numérotées dans Pennylane ; la plateforme prépare le montant depuis le CRA,
-- enregistre le numéro Pennylane (à la main tant que l'API n'est pas branchée) et suit le
-- paiement. Les factures freelance reçues par mail peuvent être déposées par l'admin.
-- Trésorerie : soldes bancaires de référence enregistrés en base.

-- ── 1. Mode de facturation ─────────────────────────────────────────────────────
alter table public.company_settings
  add column if not exists invoicing_mode text not null default 'pennylane'
    check (invoicing_mode in ('pennylane', 'platform'));

alter table public.client_invoices
  add column if not exists source text not null default 'platform' check (source in ('platform', 'pennylane'));

-- Enregistre une facture émise dans Pennylane pour un brouillon préparé par la plateforme.
create or replace function public.record_external_invoice(_invoice_id uuid, _number text, _issue_date date, _due_date date)
returns void language plpgsql security definer set search_path = public as $$
declare inv record; cs record; cp record; email text;
begin
  if auth.uid() is not null and not public.has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'Réservé à l''administration';
  end if;
  if coalesce(trim(_number), '') = '' then raise exception 'Numéro de facture Pennylane obligatoire'; end if;
  if _issue_date is null then raise exception 'Date d''émission obligatoire'; end if;
  select * into inv from public.client_invoices where id = _invoice_id for update;
  if inv is null then raise exception 'Facture introuvable'; end if;
  if inv.status <> 'draft' then raise exception 'Facture déjà enregistrée'; end if;
  if exists (select 1 from public.client_invoices where number = trim(_number)) then
    raise exception 'Ce numéro est déjà enregistré';
  end if;
  select * into cs from public.company_settings where id = 1;
  select * into cp from public.client_profiles where user_id = inv.client_user_id;
  select u.email into email from auth.users u where u.id = inv.client_user_id;
  update public.client_invoices set
    number = trim(_number),
    source = 'pennylane',
    status = 'issued',
    issue_date = _issue_date,
    due_date = coalesce(_due_date, _issue_date + coalesce(cs.client_payment_terms_days, 30)),
    seller = jsonb_build_object('legal_name', cs.legal_name, 'legal_form', cs.legal_form, 'siren', cs.siren,
      'vat_number', cs.vat_number, 'address', cs.address, 'iban', cs.iban, 'bic', cs.bic),
    buyer = jsonb_build_object('company_name', cp.company_name, 'siren', cp.siren, 'vat_number', cp.vat_number,
      'address', cp.company_address, 'billing_email', coalesce(nullif(cp.billing_email, ''), email))
  where id = _invoice_id;
  if inv.timesheet_id is not null then
    update public.timesheets set status = 'admin_invoiced', admin_invoiced_at = now()
      where id = inv.timesheet_id and status = 'client_approved';
  end if;
end;
$$;

-- Enregistre un avoir émis dans Pennylane : la facture est annulée, le CRA redevient facturable.
create or replace function public.record_external_credit_note(_invoice_id uuid, _number text, _issue_date date, _reason text)
returns uuid language plpgsql security definer set search_path = public as $$
declare inv record; new_id uuid; neg jsonb;
begin
  if auth.uid() is not null and not public.has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'Réservé à l''administration';
  end if;
  if coalesce(trim(_number), '') = '' then raise exception 'Numéro de l''avoir Pennylane obligatoire'; end if;
  if coalesce(trim(_reason), '') = '' then raise exception 'Motif de l''avoir obligatoire'; end if;
  select * into inv from public.client_invoices where id = _invoice_id for update;
  if inv is null or inv.kind <> 'invoice' then raise exception 'Facture introuvable'; end if;
  if inv.status not in ('issued', 'paid') then raise exception 'Seule une facture émise peut faire l''objet d''un avoir'; end if;
  if exists (select 1 from public.client_invoices where number = trim(_number)) then
    raise exception 'Ce numéro est déjà enregistré';
  end if;
  select coalesce(jsonb_agg(l || jsonb_build_object(
      'unit_price_ht', -(l->>'unit_price_ht')::numeric, 'total_ht', -(l->>'total_ht')::numeric)), '[]'::jsonb)
    into neg from jsonb_array_elements(inv.lines) l;
  insert into public.client_invoices (kind, status, source, number, issue_date, timesheet_id, mission_id, client_user_id,
    period_month, period_year, lines, total_ht, vat_rate, total_vat, total_ttc, credit_note_of, notes, seller, buyer, created_by)
  values ('credit_note', 'issued', 'pennylane', trim(_number), coalesce(_issue_date, current_date), inv.timesheet_id, inv.mission_id,
    inv.client_user_id, inv.period_month, inv.period_year, neg, -inv.total_ht, inv.vat_rate, -inv.total_vat, -inv.total_ttc,
    inv.id, 'Avoir sur la facture ' || inv.number || ' : ' || trim(_reason), inv.seller, inv.buyer, auth.uid())
  returning id into new_id;
  update public.client_invoices set status = 'cancelled', cancel_reason = trim(_reason) where id = inv.id;
  if inv.timesheet_id is not null then
    update public.timesheets set status = 'client_approved', admin_invoiced_at = null
      where id = inv.timesheet_id and status = 'admin_invoiced';
  end if;
  return new_id;
end;
$$;

-- PDF d'une facture Pennylane déposé par l'admin (chemin <client_user_id>/<fichier>).
drop policy if exists "Admins can upload invoices" on storage.objects;
create policy "Admins can upload invoices" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'invoices' and public.has_role(auth.uid(), 'admin'::app_role));
drop policy if exists "Admins can replace invoices" on storage.objects;
create policy "Admins can replace invoices" on storage.objects
  for update to authenticated
  using (bucket_id = 'invoices' and public.has_role(auth.uid(), 'admin'::app_role));

-- Notification au client quand une facture Pennylane est enregistrée : l'email part de
-- Pennylane, la plateforme ne fait qu'une notification interne (déjà le cas, email = false).

-- ── 2. Factures freelance déposées par l'admin ─────────────────────────────────
-- Montant attendu, mission et échéance calculés aussi quand l'admin dépose la facture.
create or replace function public.guard_freelance_invoice()
returns trigger language plpgsql security definer set search_path = public as $$
declare r record; terms int; is_admin boolean;
begin
  is_admin := auth.uid() is null or public.has_role(auth.uid(), 'admin'::app_role);
  if tg_op = 'INSERT' or (not is_admin) then
    select * into r from public.timesheet_rates where timesheet_id = new.timesheet_id;
    select freelance_payment_terms_days into terms from public.company_settings where id = 1;
    new.expected_ht := case when r is null then null else r.freelance_amount + r.expenses_ht end;
    new.mission_id := (select mission_id from public.timesheets where id = new.timesheet_id);
    if new.due_date is null or not is_admin then new.due_date := current_date + coalesce(terms, 30); end if;
  end if;
  if is_admin then
    if new.status = 'approved' and (tg_op = 'INSERT' or old.status is distinct from 'approved') then new.reviewed_at := now(); end if;
    if new.status = 'rejected' and coalesce(trim(new.rejection_reason), '') = '' then
      raise exception 'Motif du refus obligatoire';
    end if;
    return new;
  end if;
  if tg_op = 'UPDATE' and (new.timesheet_id <> old.timesheet_id or new.freelance_user_id <> old.freelance_user_id) then
    raise exception 'Facture : CRA non modifiable';
  end if;
  new.status := 'submitted';
  new.rejection_reason := null;
  new.reviewed_at := null;
  new.paid_at := null;
  new.payment_reference := null;
  return new;
end;
$$;

-- Pas d'alerte « à vérifier » quand l'admin dépose lui-même la facture.
create or replace function public.notify_on_freelance_invoice()
returns trigger language plpgsql security definer set search_path = public as $$
declare who text;
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then return new; end if;
  -- Facture déposée par l'admin lui-même (reçue par mail) : pas d'alerte aux admins.
  if new.status = 'submitted' and public.has_role(auth.uid(), 'admin'::app_role) then
    return new;
  elsif new.status = 'submitted' then
    select trim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')) into who from public.recruiter_profiles where user_id = new.freelance_user_id;
    perform public.notify_admins('freelance_invoice_submitted', 'Facture freelance à vérifier',
      coalesce(nullif(who, ''), 'Un freelance') || ' a déposé la facture ' || new.invoice_number || ' (' ||
        public.fr_money(new.amount_ht) || ' € HT' ||
        case when new.expected_ht is not null and new.amount_ht <> new.expected_ht then ', écart ' || case when new.amount_ht > new.expected_ht then '+' else '' end || public.fr_money(new.amount_ht - new.expected_ht) || ' €' else '' end || ').',
      '/dashboard?tab=invoices&view=freelances', true);
  elsif new.status = 'approved' then
    perform public.notify(new.freelance_user_id, 'freelance_invoice_approved', 'Facture validée',
      'Votre facture ' || new.invoice_number || ' est validée' ||
        coalesce(', règlement prévu au plus tard le ' || to_char(new.due_date, 'DD/MM/YYYY'), '') || '.', '/profile?tab=missions', true);
  elsif new.status = 'rejected' then
    perform public.notify(new.freelance_user_id, 'freelance_invoice_rejected', 'Facture à corriger',
      'Facture ' || new.invoice_number || coalesce(' : ' || new.rejection_reason, ''), '/profile?tab=missions', true);
  elsif new.status = 'paid' then
    perform public.notify(new.freelance_user_id, 'freelance_invoice_paid', 'Facture payée',
      'Votre facture ' || new.invoice_number || ' a été réglée' || coalesce(' le ' || to_char(new.paid_at, 'DD/MM/YYYY'), '') || '.',
      '/profile?tab=missions', true);
  end if;
  return new;
end;
$$;

-- ── 3. Trésorerie : soldes bancaires de référence ──────────────────────────────
create table if not exists public.cash_balances (
  month date primary key check (extract(day from month) = 1),
  amount numeric(14,2) not null,
  note text,
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.cash_balances enable row level security;
drop policy if exists "Admins can manage cash balances" on public.cash_balances;
create policy "Admins can manage cash balances" on public.cash_balances
  for all to authenticated using (public.has_role(auth.uid(), 'admin'::app_role))
  with check (public.has_role(auth.uid(), 'admin'::app_role));
grant select, insert, update, delete on public.cash_balances to authenticated;
drop trigger if exists update_cash_balances_updated_at on public.cash_balances;
create trigger update_cash_balances_updated_at before update on public.cash_balances
  for each row execute function public.update_updated_at_column();

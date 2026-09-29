-- Phase 4 : notifications et pilotage.
-- 1. Centre de notifications : une ligne par destinataire, créée par des déclencheurs sur
--    les événements des phases 1 à 3 ; lue par la cloche (temps réel), envoyée par email
--    par la fonction notify-dispatch (pg_cron, toutes les 5 minutes) quand `email` est vrai.
--    Les emails déjà envoyés ailleurs (profil proposé, code et validation de CRA, facture
--    émise) restent des notifications internes seulement (email = false).
-- 2. Frais fixes de Kistone, pour la trésorerie (admin uniquement).

-- ── 1. Notifications ───────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  link text,
  email boolean not null default true,
  email_status text check (email_status in ('sent', 'skipped', 'error')),
  email_sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
create index if not exists notifications_email_idx on public.notifications (created_at) where email and email_status is null;

alter table public.notifications enable row level security;
drop policy if exists "Users can read their notifications" on public.notifications;
create policy "Users can read their notifications" on public.notifications
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "Users can mark their notifications read" on public.notifications;
create policy "Users can mark their notifications read" on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "Users can delete their notifications" on public.notifications;
create policy "Users can delete their notifications" on public.notifications
  for delete to authenticated using (user_id = auth.uid());
grant select, update, delete on public.notifications to authenticated;

-- L'utilisateur ne change que read_at.
create or replace function public.guard_notification_update()
returns trigger language plpgsql as $$
begin
  if auth.uid() is not null and (to_jsonb(new) - 'read_at') is distinct from (to_jsonb(old) - 'read_at') then
    raise exception 'Seule la lecture d''une notification peut être modifiée';
  end if;
  return new;
end;
$$;
drop trigger if exists guard_notification_update_trg on public.notifications;
create trigger guard_notification_update_trg before update on public.notifications
  for each row execute function public.guard_notification_update();

-- Temps réel pour la cloche.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

create or replace function public.notify(_user_id uuid, _kind text, _title text, _body text, _link text, _email boolean default true)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, kind, title, body, link, email)
  select _user_id, _kind, _title, _body, _link, _email where _user_id is not null;
$$;
revoke all on function public.notify(uuid, text, text, text, text, boolean) from public, anon, authenticated;

create or replace function public.notify_admins(_kind text, _title text, _body text, _link text, _email boolean default true)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, kind, title, body, link, email)
  select ur.user_id, _kind, _title, _body, _link, _email from public.user_roles ur where ur.role = 'admin'::app_role;
$$;
revoke all on function public.notify_admins(text, text, text, text, boolean) from public, anon, authenticated;

create or replace function public.month_label(_m int, _y int)
returns text language sql immutable as $$
  select (array['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'])[_m] || ' ' || _y;
$$;

-- Montant « 2 436,00 » quelle que soit la locale du serveur.
create or replace function public.fr_money(_n numeric)
returns text language sql immutable as $$
  select regexp_replace(replace(to_char(_n, 'FM999999999990.00'), '.', ','), '(\d)(?=(\d{3})+,)', '\1 ', 'g');
$$;

-- Profil proposé au client (l'email part déjà via notify-suggestion).
create or replace function public.notify_on_suggestion()
returns trigger language plpgsql security definer set search_path = public as $$
declare n record;
begin
  select user_id, job_title into n from public.client_needs where id = new.need_id;
  perform public.notify(n.user_id, 'suggestion', 'Nouveau profil proposé',
    'Un profil vous est proposé pour « ' || coalesce(n.job_title, 'votre besoin') || ' ».',
    '/client/dashboard', false);
  return new;
end;
$$;
drop trigger if exists notify_on_suggestion_trg on public.profile_suggestions;
create trigger notify_on_suggestion_trg after insert on public.profile_suggestions
  for each row execute function public.notify_on_suggestion();

-- Dossiers.
create or replace function public.notify_on_kyc()
returns trigger language plpgsql security definer set search_path = public as $$
declare who text; link text;
begin
  if new.status is not distinct from old.status then return new; end if;
  link := case when new.party = 'freelance' then '/profile?tab=admin' else '/client/profile' end;
  if new.status = 'submitted' then
    select coalesce(nullif(trim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')), ''), company_name, 'Un compte') into who
      from (select first_name, last_name, company_name from public.recruiter_profiles where user_id = new.user_id
            union all select first_name, last_name, company_name from public.client_profiles where user_id = new.user_id) p limit 1;
    perform public.notify_admins('kyc_submitted', 'Dossier à vérifier',
      coalesce(who, 'Un compte') || ' (' || case when new.party = 'freelance' then 'freelance' else 'client' end || ') a envoyé son dossier.',
      '/dashboard?tab=kpi&dossier=' || new.user_id, true);
  elsif new.status = 'approved' then
    perform public.notify(new.user_id, 'kyc_approved', 'Dossier validé', 'Votre dossier administratif est validé.', link, true);
  elsif new.status = 'rejected' then
    perform public.notify(new.user_id, 'kyc_rejected', 'Dossier à corriger',
      coalesce('Motif : ' || new.rejection_reason, 'Votre dossier doit être corrigé.'), link, true);
  end if;
  return new;
end;
$$;
drop trigger if exists notify_on_kyc_trg on public.kyc_dossiers;
create trigger notify_on_kyc_trg after update on public.kyc_dossiers
  for each row execute function public.notify_on_kyc();

-- Missions : création (dossiers à compléter) et démarrage.
create or replace function public.notify_on_mission()
returns trigger language plpgsql security definer set search_path = public as $$
declare client uuid; free uuid;
begin
  select user_id into client from public.client_needs where id = new.need_id;
  select user_id into free from public.recruiter_profiles where id = new.recruiter_profile_id;
  if tg_op = 'INSERT' then
    perform public.notify(client, 'mission_created', 'Mission en préparation',
      '« ' || new.title || ' » : complétez votre dossier pour démarrer la mission.', '/client/dashboard?tab=missions', true);
    perform public.notify(free, 'mission_created', 'Nouvelle mission',
      '« ' || new.title || ' » chez ' || new.company_name || ' : complétez votre dossier pour démarrer.', '/profile?tab=missions', true);
  elsif new.status is distinct from old.status and new.status = 'active' then
    perform public.notify(client, 'mission_started', 'Mission démarrée', '« ' || new.title || ' » est en cours.', '/client/dashboard?tab=missions', true);
    perform public.notify(free, 'mission_started', 'Mission démarrée',
      '« ' || new.title || ' » est en cours : pensez à saisir votre CRA chaque mois.', '/profile?tab=missions', true);
  end if;
  return new;
end;
$$;
drop trigger if exists notify_on_mission_trg on public.missions;
create trigger notify_on_mission_trg after insert or update on public.missions
  for each row execute function public.notify_on_mission();

-- CRA.
create or replace function public.notify_on_timesheet()
returns trigger language plpgsql security definer set search_path = public as $$
declare client uuid; free uuid; label text;
begin
  if new.status is not distinct from old.status then return new; end if;
  select user_id into client from public.client_needs where id = new.need_id;
  select user_id into free from public.recruiter_profiles where id = new.recruiter_profile_id;
  label := public.month_label(new.month, new.year);
  if new.status = 'submitted' then
    perform public.notify(client, 'cra_submitted', 'CRA à valider',
      'Le CRA de ' || label || ' (' || replace(new.total_days::text, '.', ',') || ' j) attend votre validation.',
      '/client/dashboard?tab=missions', true);
  elsif new.status = 'client_rejected' then
    perform public.notify(free, 'cra_rejected', 'CRA à corriger',
      'Le CRA de ' || label || ' a été refusé' || coalesce(' : ' || new.rejection_reason, '.'), '/profile?tab=missions', true);
  elsif new.status = 'client_approved' and old.status = 'submitted' then
    -- L'email de validation part déjà depuis cra-sign.
    perform public.notify(free, 'cra_approved', 'CRA validé',
      'Le CRA de ' || label || ' est validé : vous pouvez déposer votre facture.', '/profile?tab=missions', false);
    perform public.notify_admins('cra_approved', 'CRA validé, à facturer',
      'CRA de ' || label || ' validé (' || replace(new.total_days::text, '.', ',') || ' j).', '/dashboard?tab=invoices&view=to_invoice', false);
  end if;
  return new;
end;
$$;
drop trigger if exists notify_on_timesheet_trg on public.timesheets;
create trigger notify_on_timesheet_trg after update on public.timesheets
  for each row execute function public.notify_on_timesheet();

-- Factures client : émission (l'email part déjà avec le PDF) et paiement.
create or replace function public.notify_on_client_invoice()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is not distinct from old.status then return new; end if;
  if old.status = 'draft' and new.status = 'issued' then
    perform public.notify(new.client_user_id, 'invoice_issued',
      case when new.kind = 'credit_note' then 'Nouvel avoir ' else 'Nouvelle facture ' end || new.number,
      'Montant : ' || public.fr_money(new.total_ttc) || ' € TTC' ||
        case when new.due_date is not null then ', à régler avant le ' || to_char(new.due_date, 'DD/MM/YYYY') else '' end || '.',
      '/client/dashboard?tab=invoices', false);
  elsif new.status = 'paid' then
    perform public.notify(new.client_user_id, 'invoice_paid', 'Règlement reçu',
      'Merci : le règlement de la facture ' || new.number || ' est bien reçu.', '/client/dashboard?tab=invoices', false);
  end if;
  return new;
end;
$$;
drop trigger if exists notify_on_client_invoice_trg on public.client_invoices;
create trigger notify_on_client_invoice_trg after update on public.client_invoices
  for each row execute function public.notify_on_client_invoice();

-- Factures freelance.
create or replace function public.notify_on_freelance_invoice()
returns trigger language plpgsql security definer set search_path = public as $$
declare who text;
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then return new; end if;
  if new.status = 'submitted' then
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
drop trigger if exists notify_on_freelance_invoice_trg on public.freelance_invoices;
create trigger notify_on_freelance_invoice_trg after insert or update on public.freelance_invoices
  for each row execute function public.notify_on_freelance_invoice();

-- Envoi des emails en attente, toutes les 5 minutes.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'notify-dispatch') then
    perform cron.unschedule('notify-dispatch');
  end if;
  perform cron.schedule('notify-dispatch', '*/5 * * * *', $cron$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/notify-dispatch',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
      ),
      body := '{}'::jsonb
    );
  $cron$);
end $$;

-- ── 2. Frais fixes (trésorerie) ────────────────────────────────────────────────
create table if not exists public.fixed_costs (
  id uuid primary key default gen_random_uuid(),
  label text not null check (length(trim(label)) > 0),
  category text not null default 'autre' check (category in ('logiciels', 'assurances', 'comptabilite', 'locaux', 'salaires', 'marketing', 'banque', 'autre')),
  amount_ht numeric(12,2) not null check (amount_ht >= 0),
  vat_amount numeric(12,2) not null default 0 check (vat_amount >= 0),
  frequency text not null default 'monthly' check (frequency in ('monthly', 'quarterly', 'yearly', 'once')),
  start_date date not null default current_date,
  end_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.fixed_costs enable row level security;
drop policy if exists "Admins can manage fixed costs" on public.fixed_costs;
create policy "Admins can manage fixed costs" on public.fixed_costs
  for all to authenticated using (public.has_role(auth.uid(), 'admin'::app_role))
  with check (public.has_role(auth.uid(), 'admin'::app_role));
grant select, insert, update, delete on public.fixed_costs to authenticated;
drop trigger if exists update_fixed_costs_updated_at on public.fixed_costs;
create trigger update_fixed_costs_updated_at before update on public.fixed_costs
  for each row execute function public.update_updated_at_column();

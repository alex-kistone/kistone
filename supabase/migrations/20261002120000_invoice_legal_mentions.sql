-- Mentions légales des factures : capital social et ville du RCS de la société émettrice.
alter table public.company_settings
  add column if not exists share_capital numeric(14,2),
  add column if not exists rcs_city text;

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
      'share_capital', cs.share_capital, 'rcs_city', cs.rcs_city,
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

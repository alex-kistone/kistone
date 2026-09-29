-- Notifications de CRA : titre de la mission dans le message et jours sans décimale inutile
-- (« 2 j » au lieu de « 2,0 j »), pour savoir de quelle mission il s'agit sans ouvrir la cloche.
create or replace function public.notify_on_timesheet()
returns trigger language plpgsql security definer set search_path = public as $$
declare client uuid; free uuid; label text; days text; title text;
begin
  if new.status is not distinct from old.status then return new; end if;
  select user_id into client from public.client_needs where id = new.need_id;
  select user_id into free from public.recruiter_profiles where id = new.recruiter_profile_id;
  label := public.month_label(new.month, new.year);
  days := regexp_replace(regexp_replace(new.total_days::text, '\.0+$', ''), '\.', ',');
  select m.title into title from public.missions m where m.id = new.mission_id;
  if new.status = 'submitted' then
    perform public.notify(client, 'cra_submitted', 'CRA à valider',
      'Le CRA de ' || label || coalesce(' pour « ' || title || ' »', '') || ' (' || days || ' j) attend votre validation.',
      '/client/dashboard?tab=missions', true);
  elsif new.status = 'client_rejected' then
    perform public.notify(free, 'cra_rejected', 'CRA à corriger',
      'Le CRA de ' || label || ' a été refusé' || coalesce(' : ' || new.rejection_reason, '.'), '/profile?tab=missions', true);
  elsif new.status = 'client_approved' and old.status = 'submitted' then
    -- L'email de validation part déjà depuis cra-sign.
    perform public.notify(free, 'cra_approved', 'CRA validé',
      'Le CRA de ' || label || ' est validé : vous pouvez déposer votre facture.', '/profile?tab=missions', false);
    perform public.notify_admins('cra_approved', 'CRA validé, à facturer',
      'CRA de ' || label || coalesce(' pour « ' || title || ' »', '') || ' validé (' || days || ' j).', '/dashboard?tab=invoices&view=to_invoice', false);
  end if;
  return new;
end;
$$;

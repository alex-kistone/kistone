-- 1. Le client ne fournit plus de Kbis : sa société est identifiée par ses informations
--    légales (SIRET, forme juridique, représentant). Le Kbis reste exigé des freelances.
-- 2. La liste des éléments manquants n'est lisible que par l'intéressé ou un admin.
-- 3. Relance d'un dossier par l'admin : notification + email avec un message libre.
--    Garder kyc_missing_items aligné avec src/lib/kyc.ts (REQUIRED_FIELDS, REQUIRED_DOCS).

create or replace function public.kyc_missing_items(_user_id uuid, _party text)
returns text[] language plpgsql stable security definer set search_path = public as $$
declare
  missing text[] := '{}';
  f record;
  today date := current_date;
begin
  if auth.uid() is not null and auth.uid() <> _user_id and not public.has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'Accès refusé';
  end if;
  if _party = 'freelance' then
    select company_name, legal_form, siret, company_address, iban, bic into f
    from public.recruiter_profiles where user_id = _user_id;
    if coalesce(trim(f.company_name), '') = '' then missing := array_append(missing, 'Raison sociale'); end if;
    if coalesce(trim(f.legal_form), '') = '' then missing := array_append(missing, 'Forme juridique'); end if;
    if coalesce(f.siret, '') !~ '^\d{14}$' then missing := array_append(missing, 'SIRET'); end if;
    if coalesce(trim(f.company_address), '') = '' then missing := array_append(missing, 'Adresse du siège'); end if;
    if coalesce(f.iban, '') !~ '^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$' then missing := array_append(missing, 'IBAN'); end if;
    if coalesce(trim(f.bic), '') = '' then missing := array_append(missing, 'BIC'); end if;
    if not exists (select 1 from public.kyc_documents where user_id = _user_id and kind = 'kbis') then missing := array_append(missing, 'Kbis'); end if;
    if not exists (select 1 from public.kyc_documents where user_id = _user_id and kind = 'identity') then missing := array_append(missing, 'Pièce d''identité'); end if;
    if not exists (select 1 from public.kyc_documents where user_id = _user_id and kind = 'rib') then missing := array_append(missing, 'RIB'); end if;
    if not exists (select 1 from public.kyc_documents where user_id = _user_id and kind = 'urssaf' and expires_at >= today) then missing := array_append(missing, 'Attestation URSSAF en cours de validité'); end if;
    if not exists (select 1 from public.kyc_documents where user_id = _user_id and kind = 'insurance' and expires_at >= today) then missing := array_append(missing, 'Assurance RC Pro en cours de validité'); end if;
  else
    select company_name, legal_form, siret, company_address, representative_name, representative_title, billing_email into f
    from public.client_profiles where user_id = _user_id;
    if coalesce(trim(f.company_name), '') = '' then missing := array_append(missing, 'Raison sociale'); end if;
    if coalesce(trim(f.legal_form), '') = '' then missing := array_append(missing, 'Forme juridique'); end if;
    if coalesce(f.siret, '') !~ '^\d{14}$' then missing := array_append(missing, 'SIRET'); end if;
    if coalesce(trim(f.company_address), '') = '' then missing := array_append(missing, 'Adresse du siège'); end if;
    if coalesce(trim(f.representative_name), '') = '' then missing := array_append(missing, 'Représentant légal'); end if;
    if coalesce(trim(f.representative_title), '') = '' then missing := array_append(missing, 'Qualité du représentant'); end if;
    if coalesce(trim(f.billing_email), '') = '' then missing := array_append(missing, 'Email de facturation'); end if;
  end if;
  return missing;
end;
$$;

create or replace function public.send_dossier_reminder(_user_id uuid, _party text, _title text, _message text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'Seul l''admin peut relancer un dossier';
  end if;
  if coalesce(trim(_message), '') = '' then
    raise exception 'Message vide';
  end if;
  perform public.notify(_user_id, 'kyc_reminder', coalesce(nullif(trim(_title), ''), 'Votre dossier est à compléter'),
    trim(_message), case when _party = 'client' then '/client/profile' else '/profile?tab=admin' end, true);
end;
$$;
revoke all on function public.send_dossier_reminder(uuid, text, text, text) from public, anon;
grant execute on function public.send_dossier_reminder(uuid, text, text, text) to authenticated;

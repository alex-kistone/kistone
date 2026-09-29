-- Un dossier ne peut être envoyé que complet : la règle ne dépend plus seulement de
-- l'écran. Mêmes exigences que src/lib/kyc.ts (REQUIRED_FIELDS, REQUIRED_DOCS) :
-- garder les deux listes alignées.

create or replace function public.kyc_missing_items(_user_id uuid, _party text)
returns text[] language plpgsql stable security definer set search_path = public as $$
declare
  missing text[] := '{}';
  f record;
  today date := current_date;
begin
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
    if not exists (select 1 from public.kyc_documents where user_id = _user_id and kind = 'kbis') then missing := array_append(missing, 'Kbis'); end if;
  end if;
  return missing;
end;
$$;

create or replace function public.guard_kyc_dossier_update()
returns trigger language plpgsql security definer set search_path = public as $$
declare missing text[];
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
  if new.status = 'submitted' then
    missing := public.kyc_missing_items(new.user_id, new.party);
    if array_length(missing, 1) > 0 then
      raise exception 'Dossier incomplet : %', array_to_string(missing, ', ');
    end if;
  end if;
  new.submitted_at := now();
  return new;
end;
$$;

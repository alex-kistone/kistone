-- Demandes de visio client → freelance (décision d'Alex, 2026-11-12).
-- Le client propose 1 à 3 créneaux de 30 minutes ; le freelance en accepte un ou refuse. À
-- l'acceptation, un lien de visio est créé (Jitsi pour l'instant ; Google Meet quand le compte
-- Google de Kistone sera connecté) et les deux reçoivent une notification avec email. Les
-- coordonnées (nom, email) ne sont échangées qu'une fois la visio acceptée (CGU, article 6).

create table if not exists public.meeting_requests (
  id uuid primary key default gen_random_uuid(),
  client_user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  recruiter_profile_id uuid not null references public.recruiter_profiles (id) on delete cascade,
  slots timestamptz[] not null check (array_length(slots, 1) between 1 and 3),
  duration_minutes integer not null default 30,
  message text check (char_length(message) <= 1000),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  chosen_slot timestamptz,
  meeting_url text,
  decline_reason text check (char_length(decline_reason) <= 500),
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

create index if not exists meeting_requests_client_idx on public.meeting_requests (client_user_id, created_at desc);
create index if not exists meeting_requests_freelance_idx on public.meeting_requests (recruiter_profile_id, created_at desc);
-- Une seule demande en attente par client et par freelance
create unique index if not exists meeting_requests_one_pending
  on public.meeting_requests (client_user_id, recruiter_profile_id) where status = 'pending';

alter table public.meeting_requests enable row level security;

drop policy if exists "Client, freelance et admin lisent la demande" on public.meeting_requests;
create policy "Client, freelance et admin lisent la demande" on public.meeting_requests
  for select to authenticated
  using (
    client_user_id = auth.uid()
    or exists (select 1 from public.recruiter_profiles p where p.id = recruiter_profile_id and p.user_id = auth.uid())
    or public.has_role(auth.uid(), 'admin')
  );

drop policy if exists "Le client crée sa demande" on public.meeting_requests;
create policy "Le client crée sa demande" on public.meeting_requests
  for insert to authenticated
  with check (
    client_user_id = auth.uid()
    and public.has_role(auth.uid(), 'client')
    and status = 'pending' and chosen_slot is null and meeting_url is null and responded_at is null
  );

grant select, insert on public.meeting_requests to authenticated;

-- Contrôles à la création : créneaux futurs (sous 60 jours), freelance qui a accepté les CGU,
-- 20 demandes au plus par client sur 24 h.
create or replace function public.check_meeting_request()
returns trigger language plpgsql security definer set search_path = public as $$
declare s timestamptz;
begin
  foreach s in array new.slots loop
    if s < now() + interval '2 hours' or s > now() + interval '60 days' then
      raise exception 'Chaque créneau doit être entre dans 2 heures et dans 60 jours.';
    end if;
  end loop;
  if not exists (
    select 1 from public.recruiter_profiles p join public.terms_acceptances t on t.user_id = p.user_id
    where p.id = new.recruiter_profile_id
  ) then
    raise exception 'Ce profil n''est pas disponible.';
  end if;
  if (select count(*) from public.meeting_requests m where m.client_user_id = new.client_user_id and m.created_at > now() - interval '24 hours') >= 20 then
    raise exception 'Trop de demandes de visio aujourd''hui : réessayez demain.';
  end if;
  return new;
end;
$$;
drop trigger if exists check_meeting_request_trg on public.meeting_requests;
create trigger check_meeting_request_trg before insert on public.meeting_requests
  for each row execute function public.check_meeting_request();

-- « mardi 18 novembre à 14h30 » (heure de Paris), quelle que soit la locale du serveur.
create or replace function public.fr_slot(_t timestamptz)
returns text language sql immutable as $$
  select (array['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'])[extract(dow from _t at time zone 'Europe/Paris')::int + 1]
    || ' ' || extract(day from _t at time zone 'Europe/Paris')::int
    || ' ' || (array['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'])[extract(month from _t at time zone 'Europe/Paris')::int]
    || ' à ' || to_char(_t at time zone 'Europe/Paris', 'HH24"h"MI');
$$;

-- Nouvelle demande : le freelance est prévenu (email), l'admin aussi (cloche seule).
create or replace function public.notify_on_meeting_request()
returns trigger language plpgsql security definer set search_path = public as $$
declare f record; c record;
begin
  select user_id, split_part(trim(first_name), ' ', 1) as first_name into f from public.recruiter_profiles where id = new.recruiter_profile_id;
  select company_name into c from public.client_profiles where user_id = new.client_user_id;
  perform public.notify(f.user_id, 'meeting_request', 'Demande de visio',
    coalesce(c.company_name, 'Une entreprise') || ' vous propose une visio de ' || new.duration_minutes || ' minutes. Choisissez un créneau ou déclinez depuis votre espace.',
    '/profile?tab=visios', true);
  perform public.notify_admins('meeting_request', 'Nouvelle demande de visio',
    coalesce(c.company_name, 'Un client') || ' propose une visio à ' || coalesce(f.first_name, 'un freelance') || '.', '/dashboard?tab=meetings', false);
  return new;
end;
$$;
drop trigger if exists notify_on_meeting_request_trg on public.meeting_requests;
create trigger notify_on_meeting_request_trg after insert on public.meeting_requests
  for each row execute function public.notify_on_meeting_request();

-- Réponse du freelance : un créneau parmi ceux proposés (acceptation), ou aucun (refus).
create or replace function public.respond_meeting_request(_id uuid, _slot timestamptz default null, _reason text default null)
returns public.meeting_requests
language plpgsql security definer set search_path = public as $$
declare r public.meeting_requests; f record;
begin
  select m.* into r from public.meeting_requests m
    join public.recruiter_profiles p on p.id = m.recruiter_profile_id
    where m.id = _id and p.user_id = auth.uid()
    for update of m;
  if not found then raise exception 'Demande introuvable.'; end if;
  if r.status <> 'pending' then raise exception 'Cette demande a déjà reçu une réponse.'; end if;
  select first_name, last_name, email into f from public.recruiter_profiles where id = r.recruiter_profile_id;

  if _slot is null then
    update public.meeting_requests set status = 'declined', decline_reason = nullif(trim(_reason), ''), responded_at = now()
      where id = _id returning * into r;
    perform public.notify(r.client_user_id, 'meeting_declined', 'Visio déclinée',
      split_part(trim(f.first_name), ' ', 1) || ' ne peut pas donner suite à votre demande de visio'
        || coalesce(' : « ' || r.decline_reason || ' »', '.') ,
      '/client/visios', true);
    return r;
  end if;

  if not (_slot = any (r.slots)) then raise exception 'Ce créneau ne fait pas partie de ceux proposés.'; end if;
  if _slot < now() then raise exception 'Ce créneau est passé.'; end if;

  update public.meeting_requests
    set status = 'accepted', chosen_slot = _slot, responded_at = now(),
        meeting_url = 'https://meet.jit.si/kistone-' || replace(gen_random_uuid()::text, '-', '')
    where id = _id returning * into r;
  perform public.notify(r.client_user_id, 'meeting_accepted', 'Visio confirmée',
    'Visio avec ' || trim(f.first_name) || ' ' || trim(f.last_name) || ' (' || coalesce(f.email, '') || ') le ' || public.fr_slot(_slot)
      || ' (heure de Paris). Lien : ' || r.meeting_url,
    '/client/visios', true);
  perform public.notify(auth.uid(), 'meeting_accepted', 'Visio confirmée',
    'Visio le ' || public.fr_slot(_slot) || ' (heure de Paris). Lien : ' || r.meeting_url,
    '/profile?tab=visios', true);
  return r;
end;
$$;
revoke all on function public.respond_meeting_request(uuid, timestamptz, text) from public, anon;
grant execute on function public.respond_meeting_request(uuid, timestamptz, text) to authenticated;

-- Annulation par le client (demande en attente ou visio confirmée à venir).
create or replace function public.cancel_meeting_request(_id uuid)
returns public.meeting_requests
language plpgsql security definer set search_path = public as $$
declare r public.meeting_requests; f uuid; c record;
begin
  select * into r from public.meeting_requests where id = _id and client_user_id = auth.uid() for update;
  if not found then raise exception 'Demande introuvable.'; end if;
  if r.status not in ('pending', 'accepted') then raise exception 'Cette demande ne peut plus être annulée.'; end if;
  update public.meeting_requests set status = 'cancelled', responded_at = coalesce(responded_at, now()) where id = _id returning * into r;
  select user_id into f from public.recruiter_profiles where id = r.recruiter_profile_id;
  select company_name into c from public.client_profiles where user_id = r.client_user_id;
  perform public.notify(f, 'meeting_cancelled', 'Visio annulée',
    coalesce(c.company_name, 'L''entreprise') || ' a annulé '
      || case when r.chosen_slot is not null then 'la visio du ' || public.fr_slot(r.chosen_slot) else 'sa demande de visio' end || '.',
    '/profile?tab=visios', true);
  return r;
end;
$$;
revoke all on function public.cancel_meeting_request(uuid) from public, anon;
grant execute on function public.cancel_meeting_request(uuid) to authenticated;

-- Demandes de l'utilisateur connecté avec les infos de l'autre partie. Le client voit le prénom,
-- la photo et le métier du freelance ; le nom et l'email une fois la visio acceptée. Le freelance
-- voit l'entreprise et le poste du client ; son nom et son email une fois la visio acceptée.
create or replace function public.my_meeting_requests()
returns setof jsonb
language sql stable security definer set search_path = public as $$
  select to_jsonb(m) || jsonb_build_object(
    'role', case when m.client_user_id = auth.uid() then 'client' when p.user_id = auth.uid() then 'freelance' else 'admin' end,
    'freelance', jsonb_build_object(
      'first_name', split_part(trim(p.first_name), ' ', 1),
      'last_name', case when m.status = 'accepted' then p.last_name end,
      'email', case when m.status = 'accepted' then p.email end,
      'photo_url', p.photo_url,
      'job_title', p.job_title
    ),
    'client', jsonb_build_object(
      'company_name', c.company_name,
      'job_title', c.job_title,
      'first_name', case when m.status = 'accepted' then c.first_name end,
      'last_name', case when m.status = 'accepted' then c.last_name end,
      'email', case when m.status = 'accepted' then coalesce(c.email, u.email) end
    )
  )
  from public.meeting_requests m
  join public.recruiter_profiles p on p.id = m.recruiter_profile_id
  left join public.client_profiles c on c.user_id = m.client_user_id
  left join auth.users u on u.id = m.client_user_id
  where m.client_user_id = auth.uid() or p.user_id = auth.uid() or public.has_role(auth.uid(), 'admin')
  order by m.created_at desc;
$$;
revoke all on function public.my_meeting_requests() from public, anon;
grant execute on function public.my_meeting_requests() to authenticated;

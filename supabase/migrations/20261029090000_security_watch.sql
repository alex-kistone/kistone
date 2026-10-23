-- Veille de sécurité (fonction security-watch) :
--   - alerte immédiate par email quand un compte devient admin ou qu'une suppression massive
--     touche une table sensible (10 lignes ou plus d'un coup) ;
--   - rapport chaque lundi : admins, événements de la semaine, inscriptions, tables sans RLS,
--     en-têtes de sécurité du site.
-- URL du projet et secret lus dans le coffre (« project_url », « cron_secret »).

create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('admin_granted', 'admin_revoked', 'mass_delete')),
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  notified_at timestamptz
);
alter table public.security_events enable row level security;
-- Aucune politique : lisible seulement par le service (fonction security-watch).

-- Appel immédiat de la fonction (asynchrone, pg_net) : l'alerte part dans la minute.
create or replace function public.security_watch_ping()
returns void language plpgsql security definer set search_path = public as $$
begin
  perform net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/security-watch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{"mode":"alert"}'::jsonb
  );
exception when others then
  -- Jamais bloquer l'opération surveillée : l'événement reste dans la table et part lundi
  raise warning 'security_watch_ping: %', sqlerrm;
end;
$$;

-- Rôle admin accordé ou retiré
create or replace function public.security_watch_roles()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op in ('INSERT', 'UPDATE') and new.role = 'admin' and (tg_op = 'INSERT' or old.role is distinct from 'admin') then
    insert into public.security_events (kind, detail) values ('admin_granted', jsonb_build_object(
      'user_id', new.user_id,
      'email', (select email from auth.users where id = new.user_id),
      'by', auth.uid()
    ));
    perform public.security_watch_ping();
  elsif tg_op in ('DELETE', 'UPDATE') and old.role = 'admin' and (tg_op = 'DELETE' or new.role is distinct from 'admin') then
    insert into public.security_events (kind, detail) values ('admin_revoked', jsonb_build_object(
      'user_id', old.user_id,
      'email', (select email from auth.users where id = old.user_id),
      'by', auth.uid()
    ));
    perform public.security_watch_ping();
  end if;
  return null;
end;
$$;

drop trigger if exists security_watch_roles on public.user_roles;
create trigger security_watch_roles
  after insert or update or delete on public.user_roles
  for each row execute function public.security_watch_roles();

-- Suppression massive : 10 lignes ou plus supprimées par une même requête
create or replace function public.security_watch_mass_delete()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  n integer;
begin
  select count(*) into n from deleted_rows;
  if n >= 10 then
    insert into public.security_events (kind, detail) values ('mass_delete', jsonb_build_object(
      'table', tg_table_name, 'rows', n, 'by', auth.uid()
    ));
    perform public.security_watch_ping();
  end if;
  return null;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'recruiter_profiles', 'client_profiles', 'client_needs', 'missions', 'contracts', 'user_roles',
    'kyc_documents', 'kyc_dossiers', 'timesheets', 'client_invoices', 'freelance_invoices',
    'messages', 'blog_posts', 'need_applications'
  ] loop
    execute format('drop trigger if exists security_watch_mass_delete on public.%I', t);
    execute format(
      'create trigger security_watch_mass_delete after delete on public.%I
         referencing old table as deleted_rows
         for each statement execute function public.security_watch_mass_delete()', t);
  end loop;
end $$;

-- Instantané pour le rapport hebdomadaire (réservé au service)
create or replace function public.security_snapshot()
returns jsonb language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'admins', coalesce((
      select jsonb_agg(jsonb_build_object('email', u.email, 'last_sign_in_at', u.last_sign_in_at) order by u.email)
      from public.user_roles r join auth.users u on u.id = r.user_id
      where r.role = 'admin'
    ), '[]'::jsonb),
    'tables_without_rls', coalesce((
      select jsonb_agg(c.relname order by c.relname)
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
    ), '[]'::jsonb),
    'signups_7d', (select count(*) from auth.users where created_at > now() - interval '7 days'),
    'signups_prev_7d', (select count(*) from auth.users where created_at between now() - interval '14 days' and now() - interval '7 days'),
    'events_7d', coalesce((
      select jsonb_agg(jsonb_build_object('kind', kind, 'detail', detail, 'created_at', created_at) order by created_at)
      from public.security_events where created_at > now() - interval '7 days'
    ), '[]'::jsonb)
  );
$$;
revoke all on function public.security_snapshot() from public, anon, authenticated;
revoke all on function public.security_watch_ping() from public, anon, authenticated;

-- Rapport chaque lundi à 9 h (heure de Paris en hiver)
do $$
begin
  if exists (select 1 from cron.job where jobname = 'security-watch-weekly') then
    perform cron.unschedule('security-watch-weekly');
  end if;
  perform cron.schedule('security-watch-weekly', '0 8 * * 1', $cron$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/security-watch',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
      ),
      body := '{"mode":"weekly"}'::jsonb
    );
  $cron$);
end $$;

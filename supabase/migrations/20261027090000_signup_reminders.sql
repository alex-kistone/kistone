-- Relance des freelances qui n'ont fait que l'étape LinkedIn (fonction remind-signup) :
-- deux rappels au plus, le lendemain puis trois jours plus tard.
alter table public.recruiter_profiles
  add column if not exists signup_reminders smallint not null default 0,
  add column if not exists signup_reminded_at timestamptz;

-- Tous les matins à 9 h (heure de Paris en hiver), comme les autres relances : URL du projet et
-- secret lus dans le coffre (« project_url », « cron_secret »).
do $$
begin
  if exists (select 1 from cron.job where jobname = 'remind-signup-daily') then
    perform cron.unschedule('remind-signup-daily');
  end if;
  perform cron.schedule('remind-signup-daily', '0 8 * * *', $cron$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/remind-signup',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
      ),
      body := '{}'::jsonb
    );
  $cron$);
end $$;

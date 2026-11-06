-- Collecte quotidienne du Radar CDI (6 h UTC). À exécuter à la main (SQL editor) quand le secret
-- THEIRSTACK_API_KEY est en place et que le forfait couvre ~80 crédits par jour.
-- URL du projet et secret partagé lus dans le vault (« project_url », « cron_secret »).
do $$
begin
  if exists (select 1 from cron.job where jobname = 'job-radar-daily') then
    perform cron.unschedule('job-radar-daily');
  end if;
  perform cron.schedule('job-radar-daily', '0 6 * * *', $cron$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/job-radar-refresh',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 120000
    );
  $cron$);
end $$;

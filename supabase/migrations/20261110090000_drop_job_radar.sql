-- Retrait du Radar CDI (décision d'Alex, 2026-11-10) : suppression de ses tables et de leurs
-- données (offres TheirStack, recherches des freelances).

drop table if exists public.job_radar_user_offers;
drop table if exists public.job_radar_runs;
drop table if exists public.job_radar_offers;

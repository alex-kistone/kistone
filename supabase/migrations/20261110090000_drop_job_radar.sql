-- Retrait du Radar CDI (décision d'Alex, 2026-11-10) : suppression de ses tables et de leurs
-- données (offres TheirStack, recherches des freelances).

-- La politique de lecture des offres s'appuie sur job_radar_user_offers : à retirer d'abord
drop policy if exists "Chacun lit les offres de ses recherches" on public.job_radar_offers;

drop table if exists public.job_radar_user_offers;
drop table if exists public.job_radar_runs;
drop table if exists public.job_radar_offers;

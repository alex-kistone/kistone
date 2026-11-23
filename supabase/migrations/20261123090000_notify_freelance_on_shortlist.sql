-- Le freelance n'est pas prévenu quand un client lance le matching (suggestion) : seulement quand
-- son profil est shortlisté pour un besoin (décision d'Alex, 2026-11-23). Notification et email,
-- sans le nom du client : l'équipe Kistone reprend la main pour la suite.

create or replace function public.notify_freelance_on_shortlist()
returns trigger language plpgsql security definer set search_path = public as $$
declare f uuid; n record;
begin
  if new.pipeline_status = 'shortlisted' and old.pipeline_status is distinct from 'shortlisted' then
    select user_id into f from public.recruiter_profiles where id = new.recruiter_profile_id;
    select job_title into n from public.client_needs where id = new.need_id;
    perform public.notify(f, 'shortlisted', 'Votre profil est shortlisté',
      'Un client s''intéresse à votre profil pour « ' || coalesce(n.job_title, 'une mission') || ' ». L''équipe Kistone vous contacte rapidement pour la suite.',
      '/profile', true);
  end if;
  return new;
end;
$$;

drop trigger if exists notify_freelance_on_shortlist_trg on public.profile_suggestions;
create trigger notify_freelance_on_shortlist_trg after update of pipeline_status on public.profile_suggestions
  for each row execute function public.notify_freelance_on_shortlist();

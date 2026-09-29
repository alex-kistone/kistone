-- Un besoin passe « staffed » (Pourvu) dès qu'une mission en découle, quel que soit l'écran
-- qui la crée, et redevient « active » si sa dernière mission vivante est annulée.
-- Jusqu'ici seul le dialogue de création de mission le faisait, côté navigateur.
create or replace function public.sync_need_status_from_missions()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' and new.status <> 'cancelled' then
    update public.client_needs set status = 'staffed'
      where id = new.need_id and status is distinct from 'closed' and status is distinct from 'staffed';
  elsif tg_op = 'UPDATE' and new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    if not exists (select 1 from public.missions where need_id = new.need_id and id <> new.id and status <> 'cancelled') then
      update public.client_needs set status = 'active' where id = new.need_id and status = 'staffed';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists sync_need_status_from_missions_trg on public.missions;
create trigger sync_need_status_from_missions_trg after insert or update on public.missions
  for each row execute function public.sync_need_status_from_missions();

-- Rattrapage des besoins qui ont déjà une mission.
update public.client_needs n set status = 'staffed'
where status is distinct from 'closed' and status is distinct from 'staffed'
  and exists (select 1 from public.missions m where m.need_id = n.id and m.status <> 'cancelled');

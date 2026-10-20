-- Articles du blog : rattachement aux familles de la plateforme depuis le pivot IA (2026-10-16).
-- L'ancienne contrainte n'acceptait que les fonctions C-Level (drh, cfo, cto…), ce qui bloquait
-- la création d'articles AI Engineer, AI Product et AI Leader. Anciennes valeurs ramenées à la
-- famille la plus proche, ou retirées.
alter table public.blog_posts drop constraint if exists blog_posts_vertical_check;

update public.blog_posts set vertical = case vertical
  when 'cto' then 'leader'
  when 'cdo' then 'leader'
  when 'cpo' then 'product'
  else null end
where vertical in ('drh', 'cfo', 'coo', 'cro', 'cto', 'cpo', 'cdo');

alter table public.blog_posts add constraint blog_posts_vertical_check
  check (vertical is null or vertical in ('rpo', 'engineer', 'product', 'leader'));

-- Brouillons créés le 2026-10-20, enregistrés sans famille en attendant cette contrainte
update public.blog_posts set vertical = 'engineer' where slug in ('tjm-ai-engineer-freelance', 'fiche-de-poste-ai-engineer') and vertical is null;
update public.blog_posts set vertical = 'leader' where slug in ('head-of-ai-fractional', 'ai-act-qui-pilote-la-conformite') and vertical is null;

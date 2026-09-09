-- Vérifie que la qualification interne (admin_rating, super_tam, admin_comments)
-- n'est modifiable que par un admin, alors que les champs du freelance restent
-- à sa main. La RLS de Postgres étant par ligne et non par colonne, c'est un
-- trigger qui porte cette règle : sans lui, la policy « je modifie mon profil »
-- laissait un freelance s'auto-noter 5 et s'attribuer le badge Super TAM.
--
--   docker exec -i $(docker ps --format '{{.Names}}' | grep '^supabase_db_') \
--     psql -U postgres -d postgres -f - < supabase/tests/guard_admin_fields.sql
--
-- Tout se joue dans une transaction annulée : la base ressort intacte.

begin;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values ('33333333-3333-3333-3333-333333333333','00000000-0000-0000-0000-000000000000','authenticated','authenticated','admin@test.io','x',now(),now(),now()),
       ('44444444-4444-4444-4444-444444444444','00000000-0000-0000-0000-000000000000','authenticated','authenticated','fl@test.io','x',now(),now(),now());

insert into public.user_roles (user_id, role) values ('33333333-3333-3333-3333-333333333333','admin');

insert into public.recruiter_profiles (user_id, first_name, last_name, email, tjm, skills, admin_rating, super_tam)
values ('44444444-4444-4444-4444-444444444444','Test','FL','fl@test.io',500,'{Tech}',2,false);

-- ── 1. Le freelance tente de se promouvoir ─────────────────────────────────
set local role authenticated;
set local request.jwt.claims = '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}';

update public.recruiter_profiles
   set admin_rating = 5, super_tam = true, admin_comments = 'je suis le meilleur', tjm = 550
 where email = 'fl@test.io';

reset role;
select case
         when admin_rating = 2 and super_tam = false and admin_comments is null and tjm = 550
         then 'OK   freelance : qualification verrouillee, TJM modifiable'
         else 'ECHEC freelance : rating='||admin_rating||' super_tam='||super_tam||' tjm='||tjm
       end as test_1
  from public.recruiter_profiles where email = 'fl@test.io';

-- ── 2. L'admin qualifie le profil (chemin d'AdminProfilePanel) ─────────────
set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';

update public.recruiter_profiles
   set admin_rating = 5, super_tam = true, admin_comments = 'Excellent'
 where email = 'fl@test.io';

reset role;
select case
         when admin_rating = 5 and super_tam = true and admin_comments = 'Excellent'
         then 'OK   admin     : qualification autorisee'
         else 'ECHEC admin     : rating='||admin_rating||' super_tam='||super_tam
       end as test_2
  from public.recruiter_profiles where email = 'fl@test.io';

rollback;

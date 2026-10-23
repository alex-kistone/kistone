-- « Data/IA » quitte les spécialités tech de l'admin (champ Jarvi « Spécialités RPO Tech ») :
-- Data/AI est un métier RPO choisi par le freelance (champ Jarvi « Spécialités RPO »), que les
-- fiches concernées ont déjà.
update public.recruiter_profiles
set skills = case when 'Data/AI' = any(skills) then skills else skills || array['Data/AI'] end,
    tech_specialties = array_remove(tech_specialties, 'Data/IA')
where 'Data/IA' = any(tech_specialties);

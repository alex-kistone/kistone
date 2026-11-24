/**
 * Tarification Kistone : prix coûtant, le prix client est le TJM du freelance (aucune marge
 * depuis novembre 2026 ; avant, + 20 %). Le taux reste paramétrable, arrondi à l'euro supérieur. Le calcul se fait en entiers pour éviter les
 * erreurs d'arrondi flottant (550 × 1,2 = 660,000…01 donnerait 661).
 * Chaque mission reste négociable : ses TJM sont saisis et figés à la création.
 */
export const MARGIN_PCT = 0;

/** Prix client estimé à partir du TJM du freelance. */
export const clientPrice = (freelanceTjm: number) => Math.ceil((freelanceTjm * (100 + MARGIN_PCT)) / 100);

/** TJM freelance correspondant à un budget client (affiché aux freelances), arrondi à l'euro inférieur. */
export const freelanceRate = (clientBudget: number) => Math.floor((clientBudget * 100) / (100 + MARGIN_PCT));

/**
 * Part Kistone annoncée (onboarding freelance, « Mes opportunités », page Tarifs) : 20 % du TJM
 * payé par le client, 80 % pour le freelance (décision d'Alex, 2026-11-24 ; avant : + 20 % sur le
 * TJM freelance). Négociée mission par mission par Alex : MARGIN_PCT reste à 0 dans les calculs.
 */
export const ANNOUNCED_MARGIN_PCT = 20;

/** Net freelance d'un budget client, part Kistone déduite (80 % du budget), à l'euro inférieur. */
export const freelanceNet = (clientBudget: number) => Math.floor((clientBudget * (100 - ANNOUNCED_MARGIN_PCT)) / 100);

/**
 * Prix client selon la répartition annoncée : le TJM du freelance représente 80 % du prix
 * (500 € → 625 €), à l'euro supérieur. Outils admin uniquement (création de mission, fiche
 * LinkedIn freelance) ; toujours modifiable à la main.
 */
export const announcedClientPrice = (freelanceTjm: number) => Math.ceil((freelanceTjm * 100) / (100 - ANNOUNCED_MARGIN_PCT));

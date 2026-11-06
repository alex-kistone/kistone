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

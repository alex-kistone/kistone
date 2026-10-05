/** Libellé de la date d'arrivée souhaitée d'un besoin (null = dès que possible). */
export function desiredStartLabel(desiredStart: string | null | undefined): string {
  if (!desiredStart) return "Dès que possible";
  const [y, m, d] = desiredStart.slice(0, 10).split("-").map(Number);
  return `À partir du ${new Date(y, m - 1, d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`;
}

/** Date du jour au format AAAA-MM-JJ (fuseau local), borne minimale du champ date. */
export const todayIso = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
};

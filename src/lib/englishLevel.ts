/**
 * Niveau d'anglais requis par un besoin : même échelle 1 à 5 que la note d'anglais des
 * freelances (débutant, intermédiaire, avancé, courant, natif). Vide = non requis.
 */
export const ENGLISH_REQUIREMENTS: { value: number; label: string; hint: string }[] = [
  { value: 2, label: "Intermédiaire", hint: "lire et échanger simplement" },
  { value: 3, label: "Avancé", hint: "réunions et écrits en anglais" },
  { value: 4, label: "Courant", hint: "travail au quotidien en anglais" },
  { value: 5, label: "Natif ou bilingue", hint: "équipe ou clients anglophones" },
];

export const englishLevelLabel = (level: number | null | undefined) =>
  level ? ENGLISH_REQUIREMENTS.find((e) => e.value === level)?.label ?? "Débutant" : "Non requis";

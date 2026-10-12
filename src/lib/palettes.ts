// Teintes des cartes Kistone (réalisations, cas d'usage, fiches recruteurs). Jamais roses.
export type Palette = { tint: string; accent: string; soft: string; ink: string };

export const palettes = {
  apricot: { tint: "#FBE6D4", accent: "#E07A3A", soft: "#FDF0E4", ink: "#94471A" }, // Onboarding
  blue:    { tint: "#DDE8F5", accent: "#3D7BD0", soft: "#EDF3FB", ink: "#1E4F8F" }, // Support salarié
  sage:    { tint: "#DCEEDF", accent: "#2F9A63", soft: "#ECF6EE", ink: "#1B6541" }, // Recrutement
  lilac:   { tint: "#E8E2F6", accent: "#7357D6", soft: "#F2EEFB", ink: "#4B35A0" }, // Budget RH
  sand:    { tint: "#F5ECCB", accent: "#C99A12", soft: "#FBF5E2", ink: "#6E5208" }, // Freelances
  teal:    { tint: "#D5EDEA", accent: "#1F8F87", soft: "#E8F5F3", ink: "#16615C" }, // Engagement
  olive:   { tint: "#E6EBD3", accent: "#7A8B2E", soft: "#F2F5E8", ink: "#4A5716" }, // Produit
  slate:   { tint: "#E1E5EC", accent: "#5B6B85", soft: "#EEF1F5", ink: "#34425A" }, // Data
} satisfies Record<string, Palette>;

export type PaletteName = keyof typeof palettes;

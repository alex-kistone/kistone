// Kistone Studio brand palette — amber-based
export const colors = {
  // amber spectrum
  amber: "#F59E0B",
  amberDeep: "#B45309",
  amberLight: "#FCD34D",
  amberSoft: "#FEF3C7",
  // warm neutrals
  cream: "#FFFBF2",
  sand: "#FBE8C8",
  peach: "#FFE0B5",
  // text / structure
  navy: "#1A1410",       // warm near-black
  textMuted: "#7A6A52",
  border: "#F0E4CD",
  white: "#FFFFFF",
  // accents kept (used in matching/contracts indicators)
  emerald: "#B87B1F",    // remap "emerald" to a warm gold so existing refs stay coherent
  sky: "#D97706",        // remap "sky" to a deep amber
  lavender: "#FFE9B8",   // remap to warm pastel
  pink: "#FFD9A8",       // warm pastel
  paleBlue: "#FFEBC2",   // warm pastel
  // legacy aliases (used in components labelled "fuchsia")
  fuchsia: "#D97706",
  fuchsiaDeep: "#B45309",
};

import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadBricolage } from "@remotion/google-fonts/BricolageGrotesque";

const interLoaded = loadInter("normal", { weights: ["400", "500", "600", "700"] });
const bricolageLoaded = loadBricolage("normal", { weights: ["600", "700", "800"] });

export const fontBody = interLoaded.fontFamily;
export const fontDisplay = bricolageLoaded.fontFamily;

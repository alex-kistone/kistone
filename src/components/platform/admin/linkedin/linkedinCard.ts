import { palettes } from "@/lib/palettes";
import { verticalOf } from "@/lib/verticals";

/** Une tuile d'information de la carte (valeur sur une ligne, unité rose facultative). */
export type CardTile = { label: string; value: string; unit?: string };

/** Contenu d'une carte LinkedIn Kistone, quel que soit le sujet (besoin, profil). */
export type CardSpec = {
  chip: string;
  vertical?: string | null;
  title: string;
  titleFallback: string;
  meta?: string;
  pitch?: string;
  tiles: CardTile[];
  cta: string;
  /** Photo ronde à côté de la pastille de fonction (le titre passe alors à deux lignes). */
  photo?: string | null;
};

const W = 1080;
const H = 1350;
const C = { bg: "#F5F1EA", ink: "#141312", muted: "#5E5A54", subtle: "#6B665F", pink: "#FF2E6E", border: "rgba(20,19,18,0.08)", watermark: "#E8E1D5", highlight: "rgba(255,46,110,0.28)" };

/** Tuile de prix : « 650 € » devient la valeur « 650 » et l'unité « € HT/j ». */
export const priceTile = (label: string, raw: string): CardTile => ({
  label,
  value: raw.replace(/\s*€.*$/, ""),
  unit: /€/.test(raw) ? "€ HT/j" : undefined,
});

/** Nom de fichier sans accents ni espaces. */
export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Expression qui trouve un nom comme mot entier (« Marc » ne déclenche pas « marché »). */
export const wordRe = (term: string, flags = "iu") => new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(term)}(?![\\p{L}\\p{N}])`, flags);

/** Termes (noms, entreprises) qui apparaissent dans les champs de la carte. */
export function findLeaks(terms: (string | null | undefined)[], values: string[]): string[] {
  const clean = [...new Set(terms.map((t) => t?.trim()).filter((t): t is string => !!t && t.length > 1))];
  return clean.filter((t) => values.some((v) => wordRe(t).test(v)));
}

/** Découpe un texte en lignes qui tiennent dans maxWidth (avec « … » au-delà de maxLines). */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width <= maxWidth) line = test;
    else {
      if (line) lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1];
    while (ctx.measureText(`${last}…`).width > maxWidth && last.length > 1) last = last.slice(0, -1);
    kept[maxLines - 1] = `${last.trimEnd().replace(/[\s,;:·-]+$/, "")}…`;
    return kept;
  }
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((ok, ko) => {
    const i = new Image();
    // Photos du stockage Supabase : sans CORS, le canvas ne pourrait plus être exporté
    i.crossOrigin = "anonymous";
    i.onload = () => ok(i);
    i.onerror = ko;
    i.src = src;
  });

/** Dessine la carte (format portrait LinkedIn 1080 × 1350), dans la charte Kistone. */
export async function drawCard(canvas: HTMLCanvasElement, spec: CardSpec) {
  await Promise.all([
    document.fonts.load("700 96px Outfit"),
    document.fonts.load("600 44px Outfit"),
    document.fonts.load("400 34px Geist"),
    document.fonts.load("500 22px 'Geist Mono'"),
  ]).catch(() => undefined);
  const ctx = canvas.getContext("2d")!;
  canvas.width = W;
  canvas.height = H;
  const v = verticalOf(spec.vertical);
  const tint = palettes[v.palette];

  // Fond crème
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // Éclair au trait en filigrane, ton sur ton, qui déborde à droite
  ctx.save();
  ctx.translate(690, 150);
  ctx.rotate((14 * Math.PI) / 180);
  ctx.scale(1.15, 1.15);
  ctx.strokeStyle = C.watermark;
  ctx.lineWidth = 20;
  ctx.lineJoin = "miter";
  ctx.stroke(new Path2D("M38 560 L488 18 L318 398 M22 588 L346 416 L602 416 L280 588 Z M300 606 L132 1006 L590 444"));
  ctx.restore();

  const X = 88;
  const innerW = W - X * 2;

  // Logo et pastille sombre (« Mission freelance », « Profil disponible »)
  try {
    const logo = await loadImage("/logos/logo-full-black.png");
    const lh = 54;
    ctx.drawImage(logo, X, 88, (logo.width * lh) / logo.height, lh);
  } catch { /* logo indisponible : la carte reste lisible */ }
  ctx.font = "500 20px 'Geist Mono'";
  ctx.letterSpacing = "3px";
  const chip = spec.chip.toUpperCase();
  const chipW = ctx.measureText(chip).width + 74;
  roundRect(ctx, W - X - chipW, 92, chipW, 48, 24);
  ctx.fillStyle = C.ink;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(W - X - chipW + 28, 116, 6, 0, Math.PI * 2);
  ctx.fillStyle = C.pink;
  ctx.fill();
  ctx.fillStyle = C.bg;
  ctx.textBaseline = "middle";
  ctx.fillText(chip, W - X - chipW + 46, 117);

  // Photo ronde (facultative), puis la fonction (teinte de la fonction, jamais rose)
  let y = 270;
  let fnX = X;
  let photo: HTMLImageElement | null = null;
  if (spec.photo) photo = await loadImage(spec.photo).catch(() => null);
  if (photo) {
    const d = 136;
    const py = 214;
    const side = Math.min(photo.width, photo.height);
    ctx.save();
    ctx.beginPath();
    ctx.arc(X + d / 2, py + d / 2, d / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(photo, (photo.width - side) / 2, (photo.height - side) / 3, side, side, X, py, d, d);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(X + d / 2, py + d / 2, d / 2 + 3, 0, Math.PI * 2);
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 6;
    ctx.stroke();
    fnX = X + d + 28;
    y = py + d / 2;
  }
  ctx.font = "600 26px Geist";
  ctx.letterSpacing = "0px";
  const fn = `${v.short} · ${v.label}`;
  const fnW = ctx.measureText(fn).width + 44;
  roundRect(ctx, fnX, y - 26, fnW, 52, 26);
  ctx.fillStyle = tint.tint;
  ctx.fill();
  ctx.fillStyle = tint.ink;
  ctx.fillText(fn, fnX + 22, y + 1);
  if (photo) y = 330;

  // Titre : Outfit serré, dernière ligne surlignée
  y += 64;
  ctx.font = "700 104px Outfit";
  ctx.letterSpacing = "-4px";
  ctx.textBaseline = "alphabetic";
  const titleLines = wrap(ctx, spec.title || spec.titleFallback, innerW, photo ? 2 : 3);
  const lineH = 100;
  titleLines.forEach((line, i) => {
    const baseline = y + 88 + i * lineH;
    if (i === titleLines.length - 1) {
      const w = ctx.measureText(line).width;
      ctx.fillStyle = C.highlight;
      ctx.fillRect(X - 6, baseline - 26, w + 12, 26);
    }
    ctx.fillStyle = C.ink;
    ctx.fillText(line, X, baseline);
  });
  y += 88 + (titleLines.length - 1) * lineH;

  // Ligne d'information (secteur, expérience…)
  ctx.letterSpacing = "0px";
  if (spec.meta) {
    y += 64;
    ctx.font = "500 32px Geist";
    ctx.fillStyle = C.subtle;
    ctx.fillText(wrap(ctx, spec.meta, innerW, 1)[0], X, y);
  }

  // Accroche : deux lignes
  if (spec.pitch) {
    y += 70;
    ctx.font = "400 33px Geist";
    ctx.fillStyle = C.muted;
    wrap(ctx, spec.pitch, innerW, 2).forEach((line, i) => ctx.fillText(line, X, y + i * 48));
    y += 52;
  }

  // Quatre tuiles d'informations
  const gap = 24;
  const tileW = (innerW - gap) / 2;
  const tileH = 168;
  // Les tuiles s'ancrent au-dessus de l'appel à l'action (64 px de bouton + 56 px d'air)
  const gridY = H - 88 - 64 - 56 - (tileH * 2 + gap);
  spec.tiles.slice(0, 4).forEach((t, i) => {
    const tx = X + (i % 2) * (tileW + gap);
    const ty = gridY + Math.floor(i / 2) * (tileH + gap);
    roundRect(ctx, tx, ty, tileW, tileH, 28);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = "500 20px 'Geist Mono'";
    ctx.letterSpacing = "3px";
    ctx.fillStyle = C.subtle;
    ctx.fillText(t.label, tx + 32, ty + 54);
    ctx.letterSpacing = "-1px";
    ctx.font = "600 44px Outfit";
    ctx.fillStyle = C.ink;
    const value = wrap(ctx, t.value || "À définir", tileW - 64, 1)[0];
    ctx.fillText(value, tx + 32, ty + 120);
    if (t.unit) {
      const vw = ctx.measureText(value).width;
      ctx.font = "600 26px Outfit";
      ctx.fillStyle = C.pink;
      ctx.letterSpacing = "0px";
      ctx.fillText(` ${t.unit}`, tx + 32 + vw, ty + 120);
    }
  });

  // Appel à l'action et site
  const ctaY = H - 88 - 64;
  ctx.font = "600 28px Geist";
  ctx.letterSpacing = "0px";
  const ctaW = Math.min(ctx.measureText(spec.cta).width + 72, innerW - 220);
  roundRect(ctx, X, ctaY, ctaW, 64, 32);
  ctx.fillStyle = C.pink;
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.textBaseline = "middle";
  ctx.fillText(wrap(ctx, spec.cta, ctaW - 72, 1)[0] ?? "", X + 36, ctaY + 33);
  ctx.font = "500 22px 'Geist Mono'";
  ctx.letterSpacing = "3px";
  ctx.fillStyle = C.ink;
  const site = "KISTONE.FR";
  ctx.fillText(site, W - X - ctx.measureText(site).width, ctaY + 33);
  ctx.textBaseline = "alphabetic";
}

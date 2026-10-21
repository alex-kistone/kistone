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

const BOLT = "M38 560 L488 18 L318 398 M22 588 L346 416 L602 416 L280 588 Z M300 606 L132 1006 L590 444";
const TILE_LINE = "#E3DED5";
const DARK = { bg: "#141312", fg: "#F5F1EA", muted: "#B9B3AA" };

/**
 * Dessine la carte (format portrait LinkedIn 1080 × 1350) dans le style éditorial « bento » de
 * la charte Kistone : en-tête éditorial, tuiles plates de tailles différentes (aucune ombre),
 * grande tuile teintée de la fonction avec le titre surdimensionné, une seule tuile sombre pour
 * l'appel à l'action.
 */
export async function drawCard(canvas: HTMLCanvasElement, spec: CardSpec) {
  await Promise.all([
    document.fonts.load("700 88px Outfit"),
    document.fonts.load("600 44px Outfit"),
    document.fonts.load("400 30px Geist"),
    document.fonts.load("500 22px 'Geist Mono'"),
  ]).catch(() => undefined);
  const ctx = canvas.getContext("2d")!;
  canvas.width = W;
  canvas.height = H;
  const v = verticalOf(spec.vertical);
  const tint = palettes[v.palette];
  const X = 64;
  const innerW = W - X * 2;
  const GAP = 20;

  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = "alphabetic";

  // En-tête éditorial : puce rose et étiquette à gauche, KISTONE et l'éclair à droite
  ctx.beginPath();
  ctx.arc(X + 6, 78, 6, 0, Math.PI * 2);
  ctx.fillStyle = C.pink;
  ctx.fill();
  ctx.font = "500 22px 'Geist Mono'";
  ctx.letterSpacing = "3px";
  ctx.fillStyle = C.ink;
  ctx.fillText(spec.chip.toUpperCase(), X + 26, 86);
  const brand = "KISTONE";
  const bw = ctx.measureText(brand).width;
  try {
    const bolt = await loadImage("/logos/bolt-black.png");
    const bh = 30;
    const bwImg = (bolt.width * bh) / bolt.height;
    ctx.drawImage(bolt, W - X - bwImg, 60, bwImg, bh);
    ctx.fillText(brand, W - X - bwImg - 14 - bw, 86);
  } catch {
    ctx.fillText(brand, W - X - bw, 86);
  }

  // Grande tuile teintée : photo, fonction, titre, informations, accroche
  const heroY = 128;
  const heroH = 640;
  roundRect(ctx, X, heroY, innerW, heroH, 40);
  ctx.fillStyle = tint.tint;
  ctx.fill();
  ctx.save();
  roundRect(ctx, X, heroY, innerW, heroH, 40);
  ctx.clip();
  // Éclair en filigrane, ton sur ton dans la tuile
  ctx.translate(X + innerW - 330, heroY - 90);
  ctx.rotate((14 * Math.PI) / 180);
  ctx.scale(0.95, 0.95);
  ctx.strokeStyle = tint.soft;
  ctx.lineWidth = 26;
  ctx.lineJoin = "miter";
  ctx.stroke(new Path2D(BOLT));
  ctx.restore();

  const P = 52;
  let y = heroY + P;
  let photo: HTMLImageElement | null = null;
  if (spec.photo) photo = await loadImage(spec.photo).catch(() => null);
  const fn = `${v.short} · ${v.label}`.toUpperCase();
  ctx.font = "500 22px 'Geist Mono'";
  ctx.letterSpacing = "3px";
  if (photo) {
    const d = 110;
    const side = Math.min(photo.width, photo.height);
    ctx.save();
    ctx.beginPath();
    ctx.arc(X + P + d / 2, y + d / 2, d / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(photo, (photo.width - side) / 2, (photo.height - side) / 3, side, side, X + P, y, d, d);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(X + P + d / 2, y + d / 2, d / 2 + 3, 0, Math.PI * 2);
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.fillStyle = tint.ink;
    ctx.fillText(fn, X + P + d + 30, y + d / 2 + 8);
    y += d + 40;
  } else {
    ctx.fillStyle = tint.ink;
    ctx.fillText(fn, X + P, y + 24);
    y += 90;
  }

  // Titre surdimensionné, dernière ligne surlignée
  ctx.font = "700 84px Outfit";
  ctx.letterSpacing = "-3px";
  const titleLines = wrap(ctx, spec.title || spec.titleFallback, innerW - P * 2, 3);
  const lineH = 82;
  titleLines.forEach((line, i) => {
    const baseline = y + 60 + i * lineH;
    if (i === titleLines.length - 1) {
      ctx.fillStyle = C.highlight;
      ctx.fillRect(X + P - 6, baseline - 24, ctx.measureText(line).width + 12, 24);
    }
    ctx.fillStyle = C.ink;
    ctx.fillText(line, X + P, baseline);
  });
  y += 60 + (titleLines.length - 1) * lineH;

  ctx.letterSpacing = "0px";
  if (spec.meta) {
    y += 52;
    ctx.font = "500 30px Geist";
    ctx.fillStyle = tint.ink;
    ctx.fillText(wrap(ctx, spec.meta, innerW - P * 2, 1)[0], X + P, y);
  }
  if (spec.pitch) {
    y += 52;
    ctx.font = "400 30px Geist";
    ctx.fillStyle = C.muted;
    const room = heroY + heroH - P - y + 30;
    const maxLines = Math.max(1, Math.min(3, Math.floor(room / 44)));
    wrap(ctx, spec.pitch, innerW - P * 2, maxLines).forEach((line, i) => ctx.fillText(line, X + P, y + i * 44));
  }

  // Tuiles d'informations : plates, filet fin, tailles alternées (bento)
  const rowH = 150;
  const gridY = heroY + heroH + GAP;
  const wide = Math.round((innerW - GAP) * 0.58);
  const narrow = innerW - GAP - wide;
  const slots = [
    { x: X, w: wide, y: gridY },
    { x: X + wide + GAP, w: narrow, y: gridY },
    { x: X, w: narrow, y: gridY + rowH + GAP },
    { x: X + narrow + GAP, w: wide, y: gridY + rowH + GAP },
  ];
  spec.tiles.slice(0, 4).forEach((t, i) => {
    const { x: tx, w: tw, y: ty } = slots[i];
    roundRect(ctx, tx, ty, tw, rowH, 30);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.strokeStyle = TILE_LINE;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = "500 19px 'Geist Mono'";
    ctx.letterSpacing = "3px";
    ctx.fillStyle = C.subtle;
    ctx.fillText(t.label.toUpperCase(), tx + 30, ty + 50);
    ctx.letterSpacing = "-1.5px";
    ctx.font = "700 46px Outfit";
    ctx.fillStyle = C.ink;
    const value = wrap(ctx, t.value || "À définir", tw - 60 - (t.unit ? 110 : 0), 1)[0];
    ctx.fillText(value, tx + 30, ty + 112);
    if (t.unit) {
      const vw = ctx.measureText(value).width;
      ctx.font = "600 24px Outfit";
      ctx.fillStyle = C.pink;
      ctx.letterSpacing = "0px";
      ctx.fillText(` ${t.unit}`, tx + 30 + vw, ty + 112);
    }
  });

  // Tuile sombre : l'appel à l'action, le logo blanc et le site
  const ctaY = gridY + rowH * 2 + GAP * 2;
  const ctaH = H - 64 - ctaY;
  roundRect(ctx, X, ctaY, innerW, ctaH, 40);
  ctx.fillStyle = DARK.bg;
  ctx.fill();
  let logoW = 0;
  try {
    const logo = await loadImage("/logos/logo-full-white.png");
    const lh = 44;
    logoW = (logo.width * lh) / logo.height;
    ctx.drawImage(logo, X + innerW - 48 - logoW, ctaY + ctaH / 2 - lh / 2 - 12, logoW, lh);
  } catch { /* logo indisponible : la carte reste lisible */ }
  ctx.font = "500 18px 'Geist Mono'";
  ctx.letterSpacing = "3px";
  ctx.fillStyle = DARK.muted;
  const site = "KISTONE.FR";
  ctx.fillText(site, X + innerW - 48 - ctx.measureText(site).width, ctaY + ctaH / 2 + 38);
  ctx.font = "600 40px Outfit";
  ctx.letterSpacing = "-1px";
  ctx.fillStyle = DARK.fg;
  const ctaLines = wrap(ctx, spec.cta, innerW - 96 - logoW - 40, 2);
  const ctaTop = ctaY + ctaH / 2 - ((ctaLines.length - 1) * 48) / 2 + 14;
  ctaLines.forEach((l, i) => ctx.fillText(l, X + 48, ctaTop + i * 48));
  ctx.letterSpacing = "0px";
}

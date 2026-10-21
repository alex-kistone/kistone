import { palettes, type Palette } from "@/lib/palettes";
import { verticalOf } from "@/lib/verticals";
import { BOLT_FILLED_PATH } from "@/lib/blogCoverLayout";

/**
 * Fiche profil Kistone (modèle validé par Alex : « Fiche Leïla ») : fond crème à halos, grand
 * éclair en filigrane, photo à anneau dégradé, prénom surdimensionné, tuiles Spécialités,
 * Secteurs, Clients (ou missions) avec leurs chiffres, puis Anglais, TJM et Disponibilité.
 * Deux usages : fiche nominative envoyée aux clients, et carte LinkedIn anonyme (missions sans
 * nom de client). Cotes du modèle à 900 × 1125 (format 4:5), rendu en 2160 × 2700.
 */

export type SheetKpi = { value: string; label: string };
export type SheetClient = { name: string; subtitle: string; kpis: SheetKpi[] };

export type SheetSpec = {
  vertical?: string | null;
  /** En-tête : « PROFIL EXPERT · TECH RECRUITER ». */
  header: string;
  badge?: { text: string; available: boolean } | null;
  photo?: string | null;
  /** Prénom (fiche client) ou métier (carte anonyme), en très grand. */
  name: string;
  headline: string;
  meta: string;
  specialties: string[];
  sectors: string[];
  clientsLabel: string;
  /** Jusqu'à trois clients ou missions mis en avant, avec leurs chiffres. */
  highlights: SheetClient[];
  /** Jusqu'à trois autres clients, en petit. */
  others: { name: string; subtitle: string }[];
  english?: { label: string; level: number } | null;
  tjm: string;
  availability: { value: string; note: string };
  ref?: string;
};

export const SHEET_W = 900;
export const SHEET_H = 1125;

const C = {
  bg: "#F5F1EA", ink: "#141312", ink2: "#3D3A36", muted: "#5E5A54", subtle: "#6B665F", mono: "#4A4640",
  line: "rgba(20,19,18,0.07)", soft: "#F3EEE6", green: "#17663F", greenDot: "#2F9A63", orange: "#94471A", orangeDot: "#E07A3A",
};
const GRAD = ["#FF2E6E", "#B14DF5", "#4C7DFF"];

/** Teintes des tuiles : RPO en abricot (charte), familles IA dans leur teinte ; secteurs en bleu. */
function tints(vertical?: string | null): { main: Palette; sectors: Palette } {
  const v = verticalOf(vertical);
  const main = v.id === "rpo" ? palettes.apricot : palettes[v.palette];
  return { main, sectors: main === palettes.blue ? palettes.slate : palettes.blue };
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((ok, ko) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => ok(i);
    i.onerror = ko;
    i.src = src;
  });

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function card(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill = "#FFFFFF") {
  rr(ctx, x, y, w, h, 22);
  ctx.fillStyle = fill;
  ctx.fill();
  if (fill === "#FFFFFF") {
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function setFont(ctx: CanvasRenderingContext2D, font: string, spacing = 0) {
  ctx.font = font;
  ctx.letterSpacing = `${spacing}px`;
}

/** Coupe un texte en lignes de largeur maximale (avec « … » au-delà de maxLines). */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width <= maxWidth || !line) line = t;
    else { lines.push(line); line = w; }
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1];
  while (ctx.measureText(`${last}…`).width > maxWidth && last.length > 1) last = last.slice(0, -1);
  kept[maxLines - 1] = `${last.trimEnd()}…`;
  return kept;
}

function gradient(ctx: CanvasRenderingContext2D, x0: number, x1: number) {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, GRAD[0]);
  g.addColorStop(0.55, GRAD[1]);
  g.addColorStop(1, GRAD[2]);
  return g;
}

function halo(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, rgb: string, a: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(rx, ry);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(0.75, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(-2, -2, 4, 4);
  ctx.restore();
}

/** Étiquette mono en majuscules. */
function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = C.mono) {
  setFont(ctx, "500 12px 'Geist Mono'", 2.2);
  ctx.fillStyle = color;
  ctx.fillText(text.toUpperCase(), x, y);
}

/** Pastilles (chips) sur deux lignes au plus, dans une largeur donnée. */
function chips(ctx: CanvasRenderingContext2D, items: string[], x: number, y: number, maxW: number, t: Palette) {
  setFont(ctx, "500 16px Geist");
  const h = 32;
  let cx = x;
  let row = 0;
  for (const item of items) {
    const w = ctx.measureText(item).width + 30;
    if (cx + w > x + maxW && cx > x) {
      row++;
      cx = x;
      if (row > 1) return;
    }
    rr(ctx, cx, y + row * (h + 8), w, h, 16);
    ctx.fillStyle = t.tint;
    ctx.fill();
    ctx.fillStyle = t.ink;
    ctx.fillText(item, cx + 15, y + row * (h + 8) + 21);
    cx += w + 8;
  }
}

/**
 * Dessine la fiche dans le canvas : échelle 2,4 par défaut (2160 × 2700, PDF net), 1,2 pour
 * LinkedIn (1080 × 1350, format recommandé).
 */
export async function drawProfileSheet(canvas: HTMLCanvasElement, spec: SheetSpec, S = 2.4) {
  await Promise.all([
    document.fonts.load("700 96px Outfit"),
    document.fonts.load("600 27px Outfit"),
    document.fonts.load("400 16px Geist"),
    document.fonts.load("500 16px Geist"),
    document.fonts.load("500 15px 'Geist Mono'"),
  ]).catch(() => undefined);
  canvas.width = SHEET_W * S;
  canvas.height = SHEET_H * S;
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(S, 0, 0, S, 0, 0);
  ctx.textBaseline = "alphabetic";
  const { main, sectors } = tints(spec.vertical);
  const X = 54;
  const R = SHEET_W - 54;

  // Fond crème, halos dans les coins, grand éclair en filigrane
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, SHEET_W, SHEET_H);
  halo(ctx, 760, 40, 520, 560, "255,46,110", 0.24);
  halo(ctx, 0, SHEET_H, 420, 420, "177,77,245", 0.16);
  halo(ctx, SHEET_W, SHEET_H, 420, 440, "76,125,255", 0.2);
  ctx.save();
  const boltH = SHEET_H * 1.3;
  ctx.translate(SHEET_W * 0.66, -0.12 * SHEET_H);
  ctx.scale(boltH / 1024, boltH / 1024);
  ctx.globalAlpha = 0.09;
  ctx.fillStyle = C.ink;
  ctx.fill(new Path2D(BOLT_FILLED_PATH), "evenodd");
  ctx.restore();

  // En-tête : puce dégradée et étiquette ; pastille de disponibilité
  ctx.beginPath();
  ctx.arc(X + 4, 63, 5, 0, Math.PI * 2);
  ctx.fillStyle = gradient(ctx, X - 1, X + 9);
  ctx.fill();
  setFont(ctx, "500 15px 'Geist Mono'", 3.2);
  ctx.fillStyle = C.mono;
  ctx.fillText(spec.header.toUpperCase(), X + 20, 69);
  if (spec.badge?.text) {
    setFont(ctx, "500 16px Geist");
    const bw = ctx.measureText(spec.badge.text).width + 52;
    rr(ctx, R - bw, 47, bw, 40, 20);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.strokeStyle = C.line;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(R - bw + 22, 67, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = spec.badge.available ? C.greenDot : C.orangeDot;
    ctx.fill();
    ctx.fillStyle = spec.badge.available ? C.green : C.orange;
    ctx.fillText(spec.badge.text, R - bw + 34, 73);
  }

  // Photo à anneau dégradé
  const px = 135;
  const py = 223;
  const pr = 80;
  const photo = spec.photo ? await loadImage(spec.photo).catch(() => null) : null;
  ctx.beginPath();
  ctx.arc(px, py, pr, 0, Math.PI * 2);
  ctx.fillStyle = gradient(ctx, px - pr, px + pr);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(px, py, pr - 4, 0, Math.PI * 2);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(px, py, pr - 8, 0, Math.PI * 2);
  ctx.clip();
  if (photo) {
    const side = Math.min(photo.width, photo.height);
    ctx.drawImage(photo, (photo.width - side) / 2, (photo.height - side) / 4, side, side, px - pr + 8, py - pr + 8, (pr - 8) * 2, (pr - 8) * 2);
  } else {
    ctx.fillStyle = main.tint;
    ctx.fillRect(px - pr, py - pr, pr * 2, pr * 2);
    setFont(ctx, "700 54px Outfit", -2);
    ctx.fillStyle = main.ink;
    ctx.textAlign = "center";
    ctx.fillText(spec.name.trim().charAt(0).toUpperCase(), px, py + 19);
    ctx.textAlign = "left";
  }
  ctx.restore();

  // Prénom (ou métier), intitulé, ligne d'information, barre dégradée
  const TX = 252;
  const TW = R - TX;
  setFont(ctx, "700 96px Outfit", -4.3);
  let nameSize = 96;
  while (ctx.measureText(spec.name).width > TW && nameSize > 52) {
    nameSize -= 4;
    setFont(ctx, `700 ${nameSize}px Outfit`, -0.045 * nameSize);
  }
  ctx.fillStyle = C.ink;
  ctx.fillText(spec.name, TX - 2, 195);
  setFont(ctx, "600 27px Outfit", -0.8);
  const head = wrap(ctx, spec.headline, TW, 2);
  head.forEach((l, i) => ctx.fillText(l, TX, 245 + i * 32));
  let y = 245 + (head.length - 1) * 32;
  setFont(ctx, "400 17px Geist");
  ctx.fillStyle = C.muted;
  if (spec.meta) {
    y += 31;
    ctx.fillText(wrap(ctx, spec.meta, TW, 1)[0], TX, y);
  }
  rr(ctx, TX, y + 20, 72, 4, 2);
  ctx.fillStyle = gradient(ctx, TX, TX + 72);
  ctx.fill();

  // Spécialités et secteurs
  const r1 = 352;
  const half = (R - X - 16) / 2;
  card(ctx, X, r1, half, 135);
  label(ctx, "Spécialités", X + 23, r1 + 32, main.ink);
  chips(ctx, spec.specialties, X + 23, r1 + 46, half - 46, main);
  card(ctx, X + half + 16, r1, half, 135);
  label(ctx, "Secteurs", X + half + 39, r1 + 32, sectors.ink);
  chips(ctx, spec.sectors, X + half + 39, r1 + 46, half - 46, sectors);

  // Clients (ou missions) : trois mis en avant avec leurs chiffres, trois autres en petit
  const r2 = 502;
  const others = spec.others.slice(0, 3);
  const r2h = others.length ? 303 : 238;
  card(ctx, X, r2, R - X, r2h);
  label(ctx, spec.clientsLabel, X + 23, r2 + 31);
  const hl = spec.highlights.slice(0, 3);
  const inner = R - X - 46;
  const tw3 = (inner - 16) / 3;
  const hlH = others.length ? 164 : 170;
  hl.forEach((c, i) => {
    const tx = X + 23 + i * (tw3 + 8);
    const ty = r2 + 46;
    rr(ctx, tx, ty, tw3, hlH, 14);
    ctx.fillStyle = main.tint;
    ctx.fill();
    setFont(ctx, "600 19px Outfit", -0.4);
    ctx.fillStyle = C.ink;
    ctx.fillText(wrap(ctx, c.name, tw3 - 30, 1)[0], tx + 15, ty + 32);
    setFont(ctx, "400 12.5px Geist");
    ctx.fillStyle = main.ink;
    ctx.fillText(wrap(ctx, c.subtitle, tw3 - 30, 1)[0] ?? "", tx + 15, ty + 50);
    // Colonne des libellés calée sur le chiffre le plus large de la tuile
    const kpis = c.kpis.slice(0, 3);
    setFont(ctx, "600 24px Outfit", -0.8);
    const valueW = Math.min(90, Math.max(0, ...kpis.map((k) => ctx.measureText(k.value).width)));
    const labelX = tx + 15 + (valueW ? valueW + 12 : 0);
    kpis.forEach((k, j) => {
      const ky = ty + 85 + j * 31.5;
      setFont(ctx, "600 24px Outfit", -0.8);
      ctx.fillStyle = main.ink;
      ctx.fillText(wrap(ctx, k.value, 90, 1)[0] ?? "", tx + 15, ky);
      setFont(ctx, "400 13px Geist");
      ctx.fillStyle = C.ink2;
      ctx.fillText(wrap(ctx, k.label, tx + tw3 - 12 - labelX, 1)[0] ?? "", labelX, ky - 3);
    });
  });
  others.forEach((c, i) => {
    const tx = X + 23 + i * (tw3 + 8);
    const ty = r2 + 46 + hlH + 10;
    rr(ctx, tx, ty, tw3, 65, 12);
    ctx.fillStyle = C.soft;
    ctx.fill();
    setFont(ctx, "600 18px Outfit", -0.4);
    ctx.fillStyle = C.ink;
    ctx.fillText(wrap(ctx, c.name, tw3 - 30, 1)[0], tx + 15, ty + 30);
    setFont(ctx, "400 13px Geist");
    ctx.fillStyle = C.subtle;
    ctx.fillText(wrap(ctx, c.subtitle, tw3 - 30, 1)[0] ?? "", tx + 15, ty + 50);
  });

  // Anglais, TJM, Disponibilité
  const r3 = r2 + r2h + 15;
  const r3h = 148;
  const w1 = 246;
  const w2 = 270;
  const w3 = R - X - w1 - w2 - 30;
  card(ctx, X, r3, w1, r3h);
  label(ctx, "Anglais", X + 23, r3 + 30);
  setFont(ctx, "700 36px Outfit", -1.4);
  ctx.fillStyle = C.ink;
  ctx.fillText(spec.english?.label || "—", X + 23, r3 + 80);
  for (let i = 0; i < 5; i++) {
    rr(ctx, X + 23 + i * 41, r3 + 97, 36, 4, 2);
    ctx.fillStyle = spec.english && i < spec.english.level ? gradient(ctx, X + 23 + i * 41, X + 59 + i * 41) : "#E8E2D8";
    ctx.fill();
  }
  const x2 = X + w1 + 15;
  card(ctx, x2, r3, w2, r3h);
  label(ctx, "TJM", x2 + 23, r3 + 30);
  setFont(ctx, "700 40px Outfit", -1.6);
  const tjmW = ctx.measureText(spec.tjm).width;
  ctx.fillStyle = gradient(ctx, x2 + 23, x2 + 23 + Math.max(tjmW, 80));
  ctx.fillText(spec.tjm, x2 + 23, r3 + 82);
  if (/€/.test(spec.tjm)) {
    setFont(ctx, "400 15px Geist");
    ctx.fillStyle = C.muted;
    ctx.fillText("HT / jour", x2 + 23, r3 + 112);
  }
  const x3 = x2 + w2 + 15;
  card(ctx, x3, r3, w3, r3h);
  label(ctx, "Disponibilité", x3 + 23, r3 + 30);
  setFont(ctx, "700 36px Outfit", -1.4);
  ctx.fillStyle = C.ink;
  ctx.fillText(wrap(ctx, spec.availability.value, w3 - 46, 1)[0] ?? "", x3 + 23, r3 + 80);
  setFont(ctx, "400 15px Geist");
  ctx.fillStyle = C.muted;
  wrap(ctx, spec.availability.note, w3 - 46, 2).forEach((l, i) => ctx.fillText(l, x3 + 23, r3 + 106 + i * 18));

  // Pied : logo, filet, « AI EXPERTS PLATFORM », référence
  const fy = Math.max(r3 + r3h + 60, 1036);
  try {
    const logo = await loadImage("/logos/logo-full-black.png");
    const lh = 44;
    const lw = (logo.width * lh) / logo.height;
    ctx.drawImage(logo, X, fy, lw, lh);
    ctx.fillStyle = "rgba(20,19,18,0.25)";
    ctx.fillRect(X + lw + 22, fy + 8, 1.2, 28);
    setFont(ctx, "500 15px 'Geist Mono'", 2.8);
    ctx.fillStyle = C.mono;
    ctx.fillText("AI EXPERTS PLATFORM", X + lw + 44, fy + 28);
  } catch { /* logo indisponible */ }
  if (spec.ref) {
    setFont(ctx, "500 12px 'Geist Mono'", 2);
    ctx.fillStyle = C.subtle;
    ctx.textAlign = "right";
    ctx.fillText(spec.ref.toUpperCase(), R, fy + 28);
    ctx.textAlign = "left";
  }
  ctx.letterSpacing = "0px";
}

/**
 * PDF d'une page contenant l'image du canvas (JPEG), au format de la fiche (A4 en largeur,
 * hauteur 4:5) : de quoi l'envoyer en pièce jointe sans dépendance supplémentaire.
 */
export async function canvasToPdf(canvas: HTMLCanvasElement): Promise<Blob> {
  const jpeg = await new Promise<Blob>((ok, ko) => canvas.toBlob((b) => (b ? ok(b) : ko(new Error("Export impossible"))), "image/jpeg", 0.92));
  const img = new Uint8Array(await jpeg.arrayBuffer());
  const wPt = 595.28;
  const hPt = (wPt * canvas.height) / canvas.width;
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;
  const push = (p: Uint8Array | string) => {
    const b = typeof p === "string" ? enc.encode(p) : p;
    parts.push(b);
    length += b.length;
  };
  const obj = (n: number, body: (Uint8Array | string)[]) => {
    offsets[n] = length;
    push(`${n} 0 obj\n`);
    body.forEach(push);
    push("\nendobj\n");
  };
  const content = `q ${wPt.toFixed(2)} 0 0 ${hPt.toFixed(2)} 0 0 cm /Im0 Do Q`;
  push("%PDF-1.4\n");
  obj(1, ["<< /Type /Catalog /Pages 2 0 R >>"]);
  obj(2, ["<< /Type /Pages /Kids [3 0 R] /Count 1 >>"]);
  obj(3, [`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${wPt.toFixed(2)} ${hPt.toFixed(2)}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`]);
  obj(4, [`<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.length} >>\nstream\n`, img, "\nendstream"]);
  obj(5, [`<< /Length ${content.length} >>\nstream\n${content}\nendstream`]);
  const xref = length;
  push(`xref\n0 6\n0000000000 65535 f \n${[1, 2, 3, 4, 5].map((n) => `${String(offsets[n]).padStart(10, "0")} 00000 n \n`).join("")}`);
  push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(parts, { type: "application/pdf" });
}

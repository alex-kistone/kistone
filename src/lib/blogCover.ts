/**
 * Couverture d'article, carte « Design Card Blog » v3 de la charte Kistone (skill
 * design-card-blog, référence : carte « TjM »), dessinée dans le navigateur (aucune IA, aucun
 * personnage) : fond crème et trois halos vifs dans les coins, grand éclair plein en filigrane à
 * droite, titre Outfit centré, barre dégradée, et en bas à gauche le logo « kistone » avec
 * « AI EXPERTS PLATFORM ». Cotes de la carte à 1200 × 800, rendue en @2x (2400 × 1600).
 */
import { BOLT_FILLED_PATH, coverLayout } from "./blogCoverLayout";

export const COVER_SCALE = 2;
export const COVER_WIDTH = 1200 * COVER_SCALE;
export const COVER_HEIGHT = 800 * COVER_SCALE;

const W = 1200;
const H = 800;
const INK = "#141312";
const CREAM = "#F5F1EA";
const TAGLINE = "AI EXPERTS PLATFORM";
const LOGO_SRC = "/logos/logo-full-black.png";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Image introuvable : ${src}`));
    img.src = src;
  });
}

/** Halo radial elliptique (centre et rayons en fraction de la carte). */
function halo(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, rgb: string, alpha: number) {
  ctx.save();
  ctx.translate(cx * W, cy * H);
  ctx.scale(rx * W, ry * H);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  g.addColorStop(0, `rgba(${rgb},${alpha})`);
  g.addColorStop(0.7, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(-2, -2, 4, 4);
  ctx.restore();
}

/** Dessine la couverture et la renvoie en JPEG. */
export async function renderBlogCover(title: string): Promise<Blob> {
  await Promise.all([document.fonts.load("700 130px Outfit"), document.fonts.load("500 22px 'Geist Mono'")]);
  const logo = await loadImage(LOGO_SRC);

  const canvas = document.createElement("canvas");
  canvas.width = COVER_WIDTH;
  canvas.height = COVER_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Dessin impossible dans ce navigateur.");
  ctx.scale(COVER_SCALE, COVER_SCALE);

  // Fond crème et trois halos vifs : rose en haut à droite, violet en bas à gauche, bleu en bas à droite
  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, W, H);
  halo(ctx, 0.88, 0.08, 0.6, 0.7, "255,46,110", 0.3);
  halo(ctx, 0.04, 1, 0.5, 0.55, "177,77,245", 0.2);
  halo(ctx, 1, 1, 0.5, 0.55, "76,125,255", 0.26);

  // Titre : la taille et le retrait de l'éclair sont calculés pour qu'ils ne se touchent jamais
  const measure = (text: string, size: number) => {
    ctx.font = `700 ${size}px Outfit, sans-serif`;
    ctx.letterSpacing = `${-0.045 * size}px`;
    return ctx.measureText(text).width;
  };
  const layout = coverLayout(title || "Ressources", measure);

  // Grand éclair plein en filigrane, à 10 % : il déborde en haut, en bas et à droite
  ctx.save();
  const boltH = H * 1.4;
  ctx.translate(layout.boltLeft, -0.22 * H);
  ctx.scale(boltH / 1024, boltH / 1024);
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = INK;
  ctx.fill(new Path2D(BOLT_FILLED_PATH), "evenodd");
  ctx.restore();

  ctx.font = `700 ${layout.size}px Outfit, sans-serif`;
  ctx.letterSpacing = `${-0.045 * layout.size}px`;
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  layout.lines.forEach((l, i) => ctx.fillText(l, W / 2, layout.top + i * layout.size));

  // Barre dégradée, seule touche de dégradé franc
  const bar = ctx.createLinearGradient(W / 2 - 48, 0, W / 2 + 48, 0);
  bar.addColorStop(0, "#FF2E6E");
  bar.addColorStop(0.55, "#B14DF5");
  bar.addColorStop(1, "#4C7DFF");
  ctx.fillStyle = bar;
  ctx.beginPath();
  ctx.roundRect(W / 2 - 48, layout.barY, 96, 6, 3);
  ctx.fill();

  // Signature : logo « kistone » 66 px, filet, « AI EXPERTS PLATFORM »
  const logoH = 66;
  const logoW = (logo.width / logo.height) * logoH;
  const logoY = H - 56 - logoH;
  ctx.drawImage(logo, 60, logoY, logoW, logoH);
  const ruleX = 60 + logoW + 26;
  ctx.fillStyle = "rgba(20,19,18,0.25)";
  ctx.fillRect(ruleX, logoY + (logoH - 42) / 2, 1.5, 42);
  ctx.font = "500 22px 'Geist Mono', monospace";
  ctx.letterSpacing = `${0.14 * 22}px`;
  ctx.fillStyle = "#4A4640";
  ctx.textAlign = "left";
  ctx.fillText(TAGLINE, ruleX + 1.5 + 26, logoY + logoH / 2 + 1);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Export de l'image impossible."))), "image/jpeg", 0.92),
  );
}

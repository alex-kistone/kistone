/**
 * Couverture d'article générée à partir d'un gabarit à la charte Kistone, dessinée dans le
 * navigateur (aucune IA, aucun personnage) : fond crème, halos du dégradé IA (rose, violet,
 * bleu), grand éclair en filigrane, catégorie centrée, et en bas à gauche le logo Kistone avec
 * « AI expert platform ». Format 3:2 (1536 × 1024), comme les couvertures existantes.
 */

export const COVER_WIDTH = 1536;
export const COVER_HEIGHT = 1024;

const INK = "#141312";
const MUTED = "#5E5A54";
const CREAM = "#F5F1EA";
const GRADIENT = ["#FF2E6E", "#B14DF5", "#4C7DFF"];
const TAGLINE = "AI expert platform";
const LOGO_SRC = "/logos/logo-full-black.png";

// Éclair du logo (viewBox 624 × 1024), le même tracé que BoltMark
const BOLT_PATHS = ["M38 560 L488 18 L318 398", "M22 588 L346 416 L602 416 L280 588 Z", "M300 606 L132 1006 L590 444"];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Image introuvable : ${src}`));
    img.src = src;
  });
}

/** Découpe le texte en lignes (deux au maximum) et choisit la plus grande taille qui tient. */
function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): { size: number; lines: string[] } {
  const words = text.trim().split(/\s+/);
  for (let size = 168; size >= 64; size -= 4) {
    ctx.font = `700 ${size}px Outfit, sans-serif`;
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (ctx.measureText(next).width <= maxWidth || !line) line = next;
      else { lines.push(line); line = w; }
    }
    lines.push(line);
    if (lines.length <= 2 && lines.every((l) => ctx.measureText(l).width <= maxWidth)) return { size, lines };
  }
  ctx.font = "700 64px Outfit, sans-serif";
  return { size: 64, lines: [text] };
}

function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha: number) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  const hex = Math.round(alpha * 255).toString(16).padStart(2, "0");
  g.addColorStop(0, `${color}${hex}`);
  g.addColorStop(1, `${color}00`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, COVER_WIDTH, COVER_HEIGHT);
}

/** Dessine la couverture et la renvoie en JPEG. */
export async function renderBlogCover(category: string): Promise<Blob> {
  const W = COVER_WIDTH;
  const H = COVER_HEIGHT;
  await Promise.all([document.fonts.load("700 120px Outfit"), document.fonts.load("500 22px 'Geist Mono'")]);
  const logo = await loadImage(LOGO_SRC);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Dessin impossible dans ce navigateur.");

  // Fond crème et halos du dégradé IA
  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, W, H);
  glow(ctx, W * 0.86, H * 0.12, 620, GRADIENT[0], 0.2);
  glow(ctx, W * 0.1, H * 0.95, 560, GRADIENT[1], 0.14);
  glow(ctx, W * 0.98, H * 0.98, 520, GRADIENT[2], 0.16);

  // Grand éclair en filigrane, à droite, qui déborde du cadre
  ctx.save();
  ctx.translate(W * 0.74, -H * 0.12);
  ctx.rotate((14 * Math.PI) / 180);
  const scale = (H * 1.25) / 1024;
  ctx.scale(scale, scale);
  ctx.strokeStyle = INK;
  ctx.globalAlpha = 0.06;
  ctx.lineWidth = 16;
  ctx.lineJoin = "miter";
  for (const d of BOLT_PATHS) ctx.stroke(new Path2D(d));
  ctx.restore();

  // Catégorie, centrée
  const { size, lines } = fitText(ctx, category || "Ressources", W * 0.78);
  ctx.font = `700 ${size}px Outfit, sans-serif`;
  if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${-0.04 * size}px`;
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const lineHeight = size * 1.02;
  const top = H * 0.46 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => ctx.fillText(l, W / 2, top + i * lineHeight));

  // Trait du dégradé IA sous la catégorie
  const barW = 132;
  const barY = top + (lines.length - 1) * lineHeight + size * 0.62 + 28;
  const bar = ctx.createLinearGradient(W / 2 - barW / 2, 0, W / 2 + barW / 2, 0);
  GRADIENT.forEach((c, i) => bar.addColorStop(i / (GRADIENT.length - 1), c));
  ctx.fillStyle = bar;
  ctx.beginPath();
  ctx.roundRect(W / 2 - barW / 2, barY, barW, 10, 5);
  ctx.fill();

  // En bas à gauche : logo Kistone et « AI expert platform »
  const margin = 72;
  const logoH = 58;
  const logoW = (logo.width / logo.height) * logoH;
  const logoY = H - margin - logoH;
  ctx.drawImage(logo, margin, logoY, logoW, logoH);
  const ruleX = margin + logoW + 26;
  ctx.fillStyle = "rgba(20,19,18,0.18)";
  ctx.fillRect(ruleX, logoY + 8, 2, logoH - 16);
  ctx.font = "500 22px 'Geist Mono', monospace";
  if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "3px";
  ctx.fillStyle = MUTED;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(TAGLINE.toUpperCase(), ruleX + 26, logoY + logoH / 2 + 1);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Export de l'image impossible."))), "image/jpeg", 0.9),
  );
}

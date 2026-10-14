import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Download, Linkedin, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { freelanceRate } from "@/lib/pricing";
import { palettes } from "@/lib/palettes";
import { verticalOf } from "@/lib/verticals";
import { durationLabel } from "@/components/platform/MissionDurationField";
import { remoteLabel } from "./needsModel";

/** Besoin tel que lu dans l'admin (seuls les champs utiles à la carte). */
export type CardNeed = {
  job_title: string;
  vertical?: string | null;
  sectors?: string[] | null;
  description?: string | null;
  mission_location?: string | null;
  remote_policy?: string | null;
  duration_months?: number | null;
  budget_tjm_min?: number | null;
  budget_tjm_max?: number | null;
  company_name?: string | null;
  contact_name?: string | null;
};

type Fields = { title: string; sector: string; mission: string; location: string; remote: string; duration: string; tjm: string; cta: string };

const W = 1080;
const H = 1350;
const C = { bg: "#F5F1EA", ink: "#141312", muted: "#5E5A54", subtle: "#6B665F", pink: "#FF2E6E", border: "rgba(20,19,18,0.08)", watermark: "#E8E1D5", highlight: "rgba(255,46,110,0.28)" };

/** Retire le nom du client (et du contact) d'un texte, pour garder la carte anonyme. */
function anonymize(text: string, need: CardNeed): string {
  let out = text;
  for (const name of [need.company_name, need.contact_name]) {
    const n = name?.trim();
    if (n && n.length > 1) out = out.replace(new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "notre client");
  }
  return out;
}

/** Deux premières phrases de la description, sans le nom du client. */
function missionPitch(need: CardNeed): string {
  const text = anonymize((need.description ?? "").replace(/\s+/g, " ").trim(), need);
  if (!text) return "";
  const sentences = text.match(/[^.!?]+[.!?]?/g) ?? [text];
  return sentences.slice(0, 2).join(" ").trim().slice(0, 180);
}

function tjmRange(need: CardNeed): string {
  const lo = need.budget_tjm_min ? freelanceRate(need.budget_tjm_min) : null;
  const hi = need.budget_tjm_max ? freelanceRate(need.budget_tjm_max) : null;
  if (lo && hi) return `${lo} – ${hi} €`;
  if (hi) return `Jusqu'à ${hi} €`;
  if (lo) return `À partir de ${lo} €`;
  return "À définir";
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
    kept[maxLines - 1] = `${last.trimEnd()}…`;
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
    i.onload = () => ok(i);
    i.onerror = ko;
    i.src = src;
  });

/** Dessine la carte (format portrait LinkedIn 1080 × 1350), dans la charte Kistone. */
async function drawCard(canvas: HTMLCanvasElement, f: Fields, need: CardNeed) {
  await Promise.all([
    document.fonts.load("700 96px Outfit"),
    document.fonts.load("600 44px Outfit"),
    document.fonts.load("400 34px Geist"),
    document.fonts.load("500 22px 'Geist Mono'"),
  ]).catch(() => undefined);
  const ctx = canvas.getContext("2d")!;
  canvas.width = W;
  canvas.height = H;
  const v = verticalOf(need.vertical);
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

  // Logo et pastille « Mission freelance »
  try {
    const logo = await loadImage("/logos/logo-full-black.png");
    const lh = 54;
    ctx.drawImage(logo, X, 88, (logo.width * lh) / logo.height, lh);
  } catch { /* logo indisponible : la carte reste lisible */ }
  ctx.font = "500 20px 'Geist Mono'";
  ctx.letterSpacing = "3px";
  const chip = "MISSION FREELANCE";
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

  // Fonction (teinte de la fonction, jamais rose)
  let y = 270;
  ctx.font = "600 26px Geist";
  ctx.letterSpacing = "0px";
  const fn = `${v.short} · ${v.label}`;
  const fnW = ctx.measureText(fn).width + 44;
  roundRect(ctx, X, y - 26, fnW, 52, 26);
  ctx.fillStyle = tint.tint;
  ctx.fill();
  ctx.fillStyle = tint.ink;
  ctx.fillText(fn, X + 22, y + 1);

  // Titre : Outfit serré, dernière ligne surlignée
  y += 64;
  ctx.font = "700 104px Outfit";
  ctx.letterSpacing = "-4px";
  ctx.textBaseline = "alphabetic";
  const titleLines = wrap(ctx, f.title || "Intitulé de la mission", innerW, 3);
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

  // Secteur
  ctx.letterSpacing = "0px";
  if (f.sector) {
    y += 64;
    ctx.font = "500 32px Geist";
    ctx.fillStyle = C.subtle;
    ctx.fillText(`Secteur · ${f.sector}`, X, y);
  }

  // Mission : deux lignes
  if (f.mission) {
    y += 70;
    ctx.font = "400 33px Geist";
    ctx.fillStyle = C.muted;
    wrap(ctx, f.mission, innerW, 2).forEach((line, i) => ctx.fillText(line, X, y + i * 48));
    y += 52;
  }

  // Quatre tuiles d'informations
  const tiles: { label: string; value: string; unit?: string }[] = [
    { label: "LIEU", value: f.location || "À définir" },
    { label: "TÉLÉTRAVAIL", value: f.remote || "À définir" },
    { label: "DURÉE", value: f.duration || "À définir" },
    { label: "TJM FREELANCE", value: f.tjm.replace(/\s*€.*$/, ""), unit: /€/.test(f.tjm) ? "€ HT/j" : undefined },
  ];
  const gap = 24;
  const tileW = (innerW - gap) / 2;
  const tileH = 168;
  // Les tuiles s'ancrent au-dessus de l'appel à l'action (64 px de bouton + 56 px d'air)
  const gridY = H - 88 - 64 - 56 - (tileH * 2 + gap);
  tiles.forEach((t, i) => {
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
    const valueLines = wrap(ctx, t.value || "—", tileW - 64 - (t.unit ? 0 : 0), 1);
    ctx.fillText(valueLines[0], tx + 32, ty + 120);
    if (t.unit) {
      const vw = ctx.measureText(valueLines[0]).width;
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
  const ctaText = f.cta || "Intéressé·e ? Écrivez-moi en message privé";
  const ctaW = Math.min(ctx.measureText(ctaText).width + 72, innerW - 220);
  roundRect(ctx, X, ctaY, ctaW, 64, 32);
  ctx.fillStyle = C.pink;
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.textBaseline = "middle";
  ctx.fillText(wrap(ctx, ctaText, ctaW - 72, 1)[0], X + 36, ctaY + 33);
  ctx.font = "500 22px 'Geist Mono'";
  ctx.letterSpacing = "3px";
  ctx.fillStyle = C.ink;
  const site = "KISTONE.FR";
  ctx.fillText(site, W - X - ctx.measureText(site).width, ctaY + 33);
  ctx.textBaseline = "alphabetic";
}

/**
 * Carte récapitulative d'un besoin, à publier sur LinkedIn : anonyme (jamais le nom du client),
 * modifiable champ par champ, téléchargeable en PNG, avec le texte du post à copier.
 */
export default function LinkedInCardDialog({ need, open, onOpenChange }: { need: CardNeed; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const initial = useMemo<Fields>(() => ({
    title: anonymize(need.job_title || "", need),
    sector: (need.sectors ?? []).filter((s) => s !== "Autre").join(", "),
    mission: missionPitch(need),
    location: need.mission_location || "",
    remote: need.remote_policy ? remoteLabel(need.remote_policy) : "",
    duration: need.duration_months ? durationLabel(need.duration_months) : "",
    tjm: tjmRange(need),
    cta: "Intéressé·e ? Écrivez-moi en message privé",
  }), [need]);
  const [f, setF] = useState<Fields>(initial);
  useEffect(() => { if (open) setF(initial); }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => { if (canvasRef.current) drawCard(canvasRef.current, f, need); }, 60);
    return () => window.clearTimeout(t);
  }, [open, f, need]);

  // Garde-fou d'anonymat : le nom du client ne doit apparaître nulle part
  const leaks = [need.company_name, need.contact_name]
    .map((n) => n?.trim())
    .filter((n): n is string => !!n && n.length > 1)
    .filter((n) => Object.values(f).some((val) => val.toLowerCase().includes(n.toLowerCase())));

  // Connexion LinkedIn de l'admin (publication directe via l'API)
  const [li, setLi] = useState<{ configured: boolean; connected: boolean; name: string | null } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [publishing, setPublishing] = useState(false);
  useEffect(() => {
    if (!open) return;
    const check = () =>
      supabase.functions.invoke("linkedin-auth", { body: { action: "status" } }).then(({ data }) => {
        if (data && !data.error) setLi({ configured: !!data.configured, connected: !!data.connected, name: data.name ?? null });
      });
    check();
    // Après l'autorisation dans un autre onglet, l'état se met à jour au retour sur celui-ci
    window.addEventListener("focus", check);
    return () => window.removeEventListener("focus", check);
  }, [open]);

  const connectLinkedin = async () => {
    const { data, error } = await supabase.functions.invoke("linkedin-auth", { body: { action: "start" } });
    if (error || data?.error) {
      toast({ title: "Connexion impossible", description: data?.error ?? error?.message, variant: "destructive" });
      return;
    }
    window.open(data.url, "_blank");
  };

  const publishDirect = async () => {
    if (!canvasRef.current) return;
    setPublishing(true);
    const { data, error } = await supabase.functions.invoke("linkedin-publish", {
      body: { image: canvasRef.current.toDataURL("image/png"), text: postText, altText: `Mission freelance : ${f.title}` },
    });
    setPublishing(false);
    setConfirming(false);
    if (error || data?.error) {
      const body = error ? await (error as { context?: { json?: () => Promise<{ error?: string; reconnect?: boolean }> } }).context?.json?.().catch(() => null) : data;
      if (body?.reconnect) setLi((v) => (v ? { ...v, connected: false } : v));
      toast({ title: "Publication impossible", description: body?.error ?? error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Publié sur LinkedIn", description: "Le post est en ligne sur votre profil." });
    window.open(data.url, "_blank");
  };

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const download = () => {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `kistone-mission-${(f.title || "mission").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-")}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    }, "image/png");
  };

  const postText = [
    `Mission freelance : ${f.title}`,
    "",
    f.mission,
    "",
    f.sector && `Secteur : ${f.sector}`,
    f.location && `Lieu : ${f.location}${f.remote ? ` (${f.remote.toLowerCase()})` : ""}`,
    f.duration && `Durée : ${f.duration}`,
    f.tjm && `TJM freelance : ${f.tjm}${/€/.test(f.tjm) ? " HT/jour" : ""}`,
    "",
    f.cta,
    "",
    "#freelance #fractional #kistone",
  ].filter((l): l is string => typeof l === "string").join("\n").replace(/\n{3,}/g, "\n\n");

  /**
   * Publication assistée : l'image part dans le presse-papier, LinkedIn s'ouvre avec la
   * fenêtre de post et le texte pré-rempli ; il reste à coller l'image (Cmd+V) et publier.
   */
  const publish = async () => {
    // L'onglet s'ouvre tout de suite (sinon le navigateur le bloque après une attente)
    const tab = window.open("about:blank", "_blank");
    let imageCopied = false;
    try {
      const blob = await new Promise<Blob | null>((ok) => canvasRef.current?.toBlob(ok, "image/png") ?? ok(null));
      if (blob && "ClipboardItem" in window) {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        imageCopied = true;
      }
    } catch { /* presse-papier refusé : on télécharge l'image à la place */ }
    if (!imageCopied) download();
    const url = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(postText)}`;
    if (tab) tab.location.href = url;
    else window.open(url, "_blank");
    toast({
      title: "LinkedIn s'ouvre avec votre texte",
      description: imageCopied ? "L'image est copiée : collez-la dans le post (Cmd+V), puis publiez." : "L'image a été téléchargée : ajoutez-la au post, puis publiez.",
    });
  };

  const copyPost = async () => {
    await navigator.clipboard.writeText(postText);
    toast({ title: "Texte du post copié", description: "Collez-le dans LinkedIn avec l'image." });
  };

  const v = verticalOf(need.vertical);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Linkedin className="h-5 w-5" />Carte LinkedIn</DialogTitle>
          <DialogDescription>Carte anonyme du besoin {v.short} : modifiez les champs, l'aperçu se met à jour. Le nom du client n'apparaît jamais.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="li-title">Intitulé</Label><Input id="li-title" value={f.title} onChange={set("title")} /></div>
            <div className="space-y-1.5"><Label htmlFor="li-sector">Secteur</Label><Input id="li-sector" value={f.sector} onChange={set("sector")} placeholder="Ex : SaaS B2B, scale-up" /></div>
            <div className="space-y-1.5">
              <Label htmlFor="li-mission">La mission (2 lignes)</Label>
              <Textarea id="li-mission" rows={3} value={f.mission} onChange={set("mission")} placeholder="Ex : Structurer la fonction finance après une levée de fonds et piloter le reporting investisseurs." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label htmlFor="li-loc">Lieu</Label><Input id="li-loc" value={f.location} onChange={set("location")} /></div>
              <div className="space-y-1.5"><Label htmlFor="li-remote">Télétravail</Label><Input id="li-remote" value={f.remote} onChange={set("remote")} /></div>
              <div className="space-y-1.5"><Label htmlFor="li-duration">Durée</Label><Input id="li-duration" value={f.duration} onChange={set("duration")} placeholder="Ex : 6 mois" /></div>
              <div className="space-y-1.5"><Label htmlFor="li-tjm">TJM freelance</Label><Input id="li-tjm" value={f.tjm} onChange={set("tjm")} /></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="li-cta">Appel à l'action</Label><Input id="li-cta" value={f.cta} onChange={set("cta")} /></div>
            <p className="text-xs text-muted-foreground">Le TJM affiché est celui du freelance (budget client hors marge Kistone).</p>
            {leaks.length > 0 && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Attention : « {leaks.join(", ")} » apparaît dans la carte. Retirez-le pour garder le besoin anonyme.
              </p>
            )}
          </div>
          <div className="space-y-3">
            <canvas ref={canvasRef} className="aspect-[4/5] w-full rounded-xl border shadow-sm" aria-label="Aperçu de la carte LinkedIn" />
            <div className="flex flex-col gap-2">
              {li?.connected ? (
                <>
                  <Button onClick={() => setConfirming(true)} disabled={leaks.length > 0 || publishing} className="gap-2 bg-[#0A66C2] text-white hover:bg-[#0A66C2]/90">
                    {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Publier sur LinkedIn
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">Connecté en tant que {li.name ?? "votre profil"}</p>
                </>
              ) : li?.configured ? (
                <Button onClick={connectLinkedin} className="gap-2 bg-[#0A66C2] text-white hover:bg-[#0A66C2]/90"><Linkedin className="h-4 w-4" />Connecter LinkedIn</Button>
              ) : null}
              <Button variant={li?.connected || li?.configured ? "outline" : "default"} onClick={publish} disabled={leaks.length > 0} className="gap-2"><Linkedin className="h-4 w-4" />Publication assistée (coller l'image)</Button>
              <Button variant="outline" onClick={download} disabled={leaks.length > 0} className="gap-2"><Download className="h-4 w-4" />Télécharger l'image (PNG)</Button>
              <Button variant="outline" onClick={copyPost} disabled={leaks.length > 0} className="gap-2"><Copy className="h-4 w-4" />Copier le texte du post</Button>
            </div>
          </div>
        </div>
      </DialogContent>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publier sur LinkedIn ?</AlertDialogTitle>
            <AlertDialogDescription>
              La carte et son texte seront publiés publiquement sur le profil de {li?.name ?? "votre compte LinkedIn"}. Vérifiez qu'aucune information
              confidentielle n'y figure : une fois en ligne, le post se supprime depuis LinkedIn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={publishing}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); publishDirect(); }} disabled={publishing}>
              {publishing ? "Publication…" : "Publier"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

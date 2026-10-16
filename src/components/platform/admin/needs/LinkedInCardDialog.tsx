import { useEffect, useMemo, useRef, useState } from "react";
import { Linkedin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { freelanceRate } from "@/lib/pricing";
import { verticalOf } from "@/lib/verticals";
import { durationLabel } from "@/components/platform/MissionDurationField";
import { remoteLabel } from "./needsModel";
import { drawCard, findLeaks, priceTile, slugify, wordRe, type CardSpec } from "../linkedin/linkedinCard";
import LinkedInPublishActions from "../linkedin/LinkedInPublishActions";

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

/** Retire le nom du client (et du contact) d'un texte, pour garder la carte anonyme. */
function anonymize(text: string, need: CardNeed): string {
  let out = text;
  for (const name of [need.company_name, need.contact_name]) {
    const n = name?.trim();
    if (n && n.length > 1) out = out.replace(wordRe(n, "giu"), "notre client");
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

/**
 * Carte récapitulative d'un besoin, à publier sur LinkedIn : anonyme (jamais le nom du client),
 * modifiable champ par champ, téléchargeable en PNG, avec le texte du post à copier.
 */
export default function LinkedInCardDialog({ need, open, onOpenChange }: { need: CardNeed; open: boolean; onOpenChange: (o: boolean) => void }) {
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

  const spec = useMemo<CardSpec>(() => ({
    chip: "Mission freelance",
    vertical: need.vertical,
    title: f.title,
    titleFallback: "Intitulé de la mission",
    meta: f.sector ? `Secteur · ${f.sector}` : "",
    pitch: f.mission,
    tiles: [
      { label: "LIEU", value: f.location },
      { label: "TÉLÉTRAVAIL", value: f.remote },
      { label: "DURÉE", value: f.duration },
      priceTile("TJM FREELANCE", f.tjm),
    ],
    cta: f.cta || "Intéressé·e ? Écrivez-moi en message privé",
  }), [f, need.vertical]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => { if (canvasRef.current) drawCard(canvasRef.current, spec); }, 60);
    return () => window.clearTimeout(t);
  }, [open, spec]);

  // Garde-fou d'anonymat : le nom du client ne doit apparaître nulle part
  const leaks = findLeaks([need.company_name, need.contact_name], Object.values(f));

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

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
    "#freelance #IA #kistone",
  ].filter((l): l is string => typeof l === "string").join("\n").replace(/\n{3,}/g, "\n\n");

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
            <LinkedInPublishActions
              canvasRef={canvasRef}
              open={open}
              postText={postText}
              altText={`Mission freelance : ${f.title}`}
              fileName={`kistone-mission-${slugify(f.title || "mission")}`}
              blocked={leaks.length > 0}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

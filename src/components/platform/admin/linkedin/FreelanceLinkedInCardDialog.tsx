import { useEffect, useMemo, useRef, useState } from "react";
import { Linkedin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { clientPrice } from "@/lib/pricing";
import { rhythmLabel, verticalOf } from "@/lib/verticals";
import { remoteLabel } from "../needs/needsModel";
import { drawCard, findLeaks, priceTile, slugify, wordRe, type CardSpec } from "./linkedinCard";
import LinkedInPublishActions from "./LinkedInPublishActions";

/** Profil freelance tel que lu dans l'admin (seuls les champs utiles à la carte). */
export type CardFreelance = {
  first_name: string;
  last_name: string;
  email?: string | null;
  photo_url?: string | null;
  job_title?: string | null;
  vertical?: string | null;
  specialties?: string[] | null;
  skills?: string[] | null;
  intro_text?: string | null;
  years_experience?: number | null;
  weekly_capacity?: number | null;
  mobility?: string[] | null;
  remote_preference?: string | null;
  available?: boolean | null;
  availability_date?: string | null;
  tjm?: number | null;
  clients?: string[] | null;
  previous_companies?: string[] | null;
  missions?: { client_name?: string }[] | null;
};

type Fields = { title: string; meta: string; pitch: string; location: string; remote: string; availability: string; tjm: string; cta: string };

/** Noms qui identifieraient le freelance : son nom, son e-mail, ses clients et anciens employeurs. */
function identifyingTerms(p: CardFreelance): string[] {
  return [
    p.last_name,
    p.first_name,
    p.email?.split("@")[0],
    ...(p.clients ?? []),
    ...(p.previous_companies ?? []),
    ...(Array.isArray(p.missions) ? p.missions.map((m) => m.client_name) : []),
  ].filter((t): t is string => !!t && t.trim().length > 2);
}

/** Les deux premières phrases de la présentation qui ne citent ni nom ni entreprise. */
function profilePitch(p: CardFreelance, terms: string[]): string {
  const text = (p.intro_text ?? "").replace(/\s+/g, " ").trim();
  const sentences = (text.match(/[^.!?]+[.!?]?/g) ?? []).map((s) => s.trim()).filter((s) => s && !terms.some((t) => wordRe(t).test(s)));
  const pitch = sentences.slice(0, 2).join(" ").slice(0, 180);
  if (pitch) return pitch;
  const items = (verticalOf(p.vertical).id === "rpo" ? p.skills : p.specialties) ?? [];
  return items.length ? `Expertise : ${items.slice(0, 4).join(", ")}.` : "";
}

function availabilityLabel(p: CardFreelance): string {
  if (p.available !== false) return "Immédiate";
  if (!p.availability_date) return "À confirmer";
  const d = new Date(p.availability_date);
  return d <= new Date() ? "Immédiate" : `Dès le ${d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`;
}

/**
 * Carte LinkedIn d'un profil freelance : anonyme (ni nom, ni contact, ni client, ni employeur),
 * photo facultative, modifiable champ par champ, publiable comme la carte d'un besoin.
 */
export default function FreelanceLinkedInCardDialog({ profile, open, onOpenChange }: { profile: CardFreelance; open: boolean; onOpenChange: (o: boolean) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const v = verticalOf(profile.vertical);
  const terms = useMemo(() => identifyingTerms(profile), [profile]);
  const initial = useMemo<Fields>(() => {
    let title = (profile.job_title ?? "").trim();
    for (const t of terms) title = title.replace(wordRe(t, "giu"), "").replace(/\s{2,}/g, " ").replace(/^[\s,·@-]+|[\s,·@-]+$/g, "");
    return {
      title: title || (v.id === "rpo" ? "Tech recruiter freelance" : `${v.short} freelance`),
      meta: [profile.years_experience ? `${profile.years_experience} ans d'expérience` : "", rhythmLabel(profile.weekly_capacity)].filter(Boolean).join(" · "),
      pitch: profilePitch(profile, terms),
      // Une seule ville : la tuile tient sur une ligne
      location: (profile.mobility ?? [])[0]?.split(",")[0].trim() ?? "",
      remote: profile.remote_preference ? remoteLabel(profile.remote_preference) : "",
      availability: availabilityLabel(profile),
      tjm: profile.tjm ? `${clientPrice(profile.tjm)} €` : "Sur demande",
      cta: "Ce profil vous intéresse ? Écrivez-moi",
    };
  }, [profile, terms, v]);
  const [f, setF] = useState<Fields>(initial);
  const [withPhoto, setWithPhoto] = useState(true);
  useEffect(() => { if (open) setF(initial); }, [open, initial]);

  const spec = useMemo<CardSpec>(() => ({
    chip: "Profil disponible",
    vertical: profile.vertical,
    title: f.title,
    titleFallback: "Intitulé du profil",
    meta: f.meta,
    pitch: f.pitch,
    tiles: [
      { label: "LOCALISATION", value: f.location },
      { label: "TÉLÉTRAVAIL", value: f.remote },
      { label: "DISPONIBILITÉ", value: f.availability },
      priceTile("TJM", f.tjm),
    ],
    cta: f.cta || "Ce profil vous intéresse ? Écrivez-moi",
    photo: withPhoto ? profile.photo_url : null,
  }), [f, withPhoto, profile.vertical, profile.photo_url]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => { if (canvasRef.current) drawCard(canvasRef.current, spec); }, 60);
    return () => window.clearTimeout(t);
  }, [open, spec]);

  // Garde-fou d'anonymat : aucun nom, client ni employeur dans la carte
  const leaks = findLeaks(terms, Object.values(f));

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const postText = [
    `Profil disponible : ${f.title}`,
    f.meta,
    "",
    f.pitch,
    "",
    f.location && `Localisation : ${f.location}${f.remote ? ` (${f.remote.toLowerCase()})` : ""}`,
    f.availability && `Disponibilité : ${f.availability}`,
    f.tjm && `TJM : ${f.tjm}${/€/.test(f.tjm) ? " HT/jour" : ""}`,
    "",
    f.cta,
    "",
    `#freelance #IA #${v.short.replace(/\s+/g, "")} #kistone`,
  ].filter((l): l is string => typeof l === "string").join("\n").replace(/\n{3,}/g, "\n\n");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Linkedin className="h-5 w-5" />Carte LinkedIn du profil</DialogTitle>
          <DialogDescription>Carte anonyme du profil {v.short} : modifiez les champs, l'aperçu se met à jour. Ni nom, ni coordonnées, ni clients, ni anciens employeurs.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="lif-title">Intitulé</Label><Input id="lif-title" value={f.title} onChange={set("title")} /></div>
            <div className="space-y-1.5"><Label htmlFor="lif-meta">Expérience et rythme</Label><Input id="lif-meta" value={f.meta} onChange={set("meta")} placeholder="Ex : 15 ans d'expérience · 3 j / sem" /></div>
            <div className="space-y-1.5">
              <Label htmlFor="lif-pitch">Le profil (2 lignes)</Label>
              <Textarea id="lif-pitch" rows={3} value={f.pitch} onChange={set("pitch")} placeholder="Ex : A structuré la fonction finance de trois scale-ups SaaS, de la levée de fonds au reporting investisseurs." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label htmlFor="lif-loc">Localisation</Label><Input id="lif-loc" value={f.location} onChange={set("location")} /></div>
              <div className="space-y-1.5"><Label htmlFor="lif-remote">Télétravail</Label><Input id="lif-remote" value={f.remote} onChange={set("remote")} /></div>
              <div className="space-y-1.5"><Label htmlFor="lif-dispo">Disponibilité</Label><Input id="lif-dispo" value={f.availability} onChange={set("availability")} /></div>
              <div className="space-y-1.5"><Label htmlFor="lif-tjm">TJM</Label><Input id="lif-tjm" value={f.tjm} onChange={set("tjm")} /></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="lif-cta">Appel à l'action</Label><Input id="lif-cta" value={f.cta} onChange={set("cta")} /></div>
            {profile.photo_url && (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={withPhoto} onCheckedChange={(c) => setWithPhoto(c === true)} />
                Afficher la photo du profil
              </label>
            )}
            <p className="text-xs text-muted-foreground">Le TJM affiché est le prix client (TJM du freelance + 20 %), modifiable.</p>
            {leaks.length > 0 && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Attention : « {leaks.join(", ")} » apparaît dans la carte. Retirez-le pour garder le profil anonyme.
              </p>
            )}
          </div>
          <div className="space-y-3">
            <canvas ref={canvasRef} className="aspect-[4/5] w-full rounded-xl border shadow-sm" aria-label="Aperçu de la carte LinkedIn" />
            <LinkedInPublishActions
              canvasRef={canvasRef}
              open={open}
              postText={postText}
              altText={`Profil freelance disponible : ${f.title}`}
              fileName={`kistone-profil-${slugify(f.title || "profil")}`}
              blocked={leaks.length > 0}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

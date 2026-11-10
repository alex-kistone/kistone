import { useEffect, useMemo, useRef, useState } from "react";
import { Download, FileText, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { verticalOf } from "@/lib/verticals";
import { findLeaks, slugify } from "./linkedinCard";
import { canvasToPdf, drawProfileSheet } from "./profileSheet";
import { initialSheetFields, sheetSpec, type SheetFreelance } from "./profileSheetData";
import ProfileSheetForm from "./ProfileSheetForm";
import LinkedInPublishActions from "./LinkedInPublishActions";

/** Profil freelance tel que lu dans l'admin (seuls les champs utiles aux fiches). */
export type CardFreelance = SheetFreelance;

type Mode = "client" | "linkedin";

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

const download = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/**
 * Fiche profil d'un freelance au modèle « Fiche Leïla », en deux versions :
 *  - fiche client : prénom, clients nommés et chiffres, à envoyer en PDF ou en image ;
 *  - carte LinkedIn : anonyme (métier à la place du prénom, missions sans nom de client),
 *    publiable comme la carte d'un besoin, avec un garde-fou d'anonymat.
 */
export default function FreelanceLinkedInCardDialog({ profile, open, onOpenChange }: { profile: CardFreelance; open: boolean; onOpenChange: (o: boolean) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const v = verticalOf(profile.vertical);
  const terms = useMemo(() => identifyingTerms(profile), [profile]);
  const [mode, setMode] = useState<Mode>("client");
  const initial = useMemo(() => ({ client: initialSheetFields(profile, false), linkedin: initialSheetFields(profile, true) }), [profile]);
  const [fields, setFields] = useState(initial);
  const [withPhoto, setWithPhoto] = useState(true);
  useEffect(() => { if (open) setFields(initial); }, [open, initial]);

  const anonymous = mode === "linkedin";
  const f = fields[mode];
  const spec = useMemo(() => sheetSpec(profile, f, anonymous, withPhoto), [profile, f, anonymous, withPhoto]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => { if (canvasRef.current) drawProfileSheet(canvasRef.current, spec, anonymous ? 1.2 : 2.4); }, 80);
    return () => window.clearTimeout(t);
  }, [open, spec, anonymous]);

  // Garde-fou d'anonymat de la carte LinkedIn : aucun nom, client ni employeur
  const leaks = anonymous ? findLeaks(terms, Object.values(f).map(String)) : [];

  const fileName = `kistone-${anonymous ? "profil" : "fiche"}-${slugify(anonymous ? f.headline || "profil" : `${f.name}-${f.headline}`)}`;
  const savePng = () => canvasRef.current?.toBlob((b) => b && download(b, `${fileName}.png`), "image/png");
  const savePdf = async () => { if (canvasRef.current) download(await canvasToPdf(canvasRef.current), `${fileName}.pdf`); };

  const postText = [
    `Profil disponible : ${f.headline}`,
    f.meta,
    "",
    f.specialties && `Spécialités : ${f.specialties}`,
    f.sectors && `Secteurs : ${f.sectors}`,
    f.english && `Anglais : ${f.english.toLowerCase()}`,
    `Disponibilité : ${f.availability}${f.availabilityNote ? ` · ${f.availabilityNote}` : ""}`,
    f.tjm && `TJM : ${f.tjm}${/€/.test(f.tjm) ? " HT/jour" : ""}`,
    "",
    "Ce profil vous intéresse ? Écrivez-moi.",
    "",
    `#freelance #recrutement #${v.short.replace(/\s+/g, "")} #kistone`,
  ].filter((l): l is string => typeof l === "string").join("\n").replace(/\n{3,}/g, "\n\n");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Fiche profil</DialogTitle>
          <DialogDescription>
            {anonymous
              ? "Carte LinkedIn anonyme : ni nom, ni coordonnées, ni client. Les missions sont décrites sans nom d'entreprise."
              : "Fiche nominative à envoyer à un client : prénom, clients et chiffres. Ne la publiez pas : utilisez la carte LinkedIn."}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(m) => setMode(m as Mode)}>
          <TabsList>
            <TabsTrigger value="client" className="gap-1.5"><FileText className="h-4 w-4" />Fiche client</TabsTrigger>
            <TabsTrigger value="linkedin" className="gap-1.5"><Linkedin className="h-4 w-4" />Carte LinkedIn</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-3">
            <ProfileSheetForm fields={f} onChange={(next) => setFields({ ...fields, [mode]: next })} anonymous={anonymous} tjmLabel="TJM" />
            {profile.photo_url && (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={withPhoto} onCheckedChange={(c) => setWithPhoto(c === true)} />
                Afficher la photo du profil
              </label>
            )}
            {leaks.length > 0 && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Attention : « {leaks.join(", ")} » apparaît dans la carte. Retirez-le pour garder le profil anonyme.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <canvas ref={canvasRef} className="aspect-[4/5] w-full rounded-xl border shadow-sm" aria-label="Aperçu de la fiche profil" />
            {anonymous ? (
              <LinkedInPublishActions
                canvasRef={canvasRef}
                open={open}
                postText={postText}
                altText={`Profil freelance disponible : ${f.headline}`}
                fileName={fileName}
                blocked={leaks.length > 0}
              />
            ) : (
              <div className="flex flex-col gap-2">
                <Button onClick={savePdf} className="gap-2"><FileText className="h-4 w-4" />Télécharger la fiche (PDF)</Button>
                <Button variant="outline" onClick={savePng} className="gap-2"><Download className="h-4 w-4" />Télécharger l'image (PNG)</Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

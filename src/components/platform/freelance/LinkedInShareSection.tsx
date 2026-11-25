import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { verticalOf } from "@/lib/verticals";
import { slugify } from "../admin/linkedin/linkedinCard";
import { drawProfileSheet } from "../admin/linkedin/profileSheet";
import { availabilityOf, initialSheetFields, sheetSpec, type SheetFields, type SheetFreelance } from "../admin/linkedin/profileSheetData";
import LinkedInPublishActions from "../admin/linkedin/LinkedInPublishActions";

/** Lien du post : l'accueil de Kistone (pas de page profil publique). */
const KISTONE_URL = "https://kistone.fr/";
/** Fin du post, toujours ajoutée : la mention demandée et le lien vers Kistone. */
const POST_FOOTER = `Retrouvez-moi sur Kistone : ${KISTONE_URL}`;

/** Début du post proposé par défaut (modifiable) : disponibilité, métier, spécialités. */
function defaultBody(p: SheetFreelance, f: SheetFields): string {
  const dispo = availabilityOf(p);
  const v = verticalOf(p.vertical);
  return [
    dispo.available
      ? `Je suis disponible pour de nouvelles missions de ${f.headline}.`
      : p.availability_date
        ? `Je serai disponible ${dispo.value.toLowerCase()} pour de nouvelles missions de ${f.headline}.`
        : `J'étudie de nouvelles missions de ${f.headline}.`,
    "",
    f.specialties && `Mes spécialités : ${f.specialties}.`,
    f.sectors && `Secteurs : ${f.sectors}.`,
    "",
    `#freelance #recrutement #${v.short.replace(/\s+/g, "")}`,
  ].filter((l): l is string => typeof l === "string").join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * « Ma fiche LinkedIn » (espace freelance) : le freelance publie sa fiche sur son propre LinkedIn,
 * avec la mention « Retrouvez-moi sur Kistone » et un lien vers kistone.fr. Pas de page publique :
 * la fiche fait connaître Kistone à son réseau. Prénom et photo, missions sans nom de client,
 * TJM client (TJM du freelance = 80 % du prix, comme facturé par Kistone), modifiable.
 */
export default function LinkedInShareSection({ userId }: { userId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [profile, setProfile] = useState<SheetFreelance | null>(null);
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState<SheetFields | null>(null);
  const [withPhoto, setWithPhoto] = useState(true);
  const [body, setBody] = useState("");

  useEffect(() => {
    supabase.from("recruiter_profiles").select("*").eq("user_id", userId).maybeSingle().then(({ data }) => {
      const p = data as unknown as SheetFreelance | null;
      if (p) {
        // Missions sans nom de client (anonymes), mais le prénom du freelance en grand titre
        const f = { ...initialSheetFields(p, true), name: p.first_name.trim().split(/\s+/)[0] };
        setProfile(p);
        setFields(f);
        setWithPhoto(Boolean(p.photo_url));
        setBody(defaultBody(p, f));
      }
      setLoading(false);
    });
  }, [userId]);

  const spec = useMemo(() => {
    if (!profile || !fields) return null;
    return {
      ...sheetSpec(profile, fields, true, withPhoto),
      footer: "Retrouvez-moi sur kistone.fr",
    };
  }, [profile, fields, withPhoto]);

  useEffect(() => {
    if (!spec) return;
    const t = window.setTimeout(() => { if (canvasRef.current) drawProfileSheet(canvasRef.current, spec, 2.4); }, 80);
    return () => window.clearTimeout(t);
  }, [spec]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!profile || !fields) {
    return <p className="text-muted-foreground">Complétez d'abord votre profil (onglet « Mon profil ») pour préparer votre fiche.</p>;
  }

  const set = (k: keyof SheetFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields({ ...fields, [k]: k === "englishLevel" ? Math.max(0, Math.min(5, Number(e.target.value) || 0)) : e.target.value });
  const postText = `${body.trim()}\n\n${POST_FOOTER}`;
  const fileName = `kistone-${slugify(`${fields.name}-${fields.headline}`)}`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ma fiche</CardTitle>
          <CardDescription>
            Pré-remplie depuis votre profil, modifiable ici sans changer votre profil. Vos missions sont décrites sans nom de client.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label htmlFor="sh-name">Prénom</Label><Input id="sh-name" value={fields.name} onChange={set("name")} /></div>
              <div className="space-y-1.5"><Label htmlFor="sh-head">Intitulé</Label><Input id="sh-head" value={fields.headline} onChange={set("headline")} /></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="sh-meta">Ligne d'information</Label><Input id="sh-meta" value={fields.meta} onChange={set("meta")} placeholder="Ex : 11 ans d'expérience · RPO freelance · Temps plein" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label htmlFor="sh-spec">Spécialités (virgules)</Label><Input id="sh-spec" value={fields.specialties} onChange={set("specialties")} /></div>
              <div className="space-y-1.5"><Label htmlFor="sh-sect">Secteurs (virgules)</Label><Input id="sh-sect" value={fields.sectors} onChange={set("sectors")} /></div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sh-missions">Missions mises en avant (3 au plus)</Label>
              <Textarea id="sh-missions" rows={4} value={fields.clients} onChange={set("clients")} className="font-mono text-xs" />
              <p className="text-xs text-muted-foreground">
                Une ligne par mission : Type de mission | sous-titre | chiffres séparés par « ; ». Ex : Recrutement Data & IA | Scale-up e-commerce | 29 postes ; 19 jours de time to fill.
                Pas de nom de client.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label htmlFor="sh-en">Anglais</Label><Input id="sh-en" value={fields.english} onChange={set("english")} placeholder="Courant" /></div>
              <div className="space-y-1.5"><Label htmlFor="sh-enl">Niveau (0 à 5)</Label><Input id="sh-enl" type="number" min={0} max={5} value={fields.englishLevel} onChange={set("englishLevel")} /></div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="sh-tjm">TJM client (€ HT / jour)</Label>
                <Input id="sh-tjm" value={fields.tjm} onChange={set("tjm")} placeholder="Sur demande" />
                <p className="text-xs text-muted-foreground">
                  Le tarif payé par le client : votre TJM en représente 80 %, la part Kistone 20 %. Écrivez « Sur demande » pour ne pas l'afficher.
                </p>
              </div>
              <div className="space-y-1.5"><Label htmlFor="sh-dispo">Disponibilité</Label><Input id="sh-dispo" value={fields.availability} onChange={set("availability")} /></div>
              <div className="space-y-1.5"><Label htmlFor="sh-note">Lieu et télétravail</Label><Input id="sh-note" value={fields.availabilityNote} onChange={set("availabilityNote")} placeholder="Île-de-France · remote flexible" /></div>
            </div>
            {profile.photo_url && (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={withPhoto} onCheckedChange={(c) => setWithPhoto(c === true)} />
                Afficher ma photo
              </label>
            )}
          </div>
          <canvas ref={canvasRef} className="aspect-[4/5] w-full rounded-xl border shadow-sm" aria-label="Aperçu de ma fiche" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Publier sur LinkedIn</CardTitle>
          <CardDescription>
            Le post part de votre compte LinkedIn : l'image est copiée, LinkedIn s'ouvre avec le texte, il vous reste à coller l'image et publier.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-1.5">
            <Label htmlFor="sh-post">Texte du post</Label>
            <Textarea id="sh-post" rows={9} value={body} onChange={(e) => setBody(e.target.value)} />
            <p className="rounded-md bg-muted px-3 py-2 text-sm">
              Ajouté automatiquement à la fin du post : <span className="font-medium">{POST_FOOTER}</span>
            </p>
          </div>
          <LinkedInPublishActions
            canvasRef={canvasRef}
            open
            postText={postText}
            altText={`Fiche freelance de ${fields.name}, ${fields.headline}, sur Kistone`}
            fileName={fileName}
            blocked={false}
            allowDirect={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}

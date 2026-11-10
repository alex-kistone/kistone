import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, ExternalLink, FileText, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { verticalOf } from "@/lib/verticals";
import { slugify } from "../admin/linkedin/linkedinCard";
import { canvasToPdf, drawProfileSheet } from "../admin/linkedin/profileSheet";
import { availabilityOf, initialSheetFields, sheetSpec, type SheetFields, type SheetFreelance } from "../admin/linkedin/profileSheetData";
import ProfileSheetForm from "../admin/linkedin/ProfileSheetForm";
import LinkedInPublishActions from "../admin/linkedin/LinkedInPublishActions";

const SITE = "https://kistone.fr";

/** Adresse publique du profil d'un freelance (lien partagé sur LinkedIn). */
const publicProfilePath = (id: string) => `/profil/${id}`;

type Row = SheetFreelance & { id: string; public_profile?: boolean | null };

/** Texte du post LinkedIn proposé par défaut : disponibilité, métier, lien vers la page publique. */
function defaultPost(p: Row, f: SheetFields, url: string): string {
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
    `Consultez mon profil sur Kistone : ${url}`,
    "",
    `#freelance #recrutement #${v.short.replace(/\s+/g, "")} #kistone`,
  ].filter((l): l is string => typeof l === "string").join("\n").replace(/\n{3,}/g, "\n\n");
}

/**
 * « Promouvoir mon profil » (espace freelance) : le freelance active sa page publique
 * kistone.fr/profil/<id>, prépare sa fiche (prénom, photo, clients, son TJM) et la publie
 * sur son propre LinkedIn avec un texte qui renvoie vers cette page.
 */
export default function ProfilePromoteSection({ userId }: { userId: string }) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [profile, setProfile] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState<SheetFields | null>(null);
  const [withPhoto, setWithPhoto] = useState(true);
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [post, setPost] = useState("");

  useEffect(() => {
    supabase.from("recruiter_profiles" as never).select("*").eq("user_id", userId).maybeSingle().then(({ data }) => {
      const p = data as unknown as Row | null;
      if (p) {
        const f = initialSheetFields(p, false, true);
        setProfile(p);
        setFields(f);
        setIsPublic(!!p.public_profile);
        setPost(defaultPost(p, f, `${SITE}${publicProfilePath(p.id)}`));
      }
      setLoading(false);
    });
  }, [userId]);

  const spec = useMemo(() => (profile && fields ? sheetSpec(profile, fields, false, withPhoto) : null), [profile, fields, withPhoto]);

  useEffect(() => {
    if (!spec) return;
    const t = window.setTimeout(() => { if (canvasRef.current) drawProfileSheet(canvasRef.current, spec, 2.4); }, 80);
    return () => window.clearTimeout(t);
  }, [spec]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!profile || !fields) {
    return <p className="text-muted-foreground">Complétez d'abord votre profil (onglet « Mon profil ») pour pouvoir le promouvoir.</p>;
  }

  const path = publicProfilePath(profile.id);
  const url = `${SITE}${path}`;
  const fileName = `kistone-${slugify(`${fields.name}-${fields.headline}`)}`;

  const togglePublic = async (next: boolean) => {
    setSaving(true);
    const { error } = await supabase.from("recruiter_profiles" as never).update({ public_profile: next } as never).eq("id", profile.id);
    setSaving(false);
    if (error) {
      toast({ title: "Modification impossible", description: error.message, variant: "destructive" });
      return;
    }
    setIsPublic(next);
    toast({ title: next ? "Votre page publique est en ligne" : "Votre page publique est désactivée" });
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    toast({ title: "Lien copié" });
  };

  const savePdf = async () => {
    if (!canvasRef.current) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(await canvasToPdf(canvasRef.current));
    a.download = `${fileName}.pdf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Globe className="h-5 w-5" />Ma page profil publique</CardTitle>
          <CardDescription>
            Une page sur kistone.fr avec votre prénom, votre photo, votre métier, vos clients et vos missions. Ni nom de famille, ni
            coordonnées, ni TJM : les clients intéressés passent par Kistone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-3">
            <Switch checked={isPublic} onCheckedChange={togglePublic} disabled={saving} />
            <span className="text-sm font-medium">{isPublic ? "Page publique activée" : "Page publique désactivée"}</span>
          </label>
          {isPublic && (
            <div className="flex flex-wrap items-center gap-2">
              <code className="rounded-md bg-muted px-2 py-1 text-xs">{url}</code>
              <Button size="sm" variant="outline" onClick={copyLink} className="gap-1.5"><Copy className="h-3.5 w-3.5" />Copier</Button>
              <Button size="sm" variant="outline" asChild className="gap-1.5">
                <a href={path} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" />Voir ma page</a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ma fiche à partager</CardTitle>
          <CardDescription>
            Pré-remplie depuis votre profil, modifiable ici sans changer votre profil. Vérifiez que vos clients acceptent d'être cités.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-3">
            <ProfileSheetForm fields={fields} onChange={setFields} anonymous={false} tjmLabel="TJM" />
            {profile.photo_url && (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={withPhoto} onCheckedChange={(c) => setWithPhoto(c === true)} />
                Afficher ma photo
              </label>
            )}
          </div>
          <div className="space-y-3">
            <canvas ref={canvasRef} className="aspect-[4/5] w-full rounded-xl border shadow-sm" aria-label="Aperçu de ma fiche" />
            <Button variant="outline" onClick={savePdf} className="w-full gap-2"><FileText className="h-4 w-4" />Télécharger la fiche (PDF)</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Publier sur LinkedIn</CardTitle>
          <CardDescription>Le post part de votre compte LinkedIn, avec votre fiche en image et le lien vers votre page Kistone.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="promo-post">Texte du post</Label>
            <Textarea id="promo-post" rows={10} value={post} onChange={(e) => setPost(e.target.value)} />
          </div>
          {!isPublic && (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Activez votre page publique ci-dessus : sans elle, le lien du post mène à une page introuvable.
            </p>
          )}
          <div className="max-w-sm">
            <LinkedInPublishActions
              canvasRef={canvasRef}
              open
              postText={post}
              altText={`Fiche profil Kistone : ${fields.name}, ${fields.headline}`}
              fileName={fileName}
              blocked={!isPublic}
              allowDirect={false}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

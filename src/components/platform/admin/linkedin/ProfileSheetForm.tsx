import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SheetFields } from "./profileSheetData";

type Props = {
  fields: SheetFields;
  onChange: (fields: SheetFields) => void;
  /** Carte anonyme : métier à la place du prénom, missions sans client, pas d'autres clients. */
  anonymous: boolean;
  tjmLabel?: string;
};

/** Champs modifiables d'une fiche profil (fiche admin et carte que le freelance publie). */
export default function ProfileSheetForm({ fields: f, onChange, anonymous, tjmLabel = "TJM client" }: Props) {
  const set = (k: keyof SheetFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...f, [k]: k === "englishLevel" ? Math.max(0, Math.min(5, Number(e.target.value) || 0)) : e.target.value });

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label htmlFor="ps-name">{anonymous ? "Grand titre" : "Prénom"}</Label><Input id="ps-name" value={f.name} onChange={set("name")} /></div>
        <div className="space-y-1.5"><Label htmlFor="ps-head">Intitulé</Label><Input id="ps-head" value={f.headline} onChange={set("headline")} /></div>
      </div>
      <div className="space-y-1.5"><Label htmlFor="ps-meta">Ligne d'information</Label><Input id="ps-meta" value={f.meta} onChange={set("meta")} placeholder="Ex : 11 ans d'expérience · RPO freelance · ex-Head of TA" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label htmlFor="ps-spec">Spécialités (virgules)</Label><Input id="ps-spec" value={f.specialties} onChange={set("specialties")} /></div>
        <div className="space-y-1.5"><Label htmlFor="ps-sect">Secteurs (virgules)</Label><Input id="ps-sect" value={f.sectors} onChange={set("sectors")} /></div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ps-clients">{anonymous ? "Missions mises en avant (3 au plus)" : "Clients mis en avant (3 au plus)"}</Label>
        <Textarea id="ps-clients" rows={4} value={f.clients} onChange={set("clients")} className="font-mono text-xs" />
        <p className="text-xs text-muted-foreground">
          Une ligne par {anonymous ? "mission" : "client"} : {anonymous ? "Type de mission" : "Nom"} | sous-titre | chiffres séparés par « ; ». Ex : {anonymous ? "Recrutement Data & IA | Scale-up e-commerce" : "Veepee | Tech, IA & corporate"} | 29 postes · FR, DE ; 19 jours de time to fill
        </p>
      </div>
      {!anonymous && (
        <div className="space-y-1.5">
          <Label htmlFor="ps-others">Autres clients (3 au plus)</Label>
          <Textarea id="ps-others" rows={3} value={f.others} onChange={set("others")} className="font-mono text-xs" placeholder="Sopra Steria | Recrutement IT" />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label htmlFor="ps-en">Anglais</Label><Input id="ps-en" value={f.english} onChange={set("english")} placeholder="Bilingue" /></div>
        <div className="space-y-1.5"><Label htmlFor="ps-enl">Niveau (0 à 5)</Label><Input id="ps-enl" type="number" min={0} max={5} value={f.englishLevel} onChange={set("englishLevel")} /></div>
        <div className="space-y-1.5"><Label htmlFor="ps-tjm">{tjmLabel}</Label><Input id="ps-tjm" value={f.tjm} onChange={set("tjm")} /></div>
        <div className="space-y-1.5"><Label htmlFor="ps-dispo">Disponibilité</Label><Input id="ps-dispo" value={f.availability} onChange={set("availability")} /></div>
      </div>
      <div className="space-y-1.5"><Label htmlFor="ps-note">Lieu et télétravail</Label><Input id="ps-note" value={f.availabilityNote} onChange={set("availabilityNote")} placeholder="Île-de-France · remote flexible" /></div>
    </>
  );
}

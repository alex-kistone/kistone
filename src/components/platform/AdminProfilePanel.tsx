import { useState, useEffect } from "react";
import { Star, Medal, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { JARVI_TECH_SPECIALTIES } from "@/lib/jarvi";

/** Même liste que le champ Jarvi « Spécialités RPO Tech » (synchro 1 pour 1). */
const TECH_SPECIALTIES = JARVI_TECH_SPECIALTIES;

/** Libellés de la note admin : ils décrivent aussi son effet sur le matching. */
const RATING_LABELS = ["Non noté", "Ne matche jamais", "Pas ouf", "Pas mal", "Top profil", "Top profil prioritaire"];
const ENGLISH_LABELS = ["Non évalué", "Débutant", "Intermédiaire", "Avancé", "Courant", "Natif / bilingue"];

/** Étoiles 1 à 5 ; un nouveau clic sur la note courante la retire. */
function StarRating({ value, onChange, labels, label }: { value: number; onChange: (v: number) => void; labels: string[]; label: string }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} étoile${star > 1 ? "s" : ""} : ${labels[star]}`}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(value === star ? 0 : star)}
          className="transition-transform hover:scale-110"
        >
          <Star className={`h-6 w-6 ${(hover || value) >= star ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
        </button>
      ))}
      <span className="ml-2 text-xs text-muted-foreground">{labels[hover || value]}</span>
    </div>
  );
}

interface AdminProfilePanelProps {
  profileId: string;
  profileName: string;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

const AdminProfilePanel = ({ profileId, profileName, open, onClose, onSaved }: AdminProfilePanelProps) => {
  const { toast } = useToast();
  const [comments, setComments] = useState("");
  const [rating, setRating] = useState(0);
  const [englishRating, setEnglishRating] = useState(0);
  const [superTam, setSuperTam] = useState(false);
  const [techSpecialties, setTechSpecialties] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && profileId) loadAdminFields();
  }, [open, profileId]);

  const loadAdminFields = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("recruiter_profiles" as any)
      .select("admin_comments, admin_rating, admin_english_rating, super_tam, tech_specialties")
      .eq("id", profileId)
      .single();

    if (!error && data) {
      const d = data as any;
      setComments(d.admin_comments || "");
      setRating(d.admin_rating || 0);
      setEnglishRating(d.admin_english_rating || 0);
      setSuperTam(d.super_tam || false);
      setTechSpecialties(d.tech_specialties || []);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("recruiter_profiles" as any)
      .update({
        admin_comments: comments || null,
        admin_rating: rating,
        admin_english_rating: englishRating || null,
        super_tam: superTam,
        tech_specialties: techSpecialties,
      } as any)
      .eq("id", profileId);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Enregistré" });
      // Répercute les notes et commentaires dans Jarvi (en arrière-plan, non bloquant).
      supabase.functions.invoke("jarvi-sync", { body: { profile_id: profileId } }).catch(() => undefined);
      onSaved?.();
    }
    setSaving(false);
  };

  const toggleSpecialty = (spec: string) => {
    setTechSpecialties((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="relative mx-4 w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-1 text-lg font-bold">Fiche admin</h2>
        <p className="mb-6 text-sm text-muted-foreground">{profileName}</p>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Chargement...</div>
        ) : (
          <div className="space-y-6">
            {/* Rating */}
            <div>
              <Label className="mb-2 block text-sm font-medium">Note admin</Label>
              <StarRating value={rating} onChange={setRating} labels={RATING_LABELS} label="Note admin" />
            </div>

            {/* Anglais */}
            <div>
              <Label className="mb-2 block text-sm font-medium">Niveau d'anglais</Label>
              <StarRating value={englishRating} onChange={setEnglishRating} labels={ENGLISH_LABELS} label="Niveau d'anglais" />
              <p className="mt-1 text-xs text-muted-foreground">Prime sur le niveau déclaré par le freelance pour le matching.</p>
            </div>

            {/* Super TAM */}
            <div className="flex items-center gap-3">
              <Switch checked={superTam} onCheckedChange={setSuperTam} id="super-tam" />
              <Label htmlFor="super-tam" className="flex items-center gap-2 text-sm font-medium">
                <Medal className="h-4 w-4 text-amber-500" />
                Badge Super TAM
              </Label>
            </div>

            {/* Tech Specialties */}
            <div>
              <Label className="mb-2 block text-sm font-medium">Spécialités Tech</Label>
              <div className="flex flex-wrap gap-2">
                {TECH_SPECIALTIES.map((spec) => (
                  <Badge
                    key={spec}
                    variant={techSpecialties.includes(spec) ? "default" : "outline"}
                    className="cursor-pointer select-none transition-colors"
                    onClick={() => toggleSpecialty(spec)}
                  >
                    {spec}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div>
              <Label className="mb-2 block text-sm font-medium">Commentaires admin</Label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Notes internes sur ce profil..."
                rows={4}
              />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProfilePanel;

import { useState, useEffect } from "react";
import { Star, Medal, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const TECH_SPECIALTIES = [
  "Dev JS",
  "Mobile",
  "Infra",
  "Cloud/Devops",
  "Cyber",
  "Java",
  ".NET",
  "ERP",
  "CRM",
  "PHP",
];

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
  const [hoverRating, setHoverRating] = useState(0);
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
      .select("admin_comments, admin_rating, super_tam, tech_specialties")
      .eq("id", profileId)
      .single();

    if (!error && data) {
      const d = data as any;
      setComments(d.admin_comments || "");
      setRating(d.admin_rating || 0);
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
        super_tam: superTam,
        tech_specialties: techSpecialties,
      } as any)
      .eq("id", profileId);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Enregistré" });
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
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(rating === star ? 0 : star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        (hoverRating || rating) >= star
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-xs text-muted-foreground">
                  {rating === 0 && "Non noté"}
                  {rating === 1 && "Ne jamais suggérer"}
                  {rating === 2 && "Moyen"}
                  {rating === 3 && "Pas mal"}
                  {rating === 4 && "Très bon"}
                  {rating === 5 && "Super profil !"}
                </span>
              </div>
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

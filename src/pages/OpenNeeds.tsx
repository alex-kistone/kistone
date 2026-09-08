import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, MapPin, Monitor, Euro, Send, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/KistoneHeader";
import SEO from "@/components/SEO";

interface OpenNeed {
  id: string;
  job_title: string;
  profile_types: string[];
  budget_tjm_min: number | null;
  budget_tjm_max: number | null;
  mission_location: string;
  remote_policy: string;
  description: string | null;
  created_at: string;
}

const REMOTE_LABELS: Record<string, string> = {
  "on-site": "Sur site",
  hybrid: "Hybride",
  remote: "Full remote",
};

const OpenNeeds = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [needs, setNeeds] = useState<OpenNeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [recruiterProfileId, setRecruiterProfileId] = useState<string | null>(null);
  const [appliedNeedIds, setAppliedNeedIds] = useState<Set<string>>(new Set());
  const [applyingToId, setApplyingToId] = useState<string | null>(null);
  const [motivation, setMotivation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/register");
      return;
    }

    // Load recruiter profile id
    const { data: profile } = await supabase
      .from("recruiter_profiles")
      .select("id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!profile) {
      navigate("/profile");
      return;
    }
    setRecruiterProfileId(profile.id);

    // Load open needs via secure view (no contact info exposed)
    const { data: needsData } = await supabase
      .from("client_needs_open" as any)
      .select("id, job_title, profile_types, budget_tjm_min, budget_tjm_max, mission_location, remote_policy, description, created_at")
      .order("created_at", { ascending: false });

    setNeeds((needsData as unknown as OpenNeed[]) || []);

    // Load existing applications
    const { data: apps } = await supabase
      .from("need_applications" as any)
      .select("need_id")
      .eq("recruiter_profile_id", profile.id);

    if (apps) {
      setAppliedNeedIds(new Set((apps as any[]).map((a) => a.need_id)));
    }

    setLoading(false);
  };

  const handleApply = async (needId: string) => {
    if (!recruiterProfileId) return;
    setSubmitting(true);

    const { error } = await supabase
      .from("need_applications" as any)
      .insert({
        need_id: needId,
        recruiter_profile_id: recruiterProfileId,
        motivation: motivation.trim() || null,
      });

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setAppliedNeedIds((prev) => new Set([...prev, needId]));
      toast({ title: "Candidature envoyée !", description: "L'équipe Connect2 reviendra vers vous." });
      setApplyingToId(null);
      setMotivation("");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20 text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Missions ouvertes — Kistone Talent"
        description="Découvrez les missions de recrutement ouvertes chez Kistone : RPO, sourcing Tech, Data, Product. Postulez en quelques clics si votre profil correspond."
        path="/open-needs"
      />
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate("/profile")} className="mb-4 gap-1">
            <ArrowLeft className="h-4 w-4" /> Retour au profil
          </Button>
          <h1 className="text-3xl font-bold">Missions ouvertes</h1>
          <p className="mt-1 text-muted-foreground">
            Consultez les besoins clients et positionnez-vous sur ceux qui vous intéressent.
          </p>
        </div>

        {needs.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <Briefcase className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Aucune mission ouverte pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {needs.map((need) => {
              const hasApplied = appliedNeedIds.has(need.id);
              const isApplying = applyingToId === need.id;

              return (
                <Card key={need.id} className="transition-shadow hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold">{need.job_title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Publié le {new Date(need.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      {need.profile_types?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {need.profile_types.map((t) => (
                            <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {need.mission_location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Monitor className="h-3.5 w-3.5" /> {REMOTE_LABELS[need.remote_policy] || need.remote_policy}
                      </span>
                      {(need.budget_tjm_min || need.budget_tjm_max) && (
                        <span className="flex items-center gap-1">
                          <Euro className="h-3.5 w-3.5" />
                          {need.budget_tjm_min ? Math.max(0, need.budget_tjm_min - 100) : "?"} - {need.budget_tjm_max ? Math.max(0, need.budget_tjm_max - 100) : "?"} €/j
                        </span>
                      )}
                    </div>

                    {need.description && (
                      <p className="text-sm text-muted-foreground mb-4">{need.description}</p>
                    )}

                    {hasApplied ? (
                      <div className="flex items-center gap-2 text-sm text-primary">
                        <Check className="h-4 w-4" />
                        Candidature envoyée
                      </div>
                    ) : isApplying ? (
                      <div className="space-y-3 border-t border-border pt-4 mt-2">
                        <Textarea
                          placeholder="Pourquoi ce besoin vous intéresse ? (optionnel)"
                          value={motivation}
                          onChange={(e) => setMotivation(e.target.value)}
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleApply(need.id)} disabled={submitting}>
                            <Send className="mr-1.5 h-3.5 w-3.5" />
                            {submitting ? "Envoi..." : "Envoyer ma candidature"}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setApplyingToId(null); setMotivation(""); }}>
                            Annuler
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setApplyingToId(need.id)}>
                        Me positionner
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default OpenNeeds;

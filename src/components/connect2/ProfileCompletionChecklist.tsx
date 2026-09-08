import { useState, useEffect, useMemo } from "react";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProfileData {
  first_name: string;
  last_name: string;
  phone: string;
  linkedin_url: string;
  photo_url: string | null;
  job_title: string;
  skills: string[];
  clients: string[];
  tjm: number | null;
  model: string | null;
  intro_text: string | null;
  missions: any[];
  languages: any[];
  sectors: string[];
  mobility: string[];
  company_name: string | null;
  siren: string | null;
}

interface ChecklistItem {
  key: string;
  label: string;
  description: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
}

interface ProfileCompletionChecklistProps {
  profile: ProfileData;
  onScrollTo?: (field: string) => void;
}

const ProfileCompletionChecklist = ({ profile, onScrollTo }: ProfileCompletionChecklistProps) => {
  const [dismissed, setDismissed] = useState(false);

  const items: ChecklistItem[] = useMemo(() => [
    {
      key: "photo",
      label: "Photo de profil",
      description: "Ajoutez une photo professionnelle pour inspirer confiance",
      completed: !!profile.photo_url,
      priority: "high",
    },
    {
      key: "identity",
      label: "Identité complète",
      description: "Prénom, nom et téléphone",
      completed: !!profile.first_name && !!profile.last_name && !!profile.phone,
      priority: "high",
    },
    {
      key: "linkedin",
      label: "Profil LinkedIn",
      description: "Liez votre profil LinkedIn pour plus de visibilité",
      completed: !!profile.linkedin_url,
      priority: "high",
    },
    {
      key: "jobTitle",
      label: "Intitulé de poste",
      description: "Précisez votre spécialité (ex: Talent Acquisition Manager)",
      completed: !!profile.job_title,
      priority: "high",
    },
    {
      key: "tjm",
      label: "TJM & modèle",
      description: "Indiquez votre tarif (modèle 100% RPO)",
      completed: !!profile.tjm && !!profile.model,
      priority: "high",
    },
    {
      key: "skills",
      label: "Métiers recrutés",
      description: "Listez les profils que vous savez recruter",
      completed: profile.skills?.length > 0,
      priority: "medium",
    },
    {
      key: "sectors",
      label: "Secteurs d'activité",
      description: "Dans quels secteurs avez-vous de l'expérience ?",
      completed: profile.sectors?.length > 0,
      priority: "medium",
    },
    {
      key: "intro",
      label: "Texte de présentation",
      description: "Rédigez un pitch qui vous distingue",
      completed: !!profile.intro_text && profile.intro_text.length > 20,
      priority: "medium",
    },
    {
      key: "missions",
      label: "Expériences / missions passées",
      description: "Ajoutez vos missions réalisées avec KPIs",
      completed: profile.missions?.length > 0,
      priority: "medium",
    },
    {
      key: "legal",
      label: "Informations légales",
      description: "Société, SIREN — nécessaires pour les contrats",
      completed: !!profile.company_name && !!profile.siren,
      priority: "low",
    },
    {
      key: "languages",
      label: "Langues parlées",
      description: "Précisez vos langues et niveaux",
      completed: profile.languages?.length > 0,
      priority: "low",
    },
    {
      key: "mobility",
      label: "Zone de mobilité",
      description: "Indiquez les villes où vous pouvez travailler",
      completed: profile.mobility?.length > 0,
      priority: "low",
    },
  ], [profile]);

  const completedCount = items.filter(i => i.completed).length;
  const percentage = Math.round((completedCount / items.length) * 100);
  const incompleteItems = items.filter(i => !i.completed);

  // Don't show if 100% or dismissed
  if (percentage === 100 || dismissed) return null;

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sortedIncomplete = [...incompleteItems].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return (
    <div className="mb-8 rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold">Complétez votre profil</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Un profil complet augmente vos chances d'être sélectionné
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Masquer
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Progress value={percentage} className="h-2.5 flex-1" />
        <span className={cn(
          "text-sm font-semibold",
          percentage >= 80 ? "text-green-600" : percentage >= 50 ? "text-amber-500" : "text-destructive"
        )}>
          {percentage}%
        </span>
      </div>

      <div className="space-y-2">
        {sortedIncomplete.slice(0, 4).map((item) => (
          <button
            key={item.key}
            onClick={() => onScrollTo?.(item.key)}
            className="flex w-full items-start gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-muted/50"
          >
            {item.priority === "high" ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            ) : (
              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
            )}
            <div className="min-w-0 flex-1">
              <span className="text-sm font-medium">{item.label}</span>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
          </button>
        ))}
        {sortedIncomplete.length > 4 && (
          <p className="text-xs text-muted-foreground text-center pt-1">
            +{sortedIncomplete.length - 4} autres champs à compléter
          </p>
        )}
      </div>

      {/* Completed items summary */}
      {completedCount > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex flex-wrap gap-2">
            {items.filter(i => i.completed).map((item) => (
              <span key={item.key} className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs text-green-600">
                <CheckCircle2 className="h-3 w-3" />
                {item.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileCompletionChecklist;

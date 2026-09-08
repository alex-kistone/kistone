import { useState } from "react";
import { X, MapPin, Briefcase, Globe, Linkedin, Phone, Mail, Calendar, CheckCircle2, Star, Medal, Award, MessageCircle, Settings2, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import SuggestToClientDialog from "./SuggestToClientDialog";

interface Mission {
  client_name?: string;
  profile_types?: string;
  kpis?: string;
  duration?: string;
}

interface Language {
  language: string;
  level: string;
}

export interface FullProfile {
  id: string;
  user_id: string | null;
  photo_url: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  linkedin_url: string | null;
  job_title: string | null;
  skills: string[];
  clients: string[];
  tjm: number | null;
  model: string | null;
  available: boolean | null;
  availability_date: string | null;
  created_at: string;
  admin_rating: number | null;
  super_tam: boolean | null;
  tech_specialties: string[] | null;
  intro_text: string | null;
  missions: Mission[] | null;
  languages: Language[] | null;
  has_linkedin_license: boolean | null;
  mobility: string[] | null;
  sectors: string[] | null;
}

interface ProfileDetailModalProps {
  profile: FullProfile;
  open: boolean;
  onClose: () => void;
  onOpenChat?: (profile: FullProfile) => void;
  onOpenAdmin?: (profile: FullProfile) => void;
}

const ProfileDetailModal = ({ profile, open, onClose, onOpenChat, onOpenAdmin }: ProfileDetailModalProps) => {
  const [suggestOpen, setSuggestOpen] = useState(false);

  if (!open) return null;

  const missions = Array.isArray(profile.missions) ? profile.missions : [];
  const languages = Array.isArray(profile.languages) ? profile.languages : [];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="relative max-h-[85vh] w-full overflow-y-auto rounded-t-xl border border-border bg-card shadow-xl sm:max-h-[90vh] sm:max-w-2xl sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute right-4 top-4 z-10 flex items-center gap-1">
          {onOpenAdmin && (
            <button onClick={() => setSuggestOpen(true)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-primary" title="Suggérer à un client">
              <UserPlus className="h-5 w-5" />
            </button>
          )}
          {profile.linkedin_url && (
            <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-primary">
              <Linkedin className="h-5 w-5" />
            </a>
          )}
          {profile.user_id && onOpenChat && (
            <button onClick={() => { onOpenChat(profile); onClose(); }} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-primary" title="Envoyer un message">
              <MessageCircle className="h-5 w-5" />
            </button>
          )}
          {onOpenAdmin && (
            <button onClick={() => { onOpenAdmin(profile); onClose(); }} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-accent" title="Fiche admin">
              <Settings2 className="h-5 w-5" />
            </button>
          )}
          <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-start gap-3 sm:gap-4">
            <Avatar className="h-12 w-12 shrink-0 sm:h-16 sm:w-16">
              {profile.photo_url && <AvatarImage src={profile.photo_url} />}
              <AvatarFallback className="bg-primary text-base font-semibold text-primary-foreground sm:text-lg">
                {profile.first_name[0]}{profile.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-lg font-bold sm:text-xl">{profile.first_name} {profile.last_name}</h2>
                {profile.super_tam && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground sm:text-xs">
                    <Medal className="h-3 w-3" /> Super TAM
                  </span>
                )}
              </div>
              {profile.job_title && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground sm:text-sm">{profile.job_title}</p>
              )}
              <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:text-sm">
                <a href={`mailto:${profile.email}`} className="flex items-center gap-1 truncate hover:text-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{profile.email}</span>
                </a>
                {profile.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 shrink-0" /> {profile.phone}
                  </span>
                )}
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:text-primary/80">
                    <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                  </a>
                )}
              </div>
            </div>
          </div>

          <Separator className="my-5" />

          {/* Key info row */}
          <div className="flex flex-wrap gap-4 text-sm">
            {profile.model && (
              <Badge variant={profile.model === "RPO" ? "default" : "secondary"}>{profile.model}</Badge>
            )}
            {profile.tjm && (
              <span className="flex items-center gap-1"><Briefcase className="h-4 w-4 text-muted-foreground" /> {profile.tjm}€/j</span>
            )}
            {profile.available !== false ? (
              <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="h-4 w-4" /> Disponible</span>
            ) : profile.availability_date ? (
              <span className="flex items-center gap-1 text-orange-500"><Calendar className="h-4 w-4" /> Dispo. {new Date(profile.availability_date).toLocaleDateString("fr-FR")}</span>
            ) : (
              <span className="flex items-center gap-1 text-orange-500"><Calendar className="h-4 w-4" /> Indisponible</span>
            )}
            {(profile.admin_rating ?? 0) > 0 && (
              <span className="flex items-center gap-0.5">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span>{profile.admin_rating}/5</span>
              </span>
            )}
            {profile.has_linkedin_license && (
              <span className="flex items-center gap-1 text-muted-foreground"><Linkedin className="h-4 w-4" /> Licence Recruiter</span>
            )}
          </div>

          {/* Mobility */}
          {profile.mobility && profile.mobility.length > 0 && (
            <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" /> {profile.mobility.join(", ")}
            </div>
          )}

          {/* Presentation */}
          {profile.intro_text && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-semibold">Présentation</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{profile.intro_text}</p>
            </div>
          )}

          {/* Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-semibold">Métiers recrutés</h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((s) => (
                  <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Clients */}
          {profile.clients && profile.clients.length > 0 && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-semibold">Clients majeurs</h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.clients.map((c) => (
                  <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Missions */}
          {missions.length > 0 && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-semibold">Missions réalisées</h3>
              <div className="space-y-3">
                {missions.map((m, i) => (
                  <div key={i} className="rounded-lg border bg-muted/30 p-3 text-sm">
                    <div className="font-medium">{m.client_name}</div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {m.profile_types && <span>Profils : {m.profile_types}</span>}
                      {m.kpis && <span>KPIs : {m.kpis}</span>}
                      {m.duration && <span>Durée : {m.duration}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {languages.length > 0 && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-semibold">Langues</h3>
              <div className="flex flex-wrap gap-2">
                {languages.map((l, i) => (
                  <span key={i} className="flex items-center gap-1 text-sm">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    {l.language} <span className="text-xs text-muted-foreground">({l.level})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tech specialties */}
          {profile.tech_specialties && profile.tech_specialties.length > 0 && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-semibold">Spécialités Tech</h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.tech_specialties.map((t) => (
                  <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <SuggestToClientDialog profile={profile} open={suggestOpen} onClose={() => setSuggestOpen(false)} />
    </div>
  );
};

export default ProfileDetailModal;

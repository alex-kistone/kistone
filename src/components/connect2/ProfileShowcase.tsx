import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Star, Award, MapPin, Briefcase, Globe, Linkedin, CheckCircle2, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface PublicProfile {
  id: string;
  first_name: string;
  job_title: string | null;
  skills: string[] | null;
  mobility: string[] | null;
  tjm: number | null;
  model: string | null;
  clients: string[];
  available: boolean | null;
  intro_text: string | null;
  missions_count: number;
  languages: { language: string; level: string }[] | null;
  has_linkedin_license: boolean | null;
  super_tam: boolean | null;
  photo_url: string | null;
}

const ProfileShowcase = () => {
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("public-profiles");
        if (error) throw error;
        setProfiles(data || []);
      } catch (err) {
        console.error("Failed to load profiles:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, []);

  if (loading || profiles.length === 0) return null;

  return (
    <section className="border-t bg-card px-4 py-20">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-4 text-center">
          <h2 className="font-heading text-3xl font-bold sm:text-4xl">
            Nos <span className="text-primary">talents</span> disponibles
          </h2>
        </div>
        <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
          Découvrez une sélection de nos meilleurs freelances, prêts à rejoindre votre équipe.
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <Link
              key={profile.id}
              to="/client"
              className="group relative flex flex-col rounded-2xl border bg-background p-6 transition-all hover:border-accent/40 hover:shadow-lg"
            >
              {/* Super TAM badge */}
              {profile.super_tam && (
                <div className="absolute -top-2 right-4 flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground shadow-sm">
                  <Award className="h-3.5 w-3.5" />
                  Super TAM
                </div>
              )}

              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                  {profile.photo_url ? (
                    <img src={profile.photo_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Users className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold">{profile.first_name}</span>
                    {profile.available && (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                    )}
                  </div>
                  {profile.job_title && (
                    <p className="truncate text-sm text-muted-foreground">{profile.job_title}</p>
                  )}
                </div>
              </div>

              {/* Intro */}
              {profile.intro_text && (
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{profile.intro_text}</p>
              )}

              {/* Skills */}
              {profile.skills && profile.skills.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {profile.skills.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {profile.skills.length > 3 && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      +{profile.skills.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {/* Clients */}
              {profile.clients && profile.clients.length > 0 && (
                <div className="mt-3 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Clients : </span>
                  {profile.clients.slice(0, 3).join(", ")}
                  {profile.clients.length > 3 && ` +${profile.clients.length - 3}`}
                </div>
              )}

              {/* Details */}
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                {profile.tjm && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" />
                    {profile.tjm}€/j
                  </span>
                )}
                {profile.mobility && profile.mobility.length > 0 && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {profile.mobility.slice(0, 2).join(", ")}
                  </span>
                )}
                {profile.missions_count > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5" />
                    {profile.missions_count} mission{profile.missions_count > 1 ? "s" : ""}
                  </span>
                )}
                {profile.languages && profile.languages.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" />
                    {profile.languages.map((l) => l.language).slice(0, 2).join(", ")}
                  </span>
                )}
                {profile.has_linkedin_license && (
                  <span className="flex items-center gap-1">
                    <Linkedin className="h-3.5 w-3.5" />
                    Licence Recruiter
                  </span>
                )}
              </div>

              {/* Model - only show RPO */}
              {profile.model === "RPO" && (
                <div className="mt-3">
                  <Badge className="text-xs">RPO</Badge>
                </div>
              )}

              {/* CTA hint */}
              <div className="mt-auto pt-4">
                <span className="flex items-center gap-1 text-xs font-semibold text-primary transition-all group-hover:gap-2">
                  Déposer un besoin
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button asChild size="lg" className="gap-2 rounded-full px-6">
            <Link to="/client">
              Découvrir tous nos talents
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ProfileShowcase;

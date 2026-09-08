import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Briefcase, ArrowUpRight, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0, 0, 0.2, 1] as const },
  }),
};

interface OpenNeed {
  id: string;
  job_title: string | null;
  mission_location: string | null;
  remote_policy: string | null;
  profile_types: string[] | null;
  budget_tjm_min: number | null;
  budget_tjm_max: number | null;
  description: string | null;
  created_at: string | null;
}

const remoteLabels: Record<string, string> = {
  "on-site": "Sur site",
  hybrid: "Hybride",
  "full-remote": "Full remote",
};

const OpenNeedsSection = () => {
  const [needs, setNeeds] = useState<OpenNeed[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNeeds = async () => {
      const { data } = await supabase
        .from("client_needs_open")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);
      setNeeds(data || []);
      setLoading(false);
    };
    fetchNeeds();
  }, []);

  if (loading || needs.length === 0) return null;

  return (
    <section className="border-t bg-card px-4 py-20">
      <div className="container mx-auto max-w-5xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="mb-4 text-center">
          <motion.p variants={fadeUp} className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">
            Missions en cours
          </motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="font-heading text-3xl font-bold sm:text-4xl">
            Besoins <span className="text-primary">ouverts</span>
          </motion.h2>
        </motion.div>
        <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
          Des entreprises recherchent activement des freelances. Postulez directement ou déposez votre profil.
        </motion.p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {needs.map((need, i) => (
            <motion.div
              key={need.id}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeUp}
              custom={i}
            >
              <Link
                to="/open-needs"
                className="group flex flex-col rounded-2xl border bg-background p-6 transition-all hover:border-primary/30 hover:shadow-lg"
              >
                <h3 className="font-heading font-semibold">{need.job_title || "Mission ouverte"}</h3>

                <div className="mt-3 flex flex-wrap gap-2">
                  {need.profile_types?.map((type) => (
                    <Badge key={type} variant="secondary" className="text-xs">{type}</Badge>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                  {need.mission_location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {need.mission_location}
                    </span>
                  )}
                  {need.remote_policy && (
                    <span className="flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5" />
                      {remoteLabels[need.remote_policy] || need.remote_policy}
                    </span>
                  )}
                  {(need.budget_tjm_min || need.budget_tjm_max) && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" />
                      {need.budget_tjm_min && need.budget_tjm_max
                        ? `${need.budget_tjm_min} - ${need.budget_tjm_max}€/j`
                        : need.budget_tjm_max
                        ? `Jusqu'à ${need.budget_tjm_max}€/j`
                        : `À partir de ${need.budget_tjm_min}€/j`}
                    </span>
                  )}
                </div>

                {need.description && (
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{need.description}</p>
                )}

                <div className="mt-auto pt-4">
                  <span className="flex items-center gap-1 text-xs font-semibold text-primary transition-all group-hover:gap-2">
                    Voir le détail <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 flex justify-center gap-4">
          <Button asChild size="lg" variant="outline" className="gap-2 rounded-full px-6">
            <Link to="/open-needs">Voir toutes les missions <ArrowUpRight className="h-4 w-4" /></Link>
          </Button>
          <Button asChild size="lg" className="gap-2 rounded-full px-6">
            <Link to="/register">Postuler comme freelance <ArrowUpRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default OpenNeedsSection;

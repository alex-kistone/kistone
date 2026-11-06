import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, Building2, MapPin, Radar, UserSearch } from "lucide-react";
import AppShell from "@/components/platform/AppShell";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { rankRadar, sourceLabel, type RadarCompany, type RadarOffer, type RadarProfile } from "@/lib/jobRadar";
import { normalizeMetiers } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";

const OFFERS_SHOWN = 4;
const dateLabel = (d: string | null) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : null);
const sizeLabel = (n: number | null) => (n == null ? null : n < 50 ? "moins de 50 salariés" : n < 250 ? "50 à 250 salariés" : n < 1000 ? "250 à 1 000 salariés" : "plus de 1 000 salariés");

function CompanyLogo({ company }: { company: RadarCompany }) {
  const [broken, setBroken] = useState(false);
  if (company.logo && !broken) {
    return <img src={company.logo} alt="" loading="lazy" onError={() => setBroken(true)} className="h-11 w-11 shrink-0 rounded-xl border border-border bg-white object-contain p-1" />;
  }
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-base font-semibold text-muted-foreground" aria-hidden="true">
      {company.name.charAt(0).toUpperCase()}
    </span>
  );
}

function OfferLine({ offer }: { offer: RadarOffer }) {
  const meta = [offer.location, offer.remote ? "Remote" : offer.hybrid ? "Hybride" : null, sourceLabel(offer.source_url ?? offer.url), dateLabel(offer.date_posted)].filter(Boolean);
  return (
    <li>
      <a href={offer.url} target="_blank" rel="noopener noreferrer" className="group flex items-start justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-muted">
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium group-hover:underline">{offer.job_title}</span>
          <span className="block truncate text-xs text-muted-foreground">{meta.join(" · ")}</span>
        </span>
        <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </a>
    </li>
  );
}

function CompanyCard({ company }: { company: RadarCompany }) {
  const [open, setOpen] = useState(false);
  const offers = [...company.recruiterOffers, ...company.metierOffers];
  const shown = open ? offers : offers.slice(0, OFFERS_SHOWN);
  const about = [company.industry, sizeLabel(company.employees)].filter(Boolean).join(" · ");
  const counts = company.metierCounts.map((c) => `${c.count} ${c.count > 1 ? "postes" : "poste"} ${c.metier}`).join(" · ");

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <CompanyLogo company={company} />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold leading-tight">
              {company.domain ? (
                <a href={`https://${company.domain}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{company.name}</a>
              ) : company.name}
            </h2>
            {about && <p className="mt-0.5 text-sm text-muted-foreground">{about}</p>}
          </div>
        </div>

        <div className="mt-4 space-y-1.5 text-sm">
          {company.recruiterOffers.length > 0 && (
            <p className="flex items-center gap-2 font-medium text-primary">
              <UserSearch className="h-4 w-4" aria-hidden="true" />
              Cherche {company.recruiterOffers.length > 1 ? `${company.recruiterOffers.length} recruteurs` : "un recruteur"} en CDI
            </p>
          )}
          {counts && (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" aria-hidden="true" /> Recrute {counts}
            </p>
          )}
          {(company.nearby || company.remoteFriendly) && (
            <p className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              {company.nearby ? "Dans votre zone de mobilité" : "Postes en remote ou hybride"}
            </p>
          )}
        </div>

        <ul className="mt-4 space-y-0.5 border-t border-border pt-3">
          {shown.map((o) => <OfferLine key={o.id} offer={o} />)}
        </ul>
        {offers.length > OFFERS_SHOWN && (
          <button type="button" onClick={() => setOpen(!open)} className="mt-2 px-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            {open ? "Voir moins" : `Voir les ${offers.length - OFFERS_SHOWN} autres offres`}
          </button>
        )}
      </CardContent>
    </Card>
  );
}

const JobRadar = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<RadarProfile | null>(null);
  const [offers, setOffers] = useState<RadarOffer[]>([]);
  const [onlyRecruiter, setOnlyRecruiter] = useState(false);
  const [metier, setMetier] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/register"); return; }
      const { data: p } = await supabase
        .from("recruiter_profiles")
        .select("skills, sectors, mobility, remote_preference")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (!p) { navigate("/profile"); return; }
      setProfile(p as RadarProfile);
      const { data } = await supabase
        .from("job_radar_offers" as never)
        .select("*")
        .order("date_posted", { ascending: false })
        .limit(3000);
      setOffers((data as unknown as RadarOffer[]) ?? []);
      setLoading(false);
    })();
  }, [navigate]);

  const companies = useMemo(() => (profile ? rankRadar(profile, offers) : []), [profile, offers]);
  const skills = useMemo(() => normalizeMetiers(profile?.skills).filter((m) => m !== "Autres" && m !== "Head of TA"), [profile]);
  const visible = companies.filter((c) =>
    (!onlyRecruiter || c.recruiterOffers.length > 0) &&
    (!metier || c.metierCounts.some((m) => m.metier === metier)),
  );
  const updated = offers.reduce<string | null>((max, o) => (!max || o.fetched_at > max ? o.fetched_at : max), null);

  const filterButton = (active: boolean) =>
    cn("h-9 rounded-full border px-4 text-sm font-medium transition-colors", active ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:bg-muted");

  return (
    <div className="min-h-screen bg-background lg:pl-[248px]">
      <SEO title="Radar CDI — Kistone" description="Les entreprises qui recrutent en CDI dans vos métiers." path="/radar" />
      <AppShell role="freelance" />
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Radar CDI</h1>
          <p className="mt-1 text-muted-foreground">
            Les entreprises qui recrutent en CDI dans vos métiers, repérées chaque jour sur LinkedIn, Indeed et les sites carrières.
            Là où une entreprise recrute en CDI, il y a souvent de la place pour un recruteur freelance.
          </p>
          {updated && <p className="mt-2 text-xs text-muted-foreground">Mis à jour le {new Date(updated).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</p>}
        </div>

        {loading ? (
          <div className="py-20 text-center text-muted-foreground">Chargement...</div>
        ) : offers.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Radar className="mb-3 h-10 w-10 text-muted-foreground" aria-hidden="true" />
            <p className="text-muted-foreground">Le radar se remplit chaque matin. Revenez demain pour découvrir les premières entreprises.</p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap gap-2">
              <button type="button" className={filterButton(!onlyRecruiter && !metier)} onClick={() => { setOnlyRecruiter(false); setMetier(null); }}>
                Toutes ({companies.length})
              </button>
              <button type="button" className={filterButton(onlyRecruiter)} aria-pressed={onlyRecruiter} onClick={() => setOnlyRecruiter(!onlyRecruiter)}>
                Cherchent un recruteur
              </button>
              {skills.map((m) => (
                <button key={m} type="button" className={filterButton(metier === m)} aria-pressed={metier === m} onClick={() => setMetier(metier === m ? null : m)}>
                  {m}
                </button>
              ))}
            </div>

            {visible.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <p>Aucune entreprise ne correspond pour l'instant.</p>
                <p className="mt-1 text-sm">
                  Vos métiers, secteurs et votre mobilité orientent le radar : <Link to="/profile" className="font-medium text-foreground underline underline-offset-2">complétez votre profil</Link>.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {visible.slice(0, 60).map((c) => <CompanyCard key={c.key} company={c} />)}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default JobRadar;

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import SEO from "@/components/SEO";
import SiteLayout from "@/components/site/SiteLayout";
import Cta from "@/components/site/Cta";
import { BoltWatermark } from "@/components/brand/Bolt";
import { ROUTES } from "@/content/site";
import { supabase } from "@/integrations/supabase/client";
import { palettes } from "@/lib/palettes";
import { rhythmLabel, verticalOf } from "@/lib/verticals";
import { availabilityOf } from "@/components/platform/admin/linkedin/profileSheetData";
import { cn } from "@/lib/utils";

type PublicProfileData = {
  id: string;
  first_name: string;
  photo_url: string | null;
  job_title: string | null;
  vertical: string | null;
  skills: string[] | null;
  tech_specialties: string[] | null;
  specialties: string[] | null;
  sectors: string[] | null;
  intro_text: string | null;
  years_experience: number | null;
  weekly_capacity: number | null;
  mobility: string[] | null;
  remote_preference: string | null;
  available: boolean | null;
  availability_date: string | null;
  clients: string[] | null;
  missions: { client_name: string | null; profile_types: string | null; kpis: string | null; duration: string | null }[];
  languages: { language: string; level: string }[] | null;
};

const REMOTE: Record<string, string> = { "on-site": "Sur site", hybrid: "Hybride", "full-remote": "Full remote", flexible: "Remote flexible" };

function Tags({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((s) => <li key={s} className="rounded-full bg-[#F1ECE5] px-3 py-1 text-[13px] text-ks-ink-2">{s}</li>)}
    </ul>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[24px] border border-[rgba(20,19,18,0.06)] bg-white p-6 shadow-ks-card">
      <h2 className="mb-4 font-ks-mono text-[11px] font-medium uppercase tracking-[0.14em] text-ks-subtle">{title}</h2>
      {children}
    </section>
  );
}

/**
 * /profil/:id : page publique d'un freelance, partagée sur LinkedIn. N'existe que si le
 * freelance l'a activée. Prénom, photo, métier, spécialités, clients et missions ; les clients
 * intéressés passent par Kistone (formulaire de besoin). Non indexée.
 */
export default function PublicProfile() {
  const { id } = useParams();
  const [p, setP] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) { setLoading(false); return; }
    supabase.rpc("get_public_profile" as never, { _id: id } as never).then(({ data }) => {
      setP((data as unknown as PublicProfileData) ?? null);
      setLoading(false);
    });
  }, [id]);

  if (!p) {
    return (
      <SiteLayout>
        <Helmet><meta name="robots" content="noindex" /></Helmet>
        <section className="mx-auto max-w-ks px-5 py-24 text-center md:px-8">
          {loading ? (
            <p className="text-ks-subtle">Chargement du profil…</p>
          ) : (
            <>
              <h1 className="font-ks-display text-[40px] font-bold tracking-[-0.04em]">Profil introuvable</h1>
              <p className="mt-3 text-ks-soft">Ce profil n'est pas public, ou n'existe plus.</p>
              <div className="mt-6"><Cta href={ROUTES.recruit} arrow>Partager un besoin</Cta></div>
            </>
          )}
        </section>
      </SiteLayout>
    );
  }

  const v = verticalOf(p.vertical);
  const tint = palettes[v.palette as keyof typeof palettes] ?? palettes.apricot;
  const rpo = v.id === "rpo";
  const role = rpo ? "Tech Recruiter" : v.short;
  const headline = p.job_title?.trim() || `${role} freelance`;
  const dispo = availabilityOf(p);
  const specialties = (rpo ? [...(p.skills ?? []).filter((s) => s !== "Autres"), ...(p.tech_specialties ?? [])] : p.specialties ?? [])
    .filter((x, i, a) => a.indexOf(x) === i);
  const sectors = (p.sectors ?? []).filter((s) => s !== "Autre");
  const missions = (p.missions ?? []).filter((m) => (m.client_name ?? "").trim() || (m.profile_types ?? "").trim());
  const clients = (p.clients ?? []).filter(Boolean);
  const place = (p.mobility ?? [])[0]?.split(",")[0].trim();
  const facts = [
    p.years_experience ? `${p.years_experience} ans d'expérience` : null,
    rhythmLabel(p.weekly_capacity),
    [place, p.remote_preference ? REMOTE[p.remote_preference] : null].filter(Boolean).join(" · ") || null,
  ].filter((x): x is string => !!x);
  const needHref = `${ROUTES.recruit}?fonction=${v.id}&profil=${p.id}`;

  return (
    <SiteLayout>
      <SEO
        title={`${p.first_name}, ${headline} freelance`}
        description={`${p.first_name}, ${headline} freelance${specialties.length ? ` : ${specialties.slice(0, 4).join(", ")}` : ""}. Travaillez avec ${p.first_name} via Kistone.`}
        path={`/profil/${p.id}`}
      />
      <Helmet><meta name="robots" content="noindex" /></Helmet>

      <section className="relative overflow-hidden">
        <BoltWatermark className="-right-24 -top-10 h-[620px] w-auto rotate-[12deg]" />
        <div className="relative mx-auto grid max-w-ks gap-8 px-5 pb-12 pt-16 md:grid-cols-[minmax(0,1fr)_340px] md:px-8 md:pt-24">
          <div>
            <p className="font-ks-mono text-[12px] font-medium uppercase tracking-[0.14em] text-ks-subtle">Profil freelance · {role}</p>
            <div className="mt-5 flex items-center gap-5">
              {p.photo_url ? (
                <img src={p.photo_url} alt={p.first_name} className="h-24 w-24 shrink-0 rounded-full object-cover ring-4 ring-white" />
              ) : (
                <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full font-ks-display text-[34px] font-semibold" style={{ background: tint.tint, color: tint.ink }}>
                  {p.first_name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <h1 className="font-ks-display text-[46px] font-bold leading-[0.98] tracking-[-0.048em] md:text-[72px]">{p.first_name}</h1>
                <p className="mt-2 text-[18px] text-ks-soft md:text-[20px]">{headline}</p>
              </div>
            </div>
            {facts.length > 0 && <p className="mt-5 text-[15px] text-ks-soft">{facts.join(" · ")}</p>}
            {p.intro_text && <p className="mt-6 max-w-[640px] whitespace-pre-line text-[17px] leading-relaxed text-ks-ink-2">{p.intro_text}</p>}
          </div>

          <aside className="h-fit rounded-[28px] bg-ks-dark p-7 text-ks-dark-fg shadow-ks-card">
            <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1 text-[13px] font-medium", dispo.available ? "bg-[#DCEEDF] text-[#17663F]" : "bg-[#2A2826] text-ks-dark-muted")}>
              <span className={cn("h-2 w-2 rounded-full", dispo.available ? "bg-[#2F9A63]" : "bg-[#B8B0A4]")} aria-hidden="true" />
              {dispo.badge}
            </span>
            <p className="mt-5 font-ks-display text-[26px] font-semibold leading-tight tracking-[-0.02em]">Travailler avec {p.first_name}</p>
            <p className="mt-2 text-[15px] text-ks-dark-muted">Décrivez votre besoin en quatre questions : Kistone organise la rencontre, gratuitement.</p>
            <div className="mt-6"><Cta href={needHref} variant="studio-fill" arrow>Travailler avec {p.first_name}</Cta></div>
          </aside>
        </div>
      </section>

      <section className="mx-auto grid max-w-ks gap-5 px-5 pb-24 md:grid-cols-2 md:px-8">
        {specialties.length > 0 && <Block title="Spécialités"><Tags items={specialties} /></Block>}
        {sectors.length > 0 && <Block title="Secteurs"><Tags items={sectors} /></Block>}
        {missions.length > 0 && (
          <div className="md:col-span-2">
            <Block title="Missions récentes">
              <ul className="grid gap-3 md:grid-cols-3">
                {missions.slice(0, 6).map((m, i) => (
                  <li key={i} className="rounded-[20px] p-5" style={{ background: tint.soft }}>
                    {m.client_name && <p className="font-ks-display text-[19px] font-semibold tracking-[-0.02em]">{m.client_name}</p>}
                    {m.profile_types && <p className="mt-1 text-[14px] text-ks-soft">{m.profile_types}</p>}
                    {(m.kpis || m.duration) && (
                      <p className="mt-3 text-[13px] font-medium" style={{ color: tint.ink }}>
                        {[m.kpis && (/^\s*\d+\s*$/.test(m.kpis) ? `${m.kpis.trim()} ${rpo ? "recrutements" : "résultats"}` : m.kpis), m.duration].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </Block>
          </div>
        )}
        {clients.length > 0 && <Block title="Ils lui ont fait confiance"><Tags items={clients} /></Block>}
        {(p.languages ?? []).length > 0 && (
          <Block title="Langues"><Tags items={(p.languages ?? []).map((l) => `${l.language} · ${l.level}`)} /></Block>
        )}
      </section>
    </SiteLayout>
  );
}

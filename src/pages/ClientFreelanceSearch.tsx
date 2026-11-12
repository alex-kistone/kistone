import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Search, Video } from "lucide-react";
import AppShell from "@/components/platform/AppShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { clientHomePath } from "@/lib/clientOnboarding";
import { METIERS, SECTEURS } from "@/lib/taxonomy";
import { FULL_TIME_DAYS, rhythmLabel, verticalOf } from "@/lib/verticals";
import { palettes } from "@/lib/palettes";
import { cn } from "@/lib/utils";
import MeetingRequestDialog from "@/components/client/MeetingRequestDialog";

export type SearchedFreelance = {
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
  tjm: number | null;
  clients: string[] | null;
  missions: { client_name: string | null; profile_types: string | null; kpis: string | null; duration: string | null }[];
  languages: { language: string; level: string }[] | null;
  english_level: number | null;
};

const REMOTE: Record<string, string> = { "on-site": "Sur site", hybrid: "Hybride", "full-remote": "Full remote", flexible: "Remote flexible" };
const DAY = 86_400_000;
const ALL = "all";

/** Jours avant la disponibilité (0 : disponible maintenant). */
function daysUntilAvailable(f: SearchedFreelance): number {
  if (f.available !== false) return 0;
  if (!f.availability_date) return Infinity;
  return Math.max(0, Math.ceil((new Date(f.availability_date).getTime() - Date.now()) / DAY));
}

function availabilityText(f: SearchedFreelance): string {
  const d = daysUntilAvailable(f);
  if (d === 0) return "Disponible";
  return `Dès le ${new Date(f.availability_date!).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`;
}

const metiersOf = (f: SearchedFreelance) =>
  [...(f.skills ?? []).filter((s) => s !== "Autres"), ...(f.tech_specialties ?? []), ...(f.specialties ?? [])].filter((x, i, a) => a.indexOf(x) === i);

function Avatar({ f, size = "h-14 w-14 text-[20px]" }: { f: SearchedFreelance; size?: string }) {
  const tint = palettes[verticalOf(f.vertical).palette as keyof typeof palettes] ?? palettes.apricot;
  return f.photo_url ? (
    <img src={f.photo_url} alt="" className={cn("shrink-0 rounded-full object-cover", size)} />
  ) : (
    <span className={cn("flex shrink-0 items-center justify-center rounded-full font-semibold", size)} style={{ background: tint.tint, color: tint.ink }}>
      {f.first_name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function Tags({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((s) => <li key={s} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs">{s}</li>)}
    </ul>
  );
}

/**
 * /client/profils : les clients parcourent les freelances disponibles ou bientôt disponibles
 * (CGU acceptées par le freelance), filtrent, ouvrent un profil et proposent une visio.
 */
export default function ClientFreelanceSearch() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [list, setList] = useState<SearchedFreelance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [metier, setMetier] = useState(ALL);
  const [sector, setSector] = useState(ALL);
  const [dispo, setDispo] = useState(ALL);
  const [rhythm, setRhythm] = useState(ALL);
  const [maxTjm, setMaxTjm] = useState("");
  const [selected, setSelected] = useState<SearchedFreelance | null>(null);
  const [meetingFor, setMeetingFor] = useState<SearchedFreelance | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/client"); return; }
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" as const });
      if (!isAdmin) {
        const home = await clientHomePath(session.user.id);
        if (home !== "/client/dashboard") { navigate(home); return; }
      }
      setReady(true);
      const { data, error: e } = await supabase.rpc("search_freelances" as never);
      if (e) setError("Impossible de charger les profils. Réessayez dans un instant.");
      else setList((data as unknown as SearchedFreelance[]) ?? []);
      setLoading(false);
    })();
  }, [navigate]);

  const shown = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    const max = Number(maxTjm) || 0;
    return list.filter((f) => {
      const hay = [f.first_name, f.job_title, f.intro_text, ...metiersOf(f), ...(f.sectors ?? []), ...(f.clients ?? []), ...(f.mobility ?? [])]
        .filter(Boolean).join(" ").toLowerCase();
      if (words.some((w) => !hay.includes(w))) return false;
      if (metier !== ALL && !metiersOf(f).includes(metier)) return false;
      if (sector !== ALL && !(f.sectors ?? []).includes(sector)) return false;
      const d = daysUntilAvailable(f);
      if (dispo === "now" && d > 0) return false;
      if (dispo === "30" && d > 30) return false;
      const days = f.weekly_capacity ?? FULL_TIME_DAYS;
      if (rhythm === "full" && days < FULL_TIME_DAYS) return false;
      if (rhythm === "part" && days >= FULL_TIME_DAYS) return false;
      if (max && (f.tjm ?? Infinity) > max) return false;
      return true;
    });
  }, [list, q, metier, sector, dispo, rhythm, maxTjm]);

  const reset = () => { setQ(""); setMetier(ALL); setSector(ALL); setDispo(ALL); setRhythm(ALL); setMaxTjm(""); };

  return (
    <div className="min-h-screen bg-background lg:pl-[248px]">
      <AppShell role="client" />
      <main className="container mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold sm:text-3xl">Trouver un profil</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Les recruteurs freelance disponibles ou bientôt disponibles. Ouvrez un profil et proposez-lui une visio.
          </p>
        </div>

        <div className="mb-6 grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-6">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="fs-q">Recherche</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="fs-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cyber, SaaS, Lyon…" className="pl-9" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Métier recruté</Label>
            <Select value={metier} onValueChange={setMetier}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tous</SelectItem>
                {METIERS.filter((m) => m !== "Autres").map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Secteur</Label>
            <Select value={sector} onValueChange={setSector}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tous</SelectItem>
                {SECTEURS.filter((s) => s !== "Autre").map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Disponibilité</Label>
            <Select value={dispo} onValueChange={setDispo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Sous 90 jours</SelectItem>
                <SelectItem value="30">Sous 30 jours</SelectItem>
                <SelectItem value="now">Maintenant</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Rythme</Label>
            <Select value={rhythm} onValueChange={setRhythm}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tous</SelectItem>
                <SelectItem value="full">Temps plein</SelectItem>
                <SelectItem value="part">Temps partiel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 lg:col-start-1">
            <Label htmlFor="fs-tjm">TJM max (€ HT)</Label>
            <Input id="fs-tjm" type="number" min={0} step={50} value={maxTjm} onChange={(e) => setMaxTjm(e.target.value)} placeholder="Ex : 600" />
          </div>
          <div className="flex items-end sm:col-span-2 lg:col-span-5">
            <p className="flex-1 text-sm text-muted-foreground">
              {loading ? "Chargement…" : `${shown.length} profil${shown.length > 1 ? "s" : ""} sur ${list.length}`}
            </p>
            <Button variant="ghost" size="sm" onClick={reset}>Réinitialiser</Button>
          </div>
        </div>

        {!ready || loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : shown.length === 0 ? (
          <div className="rounded-xl border border-dashed py-16 text-center">
            <p className="font-medium">Aucun profil ne correspond à ces filtres.</p>
            <p className="mt-1 text-sm text-muted-foreground">Élargissez la recherche, ou déposez un besoin : on vous propose une shortlist sous 48 h.</p>
            <Button className="mt-4" size="sm" onClick={() => navigate("/client/new-need")}>Déposer un besoin</Button>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((f) => {
              const d = daysUntilAvailable(f);
              return (
                <li key={f.id}>
                  <button type="button" onClick={() => setSelected(f)} className="flex h-full w-full flex-col gap-3 rounded-2xl border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-center gap-3">
                      <Avatar f={f} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-lg font-semibold">{f.first_name}</p>
                        <p className="truncate text-sm text-muted-foreground">{f.job_title || "Tech Recruiter freelance"}{f.years_experience ? ` · ${f.years_experience} ans` : ""}</p>
                      </div>
                    </div>
                    {metiersOf(f).length > 0 && <Tags items={metiersOf(f).slice(0, 4)} />}
                    <div className="mt-auto flex items-center justify-between border-t pt-3 text-sm">
                      <span className="font-semibold">{f.tjm ? `${f.tjm} € HT/j` : "TJM sur demande"}</span>
                      <span className={cn("flex items-center gap-1.5 text-xs font-medium", d === 0 ? "text-[#17663F]" : "text-muted-foreground")}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", d === 0 ? "bg-[#2F9A63]" : "bg-[#C99A12]")} />
                        {availabilityText(f)} · {rhythmLabel(f.weekly_capacity)}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        {selected && (
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-4">
                <Avatar f={selected} size="h-20 w-20 text-[28px]" />
                <div>
                  <DialogTitle className="text-2xl">{selected.first_name}</DialogTitle>
                  <DialogDescription className="text-base">{selected.job_title || "Tech Recruiter freelance"}</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <dl className="grid grid-cols-2 gap-3 rounded-xl bg-muted/50 p-4 text-sm sm:grid-cols-4">
              <div><dt className="text-xs text-muted-foreground">TJM</dt><dd className="font-semibold">{selected.tjm ? `${selected.tjm} € HT` : "Sur demande"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Disponibilité</dt><dd className="font-semibold">{availabilityText(selected)}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Rythme</dt><dd className="font-semibold">{rhythmLabel(selected.weekly_capacity)}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Expérience</dt><dd className="font-semibold">{selected.years_experience ? `${selected.years_experience} ans` : "—"}</dd></div>
            </dl>
            {[(selected.mobility ?? [])[0], selected.remote_preference ? REMOTE[selected.remote_preference] : null].some(Boolean) && (
              <p className="text-sm text-muted-foreground">{[(selected.mobility ?? [])[0], selected.remote_preference ? REMOTE[selected.remote_preference] : null].filter(Boolean).join(" · ")}</p>
            )}
            {selected.intro_text && <p className="whitespace-pre-line text-sm leading-relaxed">{selected.intro_text}</p>}
            {metiersOf(selected).length > 0 && <div className="space-y-1.5"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Spécialités</p><Tags items={metiersOf(selected)} /></div>}
            {(selected.sectors ?? []).length > 0 && <div className="space-y-1.5"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Secteurs</p><Tags items={(selected.sectors ?? []).filter((s) => s !== "Autre")} /></div>}
            {selected.missions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Missions</p>
                <ul className="space-y-2">
                  {selected.missions.slice(0, 6).map((m, i) => (
                    <li key={i} className="rounded-lg border p-3 text-sm">
                      <span className="font-medium">{m.client_name || "Mission"}</span>
                      {m.profile_types && <span className="text-muted-foreground"> · {m.profile_types}</span>}
                      {(m.kpis || m.duration) && <p className="mt-1 text-xs text-muted-foreground">{[m.kpis && (/^\s*\d+\s*$/.test(m.kpis) ? `${m.kpis.trim()} recrutements` : m.kpis), m.duration].filter(Boolean).join(" · ")}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(selected.clients ?? []).length > 0 && <div className="space-y-1.5"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Clients</p><Tags items={selected.clients ?? []} /></div>}
            {(selected.languages ?? []).length > 0 && <div className="space-y-1.5"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Langues</p><Tags items={(selected.languages ?? []).map((l) => `${l.language} · ${l.level}`)} /></div>}
            <div className="sticky bottom-0 -mx-6 -mb-6 border-t bg-background px-6 py-4">
              <Button className="w-full gap-2" onClick={() => { setMeetingFor(selected); setSelected(null); }}>
                <Video className="h-4 w-4" />Proposer une visio à {selected.first_name}
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>

      <MeetingRequestDialog freelance={meetingFor} onOpenChange={(o) => !o && setMeetingFor(null)} />
    </div>
  );
}

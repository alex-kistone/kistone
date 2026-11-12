import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Loader2, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Status = "pending" | "accepted" | "declined" | "cancelled";

type Meeting = {
  id: string;
  role: "client" | "freelance" | "admin";
  slots: string[];
  duration_minutes: number;
  message: string | null;
  status: Status;
  chosen_slot: string | null;
  meeting_url: string | null;
  decline_reason: string | null;
  created_at: string;
  freelance: { first_name: string; last_name: string | null; email: string | null; photo_url: string | null; job_title: string | null };
  client: { company_name: string | null; job_title: string | null; first_name: string | null; last_name: string | null; email: string | null };
};

const STATUS: Record<Status, { label: string; className: string }> = {
  pending: { label: "En attente", className: "bg-amber-100 text-amber-900" },
  accepted: { label: "Confirmée", className: "bg-emerald-100 text-emerald-900" },
  declined: { label: "Déclinée", className: "bg-muted text-muted-foreground" },
  cancelled: { label: "Annulée", className: "bg-muted text-muted-foreground" },
};

/** « mardi 18 novembre à 14:30 », heure de Paris. */
const slotLabel = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

const full = (first: string | null, last: string | null) => [first, last].filter(Boolean).join(" ");

/**
 * Demandes de visio de l'utilisateur connecté. Client : suivi et annulation. Freelance : choix
 * d'un créneau ou refus. Admin : toutes les demandes, en lecture.
 */
export default function MeetingRequestsList({ mode }: { mode: "client" | "freelance" | "admin" }) {
  const { toast } = useToast();
  const [items, setItems] = useState<Meeting[] | null>(null);
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [declining, setDeclining] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.rpc("my_meeting_requests" as never);
    setItems(((data as unknown as Meeting[]) ?? []).filter((m) => mode === "admin" || m.role === mode));
  }, [mode]);
  useEffect(() => { load(); }, [load]);

  const run = async (id: string, fn: string, args: Record<string, unknown>, done: string) => {
    setBusy(id);
    const { error } = await supabase.rpc(fn as never, args as never);
    setBusy(null);
    if (error) { toast({ title: "Action impossible", description: error.message, variant: "destructive" }); return; }
    toast({ title: done });
    setDeclining(null);
    setReason("");
    load();
  };

  if (!items) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-14 text-center text-sm text-muted-foreground">
        <Video className="mx-auto mb-3 h-8 w-8" />
        {mode === "client" ? "Aucune visio pour l'instant. Proposez-en une depuis « Trouver un profil »." : mode === "freelance" ? "Aucune demande de visio pour l'instant." : "Aucune demande de visio."}
      </div>
    );
  }

  const upcoming = (m: Meeting) => m.status === "pending" || (m.status === "accepted" && !!m.chosen_slot && new Date(m.chosen_slot).getTime() > Date.now() - 3_600_000);
  const sorted = [...items.filter(upcoming), ...items.filter((m) => !upcoming(m))];

  return (
    <ul className="space-y-3">
      {sorted.map((m) => {
        const company = m.client.company_name || "Une entreprise";
        const person = mode === "freelance"
          ? `${company}${m.client.job_title ? ` · ${m.client.job_title}` : ""}`
          : `${full(m.freelance.first_name, m.freelance.last_name)}${m.freelance.job_title ? ` · ${m.freelance.job_title}` : ""}`;
        const past = !upcoming(m);
        return (
          <li key={m.id} className={cn("rounded-2xl border bg-card p-5", past && "opacity-70")}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{mode === "admin" ? `${company} → ${m.freelance.first_name}` : person}</p>
                <p className="text-xs text-muted-foreground">Demande du {new Date(m.created_at).toLocaleDateString("fr-FR")} · {m.duration_minutes} min</p>
              </div>
              <Badge className={cn("border-0", STATUS[m.status].className)}>{STATUS[m.status].label}</Badge>
            </div>

            {m.message && <p className="mt-3 whitespace-pre-line rounded-lg bg-muted/50 p-3 text-sm">{m.message}</p>}

            {m.status === "accepted" && m.chosen_slot && (
              <div className="mt-3 space-y-2 text-sm">
                <p className="flex items-center gap-2 font-medium"><CalendarClock className="h-4 w-4" />{slotLabel(m.chosen_slot)}</p>
                {mode !== "admin" && (
                  <p className="text-muted-foreground">
                    {mode === "client"
                      ? `${full(m.freelance.first_name, m.freelance.last_name)}${m.freelance.email ? ` · ${m.freelance.email}` : ""}`
                      : `${full(m.client.first_name, m.client.last_name)}${m.client.email ? ` · ${m.client.email}` : ""}`}
                  </p>
                )}
                {m.meeting_url && !past && (
                  <Button asChild size="sm" className="gap-2"><a href={m.meeting_url} target="_blank" rel="noreferrer"><Video className="h-4 w-4" />Rejoindre la visio</a></Button>
                )}
              </div>
            )}

            {m.status === "declined" && m.decline_reason && <p className="mt-3 text-sm text-muted-foreground">Motif : « {m.decline_reason} »</p>}

            {m.status === "pending" && mode !== "freelance" && (
              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                <p>Créneaux proposés :</p>
                <ul className="list-disc pl-5">{m.slots.map((s) => <li key={s}>{slotLabel(s)}</li>)}</ul>
              </div>
            )}

            {m.status === "pending" && mode === "freelance" && (
              <div className="mt-4 space-y-3">
                <p className="text-sm font-medium">Choisissez un créneau :</p>
                <div className="flex flex-col gap-2">
                  {m.slots.map((s) => {
                    const gone = new Date(s).getTime() < Date.now();
                    return (
                      <label key={s} className={cn("flex items-center gap-3 rounded-lg border p-3 text-sm", picked[m.id] === s && "border-primary bg-primary/5", gone && "opacity-50")}>
                        <input type="radio" name={`slot-${m.id}`} disabled={gone} checked={picked[m.id] === s} onChange={() => setPicked({ ...picked, [m.id]: s })} />
                        {slotLabel(s)}{gone && " (passé)"}
                      </label>
                    );
                  })}
                </div>
                {declining === m.id ? (
                  <div className="space-y-2">
                    <Textarea rows={2} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motif (facultatif) : déjà en mission, autre créneau souhaité…" />
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setDeclining(null)}>Retour</Button>
                      <Button variant="destructive" size="sm" disabled={busy === m.id} onClick={() => run(m.id, "respond_meeting_request", { _id: m.id, _slot: null, _reason: reason }, "Demande déclinée")}>Décliner</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" disabled={!picked[m.id] || busy === m.id} onClick={() => run(m.id, "respond_meeting_request", { _id: m.id, _slot: picked[m.id] }, "Visio confirmée : le lien est envoyé à l'entreprise")}>
                      Accepter ce créneau
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setDeclining(m.id); setReason(""); }}>Décliner</Button>
                  </div>
                )}
              </div>
            )}

            {mode === "client" && !past && (m.status === "pending" || m.status === "accepted") && (
              <Button variant="ghost" size="sm" className="mt-3 text-muted-foreground" disabled={busy === m.id} onClick={() => run(m.id, "cancel_meeting_request", { _id: m.id }, "Demande annulée")}>
                {m.status === "pending" ? "Annuler la demande" : "Annuler la visio"}
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

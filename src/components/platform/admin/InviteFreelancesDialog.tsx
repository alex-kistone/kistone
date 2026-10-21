import { useEffect, useMemo, useState } from "react";
import { FileUp, Loader2, Send, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { functionErrorMessage } from "@/components/platform/admin/adv";
import { formatDate } from "@/lib/blog";
import { csvToInviteeLines, parseInvitees } from "@/lib/invitees";
import { INVITATION_TEMPLATES, invitationEmail, type InvitationAudience } from "../../../../supabase/functions/_shared/invitationEmail";

type Mode = "individual" | "bcc";
type Invitation = { id: string; email: string; first_name: string | null; mode: Mode; audience: InvitationAudience; sent_at: string; error: string | null };
type Result = { sent: number; skipped: { email: string; reason: string }[]; failed: { email: string; error: string }[] };

/**
 * Invitation par email de freelances pas encore inscrits (fonction invite-freelances, Resend) :
 * un email personnalisé par personne, ou un envoi groupé en copie cachée. Aperçu exact de
 * l'email et historique des dernières invitations.
 */
export default function InviteFreelancesDialog({ registeredEmails }: { registeredEmails: string[] }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState("");
  const [mode, setMode] = useState<Mode>("individual");
  const [audience, setAudience] = useState<InvitationAudience>("ai");
  const [subject, setSubject] = useState(INVITATION_TEMPLATES.ai.subject);
  // Changer de modèle reprend son objet, sauf si l'admin l'a personnalisé
  const changeAudience = (a: InvitationAudience) => {
    if (subject === INVITATION_TEMPLATES[audience].subject) setSubject(INVITATION_TEMPLATES[a].subject);
    setAudience(a);
  };
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [history, setHistory] = useState<Invitation[]>([]);

  const { invitees, invalid } = useMemo(() => parseInvitees(raw), [raw]);
  const registered = useMemo(() => new Set(registeredEmails.map((e) => e.toLowerCase())), [registeredEmails]);
  const preview = useMemo(
    () => invitationEmail({ audience, firstName: mode === "individual" ? invitees[0]?.first_name ?? "Prénom" : null, message }),
    [audience, mode, invitees, message],
  );

  // Import d'un CSV : les adresses trouvées s'ajoutent à celles déjà saisies
  const importCsv = async (file: File | undefined) => {
    if (!file) return;
    const lines = csvToInviteeLines(await file.text());
    if (!lines.length) {
      toast({ title: "Aucune adresse trouvée", description: "Le fichier doit contenir une colonne d'emails.", variant: "destructive" });
      return;
    }
    setRaw((r) => [r.trim(), ...lines].filter(Boolean).join("\n"));
    toast({ title: `${lines.length} adresse${lines.length > 1 ? "s" : ""} importée${lines.length > 1 ? "s" : ""}`, description: file.name });
  };

  const loadHistory = async () => {
    const { data } = await supabase
      .from("freelance_invitations" as never)
      .select("id, email, first_name, mode, audience, sent_at, error")
      .order("sent_at", { ascending: false })
      .limit(30);
    setHistory((data as Invitation[] | null) ?? []);
  };
  useEffect(() => { if (open) loadHistory(); }, [open]);

  const send = async () => {
    if (!invitees.length) return;
    setSending(true);
    setResult(null);
    const { data, error } = await supabase.functions.invoke("invite-freelances", {
      body: { invitations: invitees, audience, mode, message, subject },
    });
    setSending(false);
    if (error || data?.error) {
      toast({ title: "Envoi impossible", description: error ? await functionErrorMessage(error) : data.error, variant: "destructive" });
      return;
    }
    setResult(data as Result);
    toast({ title: `${data.sent} invitation${data.sent > 1 ? "s" : ""} envoyée${data.sent > 1 ? "s" : ""}` });
    if (data.sent) setRaw("");
    loadHistory();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setResult(null); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2"><UserPlus className="h-4 w-4" />Inviter des freelances</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Inviter des freelances à rejoindre Kistone</DialogTitle>
          <DialogDescription>Un email à la charte Kistone, envoyé depuis notifications@kistone.fr ; les réponses arrivent dans votre boîte.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="inv-emails">Adresses</Label>
                <Button variant="outline" size="sm" asChild className="h-8 gap-1.5 text-xs">
                  <label className="cursor-pointer">
                    <FileUp className="h-3.5 w-3.5" />Importer un CSV
                    <input
                      type="file"
                      accept=".csv,text/csv,.txt"
                      className="hidden"
                      onChange={(e) => { importCsv(e.target.files?.[0]); e.target.value = ""; }}
                    />
                  </label>
                </Button>
              </div>
              <Textarea
                id="inv-emails"
                rows={7}
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                placeholder={"Une par ligne, ou séparées par des virgules :\nmarie.dupont@exemple.fr\nMarie Dupont <marie.dupont@exemple.fr>\nMarie ; marie.dupont@exemple.fr"}
              />
              <p className="text-xs text-muted-foreground">
                CSV : une colonne email, et si possible une colonne prénom (export de tableur, LinkedIn ou CRM).{" "}
                {invitees.length} adresse{invitees.length > 1 ? "s" : ""} valide{invitees.length > 1 ? "s" : ""}
                {invitees.filter((i) => registered.has(i.email)).length ? ` · ${invitees.filter((i) => registered.has(i.email)).length} déjà inscrite(s), ignorée(s)` : ""}
                {invalid.length ? ` · ${invalid.length} invalide(s) : ${invalid.slice(0, 3).join(", ")}` : ""}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Modèle</Label>
              <div className="grid grid-cols-2 gap-2">
                {([["ai", "Experts IA", "AI Engineer, AI Product, AI Leader"], ["rpo", "Tech recruiters", "Freelances RPO"]] as const).map(([value, title, hint]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => changeAudience(value)}
                    aria-pressed={audience === value}
                    className={`rounded-lg border p-3 text-left transition-colors ${audience === value ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}
                  >
                    <span className="block text-sm font-medium">{title}</span>
                    <span className="block text-xs text-muted-foreground">{hint}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mode d'envoi</Label>
              <RadioGroup value={mode} onValueChange={(v) => setMode(v as Mode)} className="gap-2">
                <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border p-3">
                  <RadioGroupItem value="individual" className="mt-0.5" />
                  <span><span className="text-sm font-medium">Un par un</span><span className="block text-xs text-muted-foreground">Un email par personne, avec son prénom s'il est indiqué.</span></span>
                </label>
                <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border p-3">
                  <RadioGroupItem value="bcc" className="mt-0.5" />
                  <span><span className="text-sm font-medium">En une fois, en copie cachée (Cci)</span><span className="block text-xs text-muted-foreground">Un seul email « Bonjour, » ; les destinataires ne se voient pas entre eux.</span></span>
                </label>
              </RadioGroup>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inv-subject">Objet</Label>
              <Input id="inv-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-message">Mot personnel (facultatif)</Label>
              <Textarea id="inv-message" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ex : Nous avons échangé au meetup IA de jeudi, je pense que nos missions RAG vous plairont." />
            </div>

            <Button onClick={send} disabled={sending || !invitees.length} className="w-full gap-2">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? "Envoi en cours…" : `Envoyer ${invitees.length || ""} invitation${invitees.length > 1 ? "s" : ""}`}
            </Button>

            {result && (result.skipped.length > 0 || result.failed.length > 0) && (
              <div className="space-y-1 rounded-lg bg-muted p-3 text-xs">
                {result.skipped.map((s) => <p key={s.email}>Ignorée : {s.email} ({s.reason})</p>)}
                {result.failed.map((f) => <p key={f.email} className="text-destructive">Échec : {f.email} ({f.error})</p>)}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Aperçu</Label>
            <iframe title="Aperçu de l'invitation" srcDoc={preview} className="h-[560px] w-full rounded-lg border border-border bg-[#F5F1EA]" />
          </div>
        </div>

        <div className="mt-2 space-y-2">
          <Label>Dernières invitations</Label>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune invitation envoyée pour l'instant.</p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border text-sm">
              {history.map((h) => (
                <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                  <span className="min-w-0 truncate">{h.first_name ? `${h.first_name} · ` : ""}{h.email}</span>
                  <span className="flex items-center gap-3 text-xs text-muted-foreground">
                    {h.audience === "rpo" ? "RPO" : "IA"} · {h.mode === "bcc" ? "Cci" : "Individuelle"} · {formatDate(h.sent_at)}
                    {h.error ? <span className="text-destructive">Échec</span> : registered.has(h.email.toLowerCase()) ? <span className="font-medium text-[#17663F]">Inscrit</span> : <span>En attente</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useEffect, useMemo, useState } from "react";
import { MailPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { eur, withMigrationHint } from "@/lib/invoices";
import { localIso } from "@/lib/treasury";

/** CRA validé sans facture freelance : l'admin peut déposer la facture reçue par mail. */
export interface EmailInvoiceCandidate {
  timesheet_id: string;
  freelance_user_id: string;
  mission_id: string | null;
  freelance_name: string;
  mission_title: string;
  month_label: string;
  /** Montant attendu HT (freelance_amount + frais HT), null si taux non figés. */
  expected_ht: number | null;
}

const MAX_BYTES = 10 * 1024 * 1024;
const parse = (v: string) => Number(v.replace(/[\s\u00a0\u202f]/g, "").replace(",", "."));
const round2 = (n: number) => Math.round(n * 100) / 100;
const addDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return localIso(d);
};

export function FreelanceEmailInvoiceDialog({ candidates, paymentTermsDays, onDone }: {
  candidates: EmailInvoiceCandidate[];
  paymentTermsDays: number;
  onDone: () => void | Promise<void>;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [tsId, setTsId] = useState("");
  const [number, setNumber] = useState("");
  const [date, setDate] = useState(localIso());
  const [ht, setHt] = useState("");
  const [vat, setVat] = useState("");
  const [noVat, setNoVat] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const selected = useMemo(() => candidates.find((c) => c.timesheet_id === tsId) ?? null, [candidates, tsId]);

  useEffect(() => {
    if (open) {
      setTsId(candidates.length === 1 ? candidates[0].timesheet_id : "");
      setNumber("");
      setDate(localIso());
      setNoVat(false);
      setFile(null);
    }
  }, [open, candidates]);

  // Montants préremplis avec l'attendu du CRA choisi
  useEffect(() => {
    const expected = selected?.expected_ht;
    setHt(expected != null ? String(expected).replace(".", ",") : "");
    setVat(expected != null ? String(round2(expected * 0.2)).replace(".", ",") : "");
  }, [selected]);

  const amount = parse(ht);
  const vatAmount = noVat ? 0 : vat.trim() === "" ? 0 : parse(vat);
  const expected = selected?.expected_ht ?? null;
  const gap = expected != null && Number.isFinite(amount) ? round2(amount - expected) : 0;
  const fileProblem = file && (file.type !== "application/pdf" || file.size > MAX_BYTES) ? "PDF uniquement, 10 Mo maximum." : null;
  const valid = Boolean(selected) && number.trim().length > 0 && Boolean(date) && Number.isFinite(amount) && amount > 0
    && Number.isFinite(vatAmount) && vatAmount >= 0 && Boolean(file) && !fileProblem;

  const save = async () => {
    if (!valid || !selected || !file) return;
    setSaving(true);
    const path = `${selected.freelance_user_id}/${selected.timesheet_id}/${crypto.randomUUID()}.pdf`;
    const { error: upErr } = await supabase.storage.from("freelance-invoices").upload(path, file, { contentType: "application/pdf" });
    if (upErr) {
      setSaving(false);
      toast({ title: "Dépôt impossible", description: upErr.message, variant: "destructive" });
      return;
    }
    // Attendu, mission et échéance transmis aussi par le client : sans la migration, le garde-fou ne les calcule pas pour l'admin.
    const { error } = await supabase.from("freelance_invoices" as never).insert({
      timesheet_id: selected.timesheet_id,
      freelance_user_id: selected.freelance_user_id,
      mission_id: selected.mission_id,
      invoice_number: number.trim(),
      invoice_date: date,
      amount_ht: round2(amount),
      vat_amount: round2(vatAmount),
      expected_ht: expected,
      due_date: addDays(paymentTermsDays),
      file_path: path,
      status: "submitted",
    } as never);
    if (error) {
      await supabase.storage.from("freelance-invoices").remove([path]);
      setSaving(false);
      toast({ title: "Facture non enregistrée", description: withMigrationHint(error.message), variant: "destructive" });
      return;
    }
    setSaving(false);
    toast({ title: "Facture ajoutée", description: `${selected.freelance_name} · ${number.trim()} : à valider comme les autres.` });
    setOpen(false);
    await onDone();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!saving) setOpen(o); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="w-fit gap-1.5" disabled={candidates.length === 0} title={candidates.length === 0 ? "Aucun CRA validé sans facture" : undefined}>
          <MailPlus className="h-3.5 w-3.5" /> Ajouter une facture reçue par mail
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Facture freelance reçue par mail</DialogTitle>
          <DialogDescription>
            Déposez la facture pour le compte du freelance. Elle arrive « En vérification » : validez-la ensuite comme les autres.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="email-inv-cra">CRA validé</Label>
            <Select value={tsId} onValueChange={setTsId}>
              <SelectTrigger id="email-inv-cra" className="h-auto min-h-10 text-left">
                <SelectValue placeholder="Choisir le CRA facturé" />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((c) => (
                  <SelectItem key={c.timesheet_id} value={c.timesheet_id}>
                    <span className="block">{c.freelance_name} · {c.month_label}</span>
                    <span className="block text-xs text-muted-foreground">
                      {c.mission_title} · attendu {c.expected_ht != null ? `${eur(c.expected_ht)} HT` : "non figé"}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selected && (
              <p className="text-xs text-muted-foreground">
                Montant attendu : <span className="font-medium text-foreground">{expected != null ? `${eur(expected)} HT` : "taux non figés"}</span> (jours validés × TJM + frais)
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email-inv-number">Numéro de facture</Label>
            <Input id="email-inv-number" value={number} onChange={(e) => setNumber(e.target.value)} autoComplete="off" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email-inv-date">Date de facture</Label>
            <Input id="email-inv-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email-inv-ht">Montant HT (€)</Label>
            <Input id="email-inv-ht" inputMode="decimal" value={ht} onChange={(e) => setHt(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email-inv-vat">TVA (€)</Label>
            <Input id="email-inv-vat" inputMode="decimal" value={noVat ? "0" : vat} disabled={noVat} onChange={(e) => setVat(e.target.value)} />
          </div>
          <label htmlFor="email-inv-novat" className="flex items-center gap-2 text-sm sm:col-span-2">
            <Checkbox id="email-inv-novat" checked={noVat} onCheckedChange={(v) => setNoVat(v === true)} />
            TVA non applicable (franchise en base, art. 293 B du CGI)
          </label>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="email-inv-file">Facture (PDF)</Label>
            <Input
              id="email-inv-file"
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              aria-invalid={Boolean(fileProblem)}
              aria-describedby="email-inv-file-hint"
              required
            />
            <p id="email-inv-file-hint" className={`text-xs ${fileProblem ? "text-destructive" : "text-muted-foreground"}`}>
              {fileProblem ?? "Le PDF reçu par mail, 10 Mo maximum."}
            </p>
          </div>
          {selected && Number.isFinite(amount) && amount > 0 && (
            <p className="text-sm sm:col-span-2" role="status">
              {gap === 0
                ? <span className="text-[#17693D]">Montant conforme à l'attendu.</span>
                : <span className="text-[#B3134A]">Écart de {gap > 0 ? "+" : "−"}{eur(Math.abs(gap))} avec le montant attendu.</span>}
              {Number.isFinite(vatAmount) && <span className="block text-xs text-muted-foreground">Total TTC : {eur(round2(amount + vatAmount))}</span>}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Annuler</Button>
          <Button onClick={save} disabled={!valid || saving}>{saving ? "Dépôt…" : "Ajouter la facture"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useEffect, useState } from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { isValidIban } from "@/lib/kyc";
import type { InvoicingSettings } from "@/components/platform/admin/invoicingSettings";

type Form = Record<keyof InvoicingSettings, string>;

const toForm = (s: InvoicingSettings | null): Form => ({
  legal_name: s?.legal_name ?? "Kistone SAS",
  legal_form: s?.legal_form ?? "",
  siren: s?.siren ?? "",
  vat_number: s?.vat_number ?? "",
  share_capital: s?.share_capital != null ? String(s.share_capital) : "",
  rcs_city: s?.rcs_city ?? "",
  address: s?.address ?? "",
  contact_email: s?.contact_email ?? "",
  iban: s?.iban ?? "",
  bic: s?.bic ?? "",
  client_payment_terms_days: String(s?.client_payment_terms_days ?? 30),
  freelance_payment_terms_days: String(s?.freelance_payment_terms_days ?? 30),
  vat_rate: String(s?.vat_rate ?? 20),
});

function validate(f: Form): Partial<Record<keyof Form, string>> {
  const errors: Partial<Record<keyof Form, string>> = {};
  if (!f.legal_name.trim()) errors.legal_name = "Raison sociale obligatoire.";
  const siren = f.siren.replace(/\s/g, "");
  if (siren && !/^\d{9}$/.test(siren)) errors.siren = "Le SIREN compte 9 chiffres.";
  if (f.iban.trim() && !isValidIban(f.iban)) errors.iban = "IBAN invalide (format ou clé).";
  if (f.bic.trim() && !/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/i.test(f.bic.replace(/\s/g, ""))) errors.bic = "BIC invalide (8 ou 11 caractères).";
  if (f.contact_email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.contact_email.trim())) errors.contact_email = "Email invalide.";
  for (const k of ["client_payment_terms_days", "freelance_payment_terms_days"] as const) {
    const n = Number(f[k]);
    if (!Number.isInteger(n) || n < 0 || n > 120) errors[k] = "Entre 0 et 120 jours.";
  }
  const vat = Number(f.vat_rate.replace(",", "."));
  if (!Number.isFinite(vat) || vat < 0 || vat > 100) errors.vat_rate = "Taux entre 0 et 100.";
  const capital = Number(f.share_capital.replace(/\s/g, "").replace(",", "."));
  if (f.share_capital.trim() && (!Number.isFinite(capital) || capital < 0)) errors.share_capital = "Montant invalide.";
  return errors;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: InvoicingSettings | null;
  onSaved: () => void | Promise<void>;
}

export function InvoiceSettingsDialog({ open, onOpenChange, settings, onSaved }: Props) {
  const { toast } = useToast();
  const [form, setForm] = useState<Form>(() => toForm(settings));
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setForm(toForm(settings)); setTouched(false); }
  }, [open, settings]);

  const errors = validate(form);
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setTouched(true);
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    const blank = (v: string) => (v.trim() ? v.trim() : null);
    const payload = {
      legal_name: form.legal_name.trim(),
      legal_form: blank(form.legal_form),
      siren: blank(form.siren.replace(/\s/g, "")),
      vat_number: blank(form.vat_number.replace(/\s/g, "").toUpperCase()),
      share_capital: form.share_capital.trim() ? Number(form.share_capital.replace(/\s/g, "").replace(",", ".")) : null,
      rcs_city: blank(form.rcs_city),
      address: blank(form.address),
      contact_email: blank(form.contact_email),
      iban: blank(form.iban.replace(/\s/g, "").toUpperCase()),
      bic: blank(form.bic.replace(/\s/g, "").toUpperCase()),
      client_payment_terms_days: Number(form.client_payment_terms_days),
      freelance_payment_terms_days: Number(form.freelance_payment_terms_days),
      vat_rate: Number(form.vat_rate.replace(",", ".")),
    };
    const { error } = await supabase.from("company_settings" as never).update(payload as never).eq("id", 1);
    setSaving(false);
    if (error) {
      toast({ title: "Enregistrement impossible", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Paramètres de facturation enregistrés" });
    onOpenChange(false);
    await onSaved();
  };

  const field = (k: keyof Form, label: string, opts: { placeholder?: string; type?: string; inputMode?: "numeric" | "decimal" | "email"; hint?: string } = {}) => {
    const id = `invoicing-${k}`;
    const err = touched || form[k] !== toForm(settings)[k] ? errors[k] : undefined;
    return (
      <div className="space-y-1.5">
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          type={opts.type ?? "text"}
          inputMode={opts.inputMode}
          value={form[k]}
          onChange={set(k)}
          placeholder={opts.placeholder}
          aria-invalid={Boolean(err)}
          aria-describedby={err ? `${id}-error` : undefined}
        />
        {err ? (
          <p id={`${id}-error`} className="text-xs text-destructive">{err}</p>
        ) : opts.hint ? (
          <p className="text-xs text-muted-foreground">{opts.hint}</p>
        ) : null}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!saving) onOpenChange(o); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Settings2 className="h-4 w-4" /> Paramètres de facturation</DialogTitle>
          <DialogDescription>
            Identité de Kistone reprise sur chaque facture. Les factures déjà émises gardent les informations du jour de leur émission.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {field("legal_name", "Raison sociale")}
          {field("legal_form", "Forme juridique", { placeholder: "SAS" })}
          {field("siren", "SIREN", { inputMode: "numeric", placeholder: "123 456 789" })}
          {field("vat_number", "N° de TVA intracommunautaire", { placeholder: "FR12345678901" })}
          {field("share_capital", "Capital social (€)", { inputMode: "decimal", placeholder: "1 000" })}
          {field("rcs_city", "Ville du RCS", { placeholder: "Paris" })}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="invoicing-address">Adresse du siège</Label>
            <Textarea id="invoicing-address" rows={2} value={form.address} onChange={set("address")} />
          </div>
          {field("contact_email", "Email de facturation", { type: "email", inputMode: "email" })}
          {field("vat_rate", "Taux de TVA (%)", { inputMode: "decimal" })}
          {field("iban", "IBAN", { placeholder: "FR76 …" })}
          {field("bic", "BIC")}
          {field("client_payment_terms_days", "Délai de paiement client (jours)", { inputMode: "numeric" })}
          {field("freelance_payment_terms_days", "Délai de paiement freelance (jours)", { inputMode: "numeric" })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Annuler</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

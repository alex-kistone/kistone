import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  FIXED_COST_CATEGORIES, FIXED_COST_FREQUENCIES, localIso,
  type FixedCost, type FixedCostCategory, type FixedCostFrequency,
} from "@/lib/treasury";

/** Ajout / modification d'un frais fixe (table admin fixed_costs, hors types générés). */

interface FormState {
  label: string;
  category: FixedCostCategory;
  amount_ht: string;
  vat_amount: string;
  frequency: FixedCostFrequency;
  start_date: string;
  end_date: string;
  notes: string;
}

const toForm = (c: FixedCost | null): FormState => ({
  label: c?.label ?? "",
  category: c?.category ?? "logiciels",
  amount_ht: c ? String(c.amount_ht).replace(".", ",") : "",
  vat_amount: c ? String(c.vat_amount).replace(".", ",") : "",
  frequency: c?.frequency ?? "monthly",
  start_date: c?.start_date ?? localIso(),
  end_date: c?.end_date ?? "",
  notes: c?.notes ?? "",
});

const num = (v: string) => Number(v.replace(/\s/g, "").replace(",", "."));

export const FixedCostDialog = ({ open, cost, onOpenChange, onSaved }: {
  open: boolean;
  cost: FixedCost | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) => {
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(toForm(cost));
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) setForm(toForm(cost)); }, [open, cost]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const amount = num(form.amount_ht);
  const vat = form.vat_amount.trim() === "" ? 0 : num(form.vat_amount);
  const errors = {
    label: !form.label.trim() ? "Libellé obligatoire" : null,
    amount_ht: !Number.isFinite(amount) || form.amount_ht.trim() === "" || amount < 0 ? "Montant HT invalide" : null,
    vat_amount: !Number.isFinite(vat) || vat < 0 ? "TVA invalide" : null,
    end_date: form.frequency !== "once" && form.end_date && form.end_date < form.start_date ? "La fin doit suivre le début" : null,
  };
  const invalid = Object.values(errors).some(Boolean) || !form.start_date;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (invalid) return;
    setSaving(true);
    const payload = {
      label: form.label.trim(),
      category: form.category,
      amount_ht: Math.round(amount * 100) / 100,
      vat_amount: Math.round(vat * 100) / 100,
      frequency: form.frequency,
      start_date: form.start_date,
      end_date: form.frequency === "once" ? null : form.end_date || null,
      notes: form.notes.trim() || null,
    };
    const table = supabase.from("fixed_costs" as never);
    const { error } = cost
      ? await table.update(payload as never).eq("id", cost.id)
      : await table.insert(payload as never);
    setSaving(false);
    if (error) {
      toast({ title: "Enregistrement impossible", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: cost ? "Frais fixe modifié" : "Frais fixe ajouté" });
    onOpenChange(false);
    onSaved();
  };

  const fieldError = (key: keyof typeof errors) =>
    errors[key] && (key !== "label" || form.label !== "") && (key !== "amount_ht" || form.amount_ht !== "")
      ? <p id={`fc-${key}-error`} className="text-xs text-destructive">{errors[key]}</p>
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{cost ? "Modifier le frais fixe" : "Nouveau frais fixe"}</DialogTitle>
          <DialogDescription>Charge récurrente ou ponctuelle, prise en compte dans la trésorerie et la TVA déductible.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="fc-label">Libellé</Label>
            <Input id="fc-label" value={form.label} onChange={(e) => set("label", e.target.value)} placeholder="Ex. Abonnement Pennylane" required aria-invalid={Boolean(fieldError("label"))} />
            {fieldError("label")}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fc-category">Catégorie</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v as FixedCostCategory)}>
                <SelectTrigger id="fc-category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(FIXED_COST_CATEGORIES).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fc-frequency">Fréquence</Label>
              <Select value={form.frequency} onValueChange={(v) => set("frequency", v as FixedCostFrequency)}>
                <SelectTrigger id="fc-frequency"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(FIXED_COST_FREQUENCIES).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fc-amount">Montant HT (€)</Label>
              <Input id="fc-amount" inputMode="decimal" value={form.amount_ht} onChange={(e) => set("amount_ht", e.target.value)} placeholder="0,00" required aria-invalid={Boolean(fieldError("amount_ht"))} />
              {fieldError("amount_ht")}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fc-vat">TVA (€)</Label>
              <Input id="fc-vat" inputMode="decimal" value={form.vat_amount} onChange={(e) => set("vat_amount", e.target.value)} placeholder="0,00" aria-invalid={Boolean(fieldError("vat_amount"))} />
              {fieldError("vat_amount")}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fc-start">{form.frequency === "once" ? "Date" : "Première échéance"}</Label>
              <Input id="fc-start" type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} required />
            </div>
            {form.frequency !== "once" && (
              <div className="space-y-1.5">
                <Label htmlFor="fc-end">Fin (facultatif)</Label>
                <Input id="fc-end" type="date" value={form.end_date} min={form.start_date} onChange={(e) => set("end_date", e.target.value)} aria-invalid={Boolean(errors.end_date)} />
                {fieldError("end_date")}
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fc-notes">Notes</Label>
            <Textarea id="fc-notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={invalid || saving}>{saving ? "Enregistrement…" : "Enregistrer"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

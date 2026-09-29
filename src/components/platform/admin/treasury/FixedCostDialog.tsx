import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  chargeToFixedCost, fixedCostToCharge, monthKeyOf, localIso, validateCharge, FIXED_COST_CATEGORIES, FIXED_COST_FREQUENCIES,
  type FixedCost, type FixedCostCategory,
} from "@/lib/treasury";
import { parseAmount } from "./usePersistentInput";

/**
 * Charge interne saisie comme dans ADV-Freelance : montant TTC, dont TVA, premier et dernier mois.
 * Enregistrée dans fixed_costs (HT = TTC − TVA ; même mois de début et de fin = ponctuelle).
 */

interface FormState { label: string; category: FixedCostCategory; ttc: string; vat: string; firstMonth: string; lastMonth: string }

const frNum = (n: number) => String(n).replace(".", ",");
const toForm = (c: FixedCost | null): FormState => {
  if (!c) return { label: "", category: "logiciels", ttc: "", vat: "", firstMonth: monthKeyOf(localIso()), lastMonth: "" };
  const ch = fixedCostToCharge(c);
  return { label: c.label, category: c.category, ttc: frNum(ch.ttc), vat: frNum(ch.vat), firstMonth: ch.firstMonth, lastMonth: ch.lastMonth ?? "" };
};

export const ChargeForm = ({ cost, idPrefix, onSaved, onCancel }: {
  /** Charge à modifier ; null pour une nouvelle charge. */
  cost: FixedCost | null;
  idPrefix: string;
  onSaved: () => void | Promise<void>;
  onCancel?: () => void;
}) => {
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(() => toForm(cost));
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(toForm(cost)); setTouched(false); }, [cost]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const ttc = parseAmount(form.ttc);
  const vat = form.vat.trim() === "" ? 0 : parseAmount(form.vat);
  const input = { ttc: ttc ?? Number.NaN, vat: vat ?? Number.NaN, firstMonth: form.firstMonth, lastMonth: form.lastMonth || null };
  const errors = { ...validateCharge(input), ...(form.label.trim() ? {} : { label: "Libellé obligatoire" }) };
  const invalid = Object.keys(errors).length > 0;
  const show = (k: keyof typeof errors) => (touched || (k === "vat" && form.vat) || (k === "lastMonth" && form.lastMonth) ? errors[k] : undefined);
  const kept = cost && (cost.frequency === "quarterly" || cost.frequency === "yearly") && form.firstMonth !== form.lastMonth ? cost.frequency : null;
  const kind = form.lastMonth && form.lastMonth === form.firstMonth ? "Ponctuelle" : form.lastMonth ? "Mensuelle, avec fin" : "Récurrente mensuelle";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (invalid) return;
    setSaving(true);
    const payload = { label: form.label.trim(), category: form.category, ...chargeToFixedCost(input, cost) };
    const table = supabase.from("fixed_costs" as never);
    const { error } = cost ? await table.update(payload as never).eq("id", cost.id) : await table.insert(payload as never);
    setSaving(false);
    if (error) {
      toast({ title: "Enregistrement impossible", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: cost ? "Charge modifiée" : "Charge ajoutée", description: `${payload.label} · ${kind.toLowerCase()}` });
    if (!cost) { setForm(toForm(null)); setTouched(false); }
    await onSaved();
  };

  const id = (k: string) => `${idPrefix}-${k}`;
  const err = (k: keyof typeof errors) => {
    const m = show(k);
    return m ? <p id={id(`${k}-error`)} className="text-xs text-destructive">{m}</p> : null;
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
          <Label htmlFor={id("label")}>Libellé</Label>
          <Input id={id("label")} value={form.label} onChange={(e) => set("label", e.target.value)} placeholder="Ex. Loyer bureau" required aria-invalid={Boolean(show("label"))} aria-describedby={show("label") ? id("label-error") : undefined} />
          {err("label")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={id("category")}>Catégorie</Label>
          <Select value={form.category} onValueChange={(v) => set("category", v as FixedCostCategory)}>
            <SelectTrigger id={id("category")}><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(FIXED_COST_CATEGORIES).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={id("ttc")}>Montant TTC (€)</Label>
          <Input id={id("ttc")} inputMode="decimal" value={form.ttc} onChange={(e) => set("ttc", e.target.value)} placeholder="0,00" className="text-right tabular-nums" required aria-invalid={Boolean(show("ttc"))} aria-describedby={show("ttc") ? id("ttc-error") : undefined} />
          {err("ttc")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={id("vat")}>dont TVA (€)</Label>
          <Input id={id("vat")} inputMode="decimal" value={form.vat} onChange={(e) => set("vat", e.target.value)} placeholder="0,00" className="text-right tabular-nums" aria-invalid={Boolean(show("vat"))} aria-describedby={show("vat") ? id("vat-error") : undefined} />
          {err("vat")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={id("first")}>Premier mois</Label>
          <Input id={id("first")} type="month" value={form.firstMonth} onChange={(e) => set("firstMonth", e.target.value)} placeholder="AAAA-MM" required aria-invalid={Boolean(show("firstMonth"))} />
          {err("firstMonth")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={id("last")}>Dernier mois (facultatif)</Label>
          <Input id={id("last")} type="month" value={form.lastMonth} min={form.firstMonth} onChange={(e) => set("lastMonth", e.target.value)} placeholder="AAAA-MM" aria-invalid={Boolean(show("lastMonth"))} aria-describedby={show("lastMonth") ? id("lastMonth-error") : undefined} />
          {err("lastMonth")}
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {kind}{kept ? ` (fréquence ${FIXED_COST_FREQUENCIES[kept].toLowerCase()} conservée)` : ""}
          {ttc != null && vat != null && ttc >= vat ? ` · ${(Math.round((ttc - vat) * 100) / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} € HT` : ""}
        </p>
        <div className="flex gap-2 sm:justify-end">
          {onCancel && <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>Annuler</Button>}
          <Button type="submit" disabled={saving}>{saving ? "Enregistrement…" : cost ? "Enregistrer" : "Ajouter la charge"}</Button>
        </div>
      </div>
    </form>
  );
};

/** Modification d'une charge existante. */
export const FixedCostDialog = ({ open, cost, onOpenChange, onSaved }: {
  open: boolean;
  cost: FixedCost | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Modifier la charge</DialogTitle>
        <DialogDescription>Montant TTC mensuel. Sans mois de fin, la charge est récurrente ; même mois de début et de fin pour une charge ponctuelle.</DialogDescription>
      </DialogHeader>
      {cost && (
        <ChargeForm
          cost={cost}
          idPrefix="fc-edit"
          onCancel={() => onOpenChange(false)}
          onSaved={() => { onOpenChange(false); onSaved(); }}
        />
      )}
    </DialogContent>
  </Dialog>
);

import { useEffect, useState } from "react";
import { Paperclip, Plus, Receipt, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { openPrivateFile } from "@/components/platform/admin/adv";
import { EXPENSE_CATEGORIES, euro, type ExpenseCategory, type TimesheetExpense } from "@/lib/cra";

const RECEIPT_TYPES: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png" };
const RECEIPT_MAX_BYTES = 10 * 1024 * 1024;

interface Props {
  /** CRA concerné ; null tant qu'aucun jour n'a été saisi (le freelance le crée à la première saisie). */
  timesheetId: string | null;
  editable: boolean;
  /** Crée le CRA du mois si besoin et renvoie son id (côté freelance). */
  ensureTimesheet?: () => Promise<string | null>;
  month: number;
  year: number;
  onChange?: (expenses: TimesheetExpense[]) => void;
}

const emptyForm = { expense_date: "", category: "transport" as ExpenseCategory, label: "", amount_ht: "", vat_amount: "" };

/** Frais de mission d'un CRA : saisie par le freelance tant que le CRA est ouvert, lecture pour le client. */
export default function TimesheetExpenses({ timesheetId, editable, ensureTimesheet, month, year, onChange }: Props) {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<TimesheetExpense[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const update = (list: TimesheetExpense[]) => {
    setExpenses(list);
    onChange?.(list);
  };

  useEffect(() => {
    if (!timesheetId) { update([]); return; }
    (async () => {
      const { data } = await supabase.from("timesheet_expenses" as never).select("*")
        .eq("timesheet_id", timesheetId).order("expense_date");
      update(((data ?? []) as unknown as TimesheetExpense[]).map((e) => ({ ...e, amount_ht: Number(e.amount_ht), vat_amount: Number(e.vat_amount) })));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timesheetId]);

  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`;
  const amount = Number(form.amount_ht.replace(",", "."));
  const vat = form.vat_amount ? Number(form.vat_amount.replace(",", ".")) : 0;
  const formValid = form.expense_date >= monthStart && form.expense_date <= monthEnd && form.label.trim().length > 0
    && amount > 0 && vat >= 0 && Number.isFinite(amount) && Number.isFinite(vat);

  const add = async () => {
    if (!formValid) return;
    if (file && (!RECEIPT_TYPES[file.type] || file.size > RECEIPT_MAX_BYTES)) {
      toast({ title: "Justificatif non accepté", description: "PDF, JPG ou PNG, 10 Mo maximum.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const tsId = timesheetId ?? (await ensureTimesheet?.()) ?? null;
    if (!tsId) { setSaving(false); return; }
    let receipt_path: string | null = null;
    if (file) {
      receipt_path = `${tsId}/${crypto.randomUUID()}.${RECEIPT_TYPES[file.type]}`;
      const { error } = await supabase.storage.from("expense-receipts").upload(receipt_path, file, { contentType: file.type });
      if (error) {
        setSaving(false);
        toast({ title: "Dépôt du justificatif impossible", description: error.message, variant: "destructive" });
        return;
      }
    }
    const { data, error } = await supabase.from("timesheet_expenses" as never).insert({
      timesheet_id: tsId, expense_date: form.expense_date, category: form.category,
      label: form.label.trim(), amount_ht: amount, vat_amount: vat, receipt_path,
    } as never).select("*").single();
    setSaving(false);
    if (error) {
      if (receipt_path) await supabase.storage.from("expense-receipts").remove([receipt_path]);
      toast({ title: "Frais non enregistré", description: error.message, variant: "destructive" });
      return;
    }
    const row = data as unknown as TimesheetExpense;
    update([...expenses, { ...row, amount_ht: Number(row.amount_ht), vat_amount: Number(row.vat_amount) }]
      .sort((a, b) => a.expense_date.localeCompare(b.expense_date)));
    setForm(emptyForm);
    setFile(null);
    setAdding(false);
  };

  const remove = async (e: TimesheetExpense) => {
    const { error } = await supabase.from("timesheet_expenses" as never).delete().eq("id", e.id);
    if (error) {
      toast({ title: "Suppression impossible", description: error.message, variant: "destructive" });
      return;
    }
    if (e.receipt_path) await supabase.storage.from("expense-receipts").remove([e.receipt_path]);
    update(expenses.filter((x) => x.id !== e.id));
  };

  const openReceipt = async (path: string) => {
    const err = await openPrivateFile("expense-receipts", path);
    if (err) toast({ title: "Ouverture impossible", description: err, variant: "destructive" });
  };

  if (!editable && expenses.length === 0) return null;
  const totalHt = expenses.reduce((s, e) => s + e.amount_ht, 0);

  return (
    <section aria-labelledby="cra-expenses" className="mt-6 border-t border-border pt-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 id="cra-expenses" className="flex items-center gap-2 text-sm font-semibold">
          <Receipt className="h-4 w-4" aria-hidden="true" /> Frais de mission
        </h4>
        {editable && !adding ? (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Ajouter un frais
          </Button>
        ) : null}
      </div>

      {expenses.length === 0 && !adding ? (
        <p className="text-sm text-muted-foreground">Aucun frais ce mois-ci.</p>
      ) : null}

      {expenses.length > 0 ? (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {expenses.map((e) => (
            <li key={e.id} className="flex flex-col gap-1 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="min-w-0">
                <span className="font-medium">{e.label}</span>
                <span className="text-muted-foreground"> · {EXPENSE_CATEGORIES[e.category]} · {new Date(`${e.expense_date}T12:00:00`).toLocaleDateString("fr-FR")}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="font-medium tabular-nums">{euro(e.amount_ht)} HT</span>
                {e.vat_amount > 0 ? <span className="text-xs text-muted-foreground">+ {euro(e.vat_amount)} TVA</span> : null}
                {e.receipt_path ? (
                  <Button size="sm" variant="ghost" className="h-8 gap-1 px-2" onClick={() => openReceipt(e.receipt_path!)}>
                    <Paperclip className="h-3.5 w-3.5" aria-hidden="true" /> Justificatif
                  </Button>
                ) : null}
                {editable ? (
                  <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Supprimer le frais ${e.label}`} onClick={() => remove(e)}>
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                ) : null}
              </span>
            </li>
          ))}
          <li className="flex justify-between p-3 text-sm font-semibold">
            <span>Total des frais</span>
            <span className="tabular-nums">{euro(totalHt)} HT</span>
          </li>
        </ul>
      ) : null}

      {editable && adding ? (
        <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl border border-border bg-muted/30 p-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="exp-date" className="text-xs">Date</Label>
            <Input id="exp-date" type="date" min={monthStart} max={monthEnd} value={form.expense_date}
              onChange={(e) => setForm((f) => ({ ...f, expense_date: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">Catégorie</Label>
            <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as ExpenseCategory }))}>
              <SelectTrigger aria-label="Catégorie"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(EXPENSE_CATEGORIES) as ExpenseCategory[]).map((c) => (
                  <SelectItem key={c} value={c}>{EXPENSE_CATEGORIES[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="exp-label" className="text-xs">Libellé</Label>
            <Input id="exp-label" placeholder="Ex. : train Paris – Lyon, atelier client" value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="exp-ht" className="text-xs">Montant HT (€)</Label>
            <Input id="exp-ht" inputMode="decimal" value={form.amount_ht}
              onChange={(e) => setForm((f) => ({ ...f, amount_ht: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="exp-vat" className="text-xs">TVA (€, facultatif)</Label>
            <Input id="exp-vat" inputMode="decimal" value={form.vat_amount}
              onChange={(e) => setForm((f) => ({ ...f, vat_amount: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="exp-file" className="text-xs">Justificatif (PDF, JPG ou PNG)</Label>
            <Input id="exp-file" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setForm(emptyForm); setFile(null); }}>Annuler</Button>
            <Button size="sm" onClick={add} disabled={!formValid || saving}>{saving ? "Enregistrement…" : "Enregistrer le frais"}</Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

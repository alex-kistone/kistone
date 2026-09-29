import { useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { withMigrationHint } from "@/lib/invoices";
import { monthKeyOf, monthLabel, type CashBalance } from "@/lib/treasury";
import { signedEur } from "./format";
import { Section, StatusPill } from "./shared";
import { parseAmount } from "./usePersistentInput";

/** Solde de départ : solde bancaire réel au 1er d'un mois (table cash_balances). */
export const CashBalancesCard = ({ balances, unavailable, currentMonth, onChanged }: {
  balances: CashBalance[];
  unavailable: boolean;
  currentMonth: string;
  onChanged: () => void | Promise<void>;
}) => {
  const { toast } = useToast();
  const [month, setMonth] = useState(currentMonth);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<CashBalance | null>(null);

  const value = parseAmount(amount);
  const monthOk = /^\d{4}-\d{2}$/.test(month);
  const valid = monthOk && value !== null;
  const sorted = [...balances].sort((a, b) => b.month.localeCompare(a.month));
  const existing = monthOk ? balances.find((b) => monthKeyOf(b.month) === month) : undefined;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid || value === null) return;
    setSaving(true);
    const { error } = await supabase
      .from("cash_balances" as never)
      .upsert({ month: `${month}-01`, amount: Math.round(value * 100) / 100, note: note.trim() || null } as never, { onConflict: "month" });
    setSaving(false);
    if (error) {
      toast({ title: "Solde non enregistré", description: withMigrationHint(error.message), variant: "destructive" });
      return;
    }
    toast({ title: "Solde enregistré", description: `${monthLabel(month)} : ${signedEur(value)} au 1er du mois.` });
    setAmount("");
    setNote("");
    await onChanged();
  };

  const remove = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from("cash_balances" as never).delete().eq("month", toDelete.month);
    setToDelete(null);
    if (error) {
      toast({ title: "Suppression impossible", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Solde supprimé" });
    await onChanged();
  };

  return (
    <Section
      title="Solde de départ"
      description="Solde bancaire réel au premier jour d'un mois. Le plus récent sert de point de départ ; les mois suivants s'enchaînent. À terme, lu automatiquement depuis Pennylane."
    >
      {unavailable ? (
        <p className="text-sm text-muted-foreground">Migration à appliquer : les soldes ne peuvent pas encore être enregistrés.</p>
      ) : (
        <>
          <form onSubmit={save} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[10rem_12rem_1fr_auto] lg:items-end" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="cash-balance-month">Mois</Label>
              <Input id="cash-balance-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} placeholder="AAAA-MM" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cash-balance-amount">Solde au 1er du mois (€)</Label>
              <Input id="cash-balance-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className="text-right tabular-nums" required />
            </div>
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <Label htmlFor="cash-balance-note">Note (facultatif)</Label>
              <Input id="cash-balance-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Relevé Qonto, compte principal" />
            </div>
            <Button type="submit" className="w-full sm:w-fit" disabled={!valid || saving}>
              {saving ? "Enregistrement…" : "Enregistrer le solde"}
            </Button>
          </form>
          {existing && <p className="mt-2 text-xs text-muted-foreground">Un solde existe déjà pour {monthLabel(month)} ({signedEur(existing.amount)}) : il sera remplacé.</p>}

          {sorted.length > 0 ? (
            <ul className="mt-4 divide-y divide-border rounded-lg border border-border" aria-label="Soldes enregistrés">
              {sorted.map((b, i) => (
                <li key={b.month} className="flex items-center justify-between gap-3 px-3 py-2">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      1er {monthLabel(monthKeyOf(b.month)).toLowerCase()}
                      {i === 0 && <StatusPill tone="success">Point de départ</StatusPill>}
                    </p>
                    {b.note && <p className="truncate text-xs text-muted-foreground" title={b.note}>{b.note}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className={`whitespace-nowrap text-sm font-semibold tabular-nums ${b.amount < 0 ? "text-destructive" : ""}`}>{signedEur(b.amount)}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setToDelete(b)}
                      aria-label={`Supprimer le solde du 1er ${monthLabel(monthKeyOf(b.month)).toLowerCase()}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">Aucun solde enregistré : la projection part de 0 €.</p>
          )}
        </>
      )}

      <AlertDialog open={toDelete !== null} onOpenChange={(o) => { if (!o) setToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce solde ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le solde du 1er {toDelete ? monthLabel(monthKeyOf(toDelete.month)).toLowerCase() : ""} ne servira plus de point de départ.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Section>
  );
};

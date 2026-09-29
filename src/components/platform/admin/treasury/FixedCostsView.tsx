import { useState } from "react";
import { DatabaseZap, Pencil, Trash2, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { eur } from "@/lib/invoices";
import { frDate } from "@/components/platform/admin/adv";
import {
  FIXED_COST_CATEGORIES, FIXED_COST_FREQUENCIES, isFixedCostActive, localIso, monthlyEquivalent, type FixedCost,
} from "@/lib/treasury";
import { Amount, Cell, EmptyState, Section, StatusPill } from "./shared";
import { ChargeForm, FixedCostDialog } from "./FixedCostDialog";

/** Charges internes (frais fixes) : saisie à la ADV-Freelance, liste, modification, suppression, équivalent mensuel. */

export const FixedCostsView = ({ costs, unavailable, onChanged }: { costs: FixedCost[]; unavailable: boolean; onChanged: () => void }) => {
  const { toast } = useToast();
  const [editing, setEditing] = useState<FixedCost | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<FixedCost | null>(null);
  const today = localIso();

  if (unavailable) {
    return <EmptyState icon={DatabaseZap}>Table des frais fixes indisponible (migration à appliquer).</EmptyState>;
  }

  const monthlyTotal = costs.filter((c) => isFixedCostActive(c, today)).reduce((s, c) => s + monthlyEquivalent(c), 0);

  const openDialog = (c: FixedCost) => {
    setEditing(c);
    setDialogOpen(true);
  };

  const remove = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from("fixed_costs" as never).delete().eq("id", toDelete.id);
    setToDelete(null);
    if (error) {
      toast({ title: "Suppression impossible", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Frais fixe supprimé" });
    onChanged();
  };

  return (
    <div className="space-y-4">
      <Section
        title="Charges internes"
        description="Montants TTC mensuels (loyer, salaires, outils…). Sans mois de fin, la charge est récurrente ; même mois de début et de fin pour une charge ponctuelle."
      >
        <ChargeForm cost={null} idPrefix="fc-new" onSaved={onChanged} />
      </Section>

      <p className="text-sm text-muted-foreground">
        Charges récurrentes en cours : <span className="font-semibold text-foreground tabular-nums">≈ {eur(monthlyTotal)} HT / mois</span>
      </p>

      {costs.length === 0 ? (
        <EmptyState icon={WalletCards}>Aucune charge enregistrée. Ajoutez loyer, salaires, logiciels, comptable… pour affiner la trésorerie.</EmptyState>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <div aria-hidden="true" className="hidden gap-3 border-b border-border px-4 py-2 text-xs font-medium text-muted-foreground md:grid md:grid-cols-[1.6fr_0.9fr_0.8fr_0.7fr_0.8fr_1fr_auto]">
            <span>Libellé</span><span>Catégorie</span><span className="text-right">Montant HT</span><span className="text-right">TVA</span><span>Fréquence</span><span>Période</span><span className="w-[76px]" />
          </div>
          <ul className="divide-y divide-border">
            {costs.map((c) => {
              const ended = Boolean(c.end_date && c.end_date < today) || (c.frequency === "once" && c.start_date < today);
              return (
                <li key={c.id} className={`grid grid-cols-2 gap-3 p-4 md:grid-cols-[1.6fr_0.9fr_0.8fr_0.7fr_0.8fr_1fr_auto] md:items-center ${ended ? "opacity-60" : ""}`}>
                  <Cell label="Libellé" className="col-span-2 md:col-span-1">
                    <span className="font-semibold">{c.label}</span>
                    {c.notes && <span className="block truncate text-xs text-muted-foreground" title={c.notes}>{c.notes}</span>}
                  </Cell>
                  <Cell label="Catégorie">{FIXED_COST_CATEGORIES[c.category] ?? c.category}</Cell>
                  <Cell label="Montant HT" className="md:text-right"><Amount value={Number(c.amount_ht)} outflow /></Cell>
                  <Cell label="TVA" className="md:text-right"><span className="tabular-nums">{eur(c.vat_amount)}</span></Cell>
                  <Cell label="Fréquence">
                    {FIXED_COST_FREQUENCIES[c.frequency] ?? c.frequency}
                    {c.frequency !== "once" && c.frequency !== "monthly" && (
                      <span className="block text-xs text-muted-foreground">≈ {eur(monthlyEquivalent(c))} / mois</span>
                    )}
                  </Cell>
                  <Cell label="Période">
                    <span className="mb-1 block">
                      {ended ? <StatusPill tone="neutral">Terminé</StatusPill>
                        : c.start_date > today ? <StatusPill tone="warning">À venir</StatusPill>
                        : c.frequency === "once" ? <StatusPill tone="neutral">Ponctuel</StatusPill>
                        : <StatusPill tone="success">En cours</StatusPill>}
                    </span>
                    {c.frequency === "once" ? frDate(c.start_date) : `Depuis le ${frDate(c.start_date)}`}
                    {c.end_date && c.frequency !== "once" && <span className="block text-xs text-muted-foreground">{ended ? "Terminé le" : "Jusqu'au"} {frDate(c.end_date)}</span>}
                  </Cell>
                  <div className="col-span-2 flex justify-end gap-1 md:col-span-1 md:w-[76px]">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openDialog(c)} aria-label={`Modifier ${c.label}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setToDelete(c)} aria-label={`Supprimer ${c.label}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <FixedCostDialog open={dialogOpen} cost={editing} onOpenChange={setDialogOpen} onSaved={onChanged} />

      <AlertDialog open={toDelete !== null} onOpenChange={(o) => { if (!o) setToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce frais fixe ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {toDelete?.label} » ne sera plus compté dans la trésorerie ni dans la TVA déductible. Pour un frais arrêté, préférez renseigner une date de fin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

import { useCallback, useEffect, useState } from "react";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PARTY_LABEL, frDate } from "./adv";
import { KYC_CHANGED_EVENT, loadDossiers, useOpenDossier, type DossierRow } from "./kycDossiers";

/** Vue d'ensemble : dossiers KYC envoyés qui attendent une vérification. */
const PendingDossiersCard = () => {
  const openDossier = useOpenDossier();
  const [rows, setRows] = useState<DossierRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await loadDossiers("submitted");
      list.sort((a, b) => (a.submitted_at ?? "").localeCompare(b.submitted_at ?? ""));
      setRows(list);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
      setRows([]);
    }
  }, []);

  useEffect(() => {
    load();
    window.addEventListener(KYC_CHANGED_EVENT, load);
    return () => window.removeEventListener(KYC_CHANGED_EVENT, load);
  }, [load]);

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          Dossiers à vérifier
          {rows && rows.length > 0 && (
            <span className="rounded-full bg-[#EDF3FB] px-2 py-0.5 text-xs font-medium text-[#1E4F8F]">{rows.length}</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows === null ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : error ? (
          <p className="text-sm text-destructive">Dossiers indisponibles : {error}</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun dossier à vérifier.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {rows.map((r) => (
              <li key={r.user_id}>
                <button
                  type="button"
                  onClick={() => openDossier(r.user_id)}
                  aria-label={`Vérifier le dossier de ${r.displayName}`}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{r.displayName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {PARTY_LABEL[r.party]}{r.companyName ? ` · ${r.companyName}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    Envoyé le {frDate(r.submitted_at)}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingDossiersCard;

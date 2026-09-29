import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import DossierDetail from "./DossierDetail";
import { DOSSIER_PARAM, loadDossier, useOpenDossier, type DossierRow } from "./kycDossiers";

/**
 * Panneau latéral de revue d'un dossier KYC, monté une fois dans l'admin.
 * Il s'ouvre dès que l'URL porte ?dossier=<user_id>, quel que soit l'onglet.
 */
const DossierSheet = () => {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get(DOSSIER_PARAM);
  const openDossier = useOpenDossier();
  // undefined = chargement ; null = aucun dossier pour ce compte
  const [dossier, setDossier] = useState<DossierRow | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (uid: string) => {
    try {
      setDossier(await loadDossier(uid));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
      setDossier(null);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    setDossier(undefined);
    setError(null);
    load(userId);
  }, [userId, load]);

  const message = (title: string, text: string) => (
    <SheetHeader className="pr-8 text-left">
      <SheetTitle>{title}</SheetTitle>
      <SheetDescription>{text}</SheetDescription>
    </SheetHeader>
  );

  return (
    <Sheet open={!!userId} onOpenChange={(open) => { if (!open) openDossier(null); }}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        {!userId ? null : dossier === undefined ? (
          <>
            <SheetTitle className="sr-only">Dossier</SheetTitle>
            <SheetDescription className="sr-only">Chargement du dossier</SheetDescription>
            <p className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement du dossier…
            </p>
          </>
        ) : error ? (
          message("Dossier indisponible", error)
        ) : dossier === null ? (
          message("Dossier", "Aucun dossier ouvert pour ce compte : il s'ouvre à la création d'une mission.")
        ) : (
          <DossierDetail key={dossier.user_id} dossier={dossier} onChanged={() => load(dossier.user_id)} />
        )}
      </SheetContent>
    </Sheet>
  );
};

export default DossierSheet;

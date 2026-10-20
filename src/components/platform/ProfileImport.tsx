import { useRef, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { functionErrorMessage } from "@/components/platform/admin/adv";
import type { ImportedProfile } from "@/lib/profileImport";

const MAX_BYTES = 8 * 1024 * 1024;

const toBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

/**
 * Import facultatif d'un CV ou de l'export PDF LinkedIn : l'IA propose intitulé, présentation,
 * clients, missions, langues et métiers, que le freelance relit avant d'enregistrer. Le document
 * n'est pas conservé.
 */
export default function ProfileImport({ vertical, onImported }: { vertical: string; onImported: (p: ImportedProfile) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (file.type !== "application/pdf") return setError("Choisissez un fichier PDF.");
    if (file.size > MAX_BYTES) return setError("Fichier trop lourd (8 Mo maximum).");
    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("parse-profile", {
        body: { pdf_base64: await toBase64(file), vertical },
      });
      if (fnError) throw new Error(await functionErrorMessage(fnError));
      if (data?.error) throw new Error(data.error);
      onImported(data as ImportedProfile);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Le document n'a pas pu être lu.");
    } finally {
      setLoading(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/40 p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div>
            <p className="font-medium">Gagnez du temps : importez votre CV <span className="font-normal text-muted-foreground">(facultatif)</span></p>
            <p className="mt-1 text-sm text-muted-foreground">
              Votre CV ou votre profil LinkedIn en PDF (sur LinkedIn : Plus › Enregistrer au format PDF). Nous pré-remplissons
              votre présentation, vos clients, vos missions et vos langues : vous relisez avant d'enregistrer. Le document n'est pas conservé.
            </p>
          </div>
        </div>
        <Button type="button" variant="outline" className="shrink-0 gap-2" disabled={loading} onClick={() => input.current?.click()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          {loading ? "Lecture en cours…" : "Importer un PDF"}
        </Button>
        <input ref={input} type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      </div>
      {error ? <p role="alert" className="mt-3 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

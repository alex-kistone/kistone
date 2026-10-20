import "./linkedin-pdf-howto.css";

const Cursor = ({ className }: { className: string }) => (
  <svg className={`${className} pointer-events-none absolute h-5 w-5 drop-shadow`} viewBox="0 0 24 24" style={{ opacity: 0 }}>
    <path d="M5 3l14 8.5-6.2 1.3 3.7 6.9-2.6 1.4-3.7-6.9L5 19z" fill="#141312" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

/**
 * Illustration animée : sur un profil LinkedIn, clic sur « Ressources », puis sur « Enregistrer
 * au format PDF », et le PDF est téléchargé. Même principe que LinkedinUrlHowTo.
 */
export default function LinkedinPdfHowTo() {
  return (
    <figure className="m-0" aria-label="Sur votre profil LinkedIn, cliquez sur Ressources puis sur Enregistrer au format PDF">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/60 p-3" aria-hidden="true">
        <div className="relative rounded-xl border border-border bg-card shadow-sm">
          {/* Profil LinkedIn schématique */}
          <div className="h-8 rounded-t-xl bg-[#DCE6F1]" />
          <div className="px-4 pb-24">
            <div className="-mt-5 h-10 w-10 rounded-full border-2 border-card bg-[#B7C7DA]" />
            <div className="mt-2 h-2.5 w-28 rounded-full bg-foreground/80" />
            <div className="mt-1.5 h-2 w-40 rounded-full bg-border" />
            {/* Boutons du profil */}
            <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold">
              <span className="rounded-full bg-[#0A66C2] px-2.5 py-1 text-white">Disponible pour</span>
              <span className="hidden rounded-full border border-[#0A66C2] px-2.5 py-1 text-[#0A66C2] min-[400px]:inline">Ajouter une section</span>
              <span className="li-pdf-button relative rounded-full border border-foreground/40 px-2.5 py-1 text-foreground">
                Ressources
                <Cursor className="li-pdf-cursor1 left-[60%] top-[55%]" />
                {/* Menu « Ressources », ouvert sous le bouton */}
                <span className="li-pdf-menu absolute right-0 top-full z-10 mt-1.5 block w-[190px] rounded-lg border border-border bg-card py-1 text-left font-normal shadow-md" style={{ opacity: 0 }}>
                  <span className="block px-3 py-1.5 text-muted-foreground">Envoyer le profil par message</span>
                  <span className="li-pdf-item relative block px-3 py-1.5 font-semibold text-foreground">
                    Enregistrer au format PDF
                    <Cursor className="li-pdf-cursor2 left-[70%] top-[45%]" />
                  </span>
                  <span className="block px-3 py-1.5 text-muted-foreground">Activité</span>
                </span>
              </span>
            </div>
          </div>
        </div>
        {/* Téléchargement terminé */}
        <span className="li-pdf-done absolute left-1/2 top-2 -translate-x-1/2 rounded-full bg-foreground px-2.5 py-1 text-[10px] font-semibold text-background" style={{ opacity: 0 }}>
          Profile.pdf téléchargé
        </span>
      </div>
      <figcaption className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Sur ordinateur : ouvrez votre profil LinkedIn, cliquez sur « Ressources » (ou « Plus » selon les versions) sous votre nom, puis sur
        « Enregistrer au format PDF ». Le fichier se télécharge : importez-le ici.
      </figcaption>
    </figure>
  );
}

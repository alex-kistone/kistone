import "./linkedin-howto.css";

/**
 * Illustration animée : un navigateur ouvert sur un profil LinkedIn, le curseur
 * clique dans la barre d'adresse, l'URL se sélectionne, « Copié » apparaît.
 */
export default function LinkedinUrlHowTo() {
  return (
    <figure className="m-0" aria-label="Sur votre profil LinkedIn, copiez l'adresse affichée dans la barre du navigateur">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/60 p-3" aria-hidden="true">
        {/* Fenêtre de navigateur */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <span className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-border" />
              <span className="h-2 w-2 rounded-full bg-border" />
              <span className="h-2 w-2 rounded-full bg-border" />
            </span>
            <span className="relative flex h-6 flex-1 items-center rounded-full bg-muted px-3 font-mono text-[11px] text-foreground">
              <span
                className="li-howto-select rounded-sm bg-no-repeat px-0.5"
                style={{ backgroundImage: "linear-gradient(#B3D4FF, #B3D4FF)", backgroundSize: "0% 100%" }}
              >
                linkedin.com/in/<span className="font-semibold">votre-profil</span>
              </span>
              <span className="li-howto-copied absolute -top-0.5 right-1.5 rounded-full bg-foreground px-2 py-0.5 font-sans text-[10px] font-semibold text-background opacity-0">
                Copié
              </span>
            </span>
          </div>
          {/* Profil LinkedIn schématique */}
          <div className="h-8 bg-[#DCE6F1]" />
          <div className="px-4 pb-4">
            <div className="-mt-5 h-10 w-10 rounded-full border-2 border-card bg-[#B7C7DA]" />
            <div className="mt-2 h-2.5 w-28 rounded-full bg-foreground/80" />
            <div className="mt-1.5 h-2 w-40 rounded-full bg-border" />
            <div className="mt-1 h-2 w-24 rounded-full bg-border" />
          </div>
        </div>
        {/* Curseur */}
        <svg className="li-howto-cursor absolute left-3 top-3 h-5 w-5 drop-shadow" viewBox="0 0 24 24" style={{ opacity: 0 }}>
          <path d="M5 3l14 8.5-6.2 1.3 3.7 6.9-2.6 1.4-3.7-6.9L5 19z" fill="#141312" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      </div>
      <figcaption className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Sur ordinateur : ouvrez votre profil LinkedIn et copiez l'adresse du navigateur. Sur l'application : votre profil, bouton
        « … », puis « Partager le profil » pour copier le lien.
      </figcaption>
    </figure>
  );
}

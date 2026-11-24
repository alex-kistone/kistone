import { lazy, Suspense, type ComponentType } from "react";

type Props = { markdown: string };

/**
 * Corps d'article : le moteur Markdown (≈ 400 Ko de code) ne se télécharge qu'à l'ouverture d'un
 * article, pas sur l'accueil ni les autres pages. Au pré-rendu (entry-server.tsx), la version
 * complète est fournie d'avance pour que le HTML lu par Google et les IA contienne tout le texte.
 */
let Eager: ComponentType<Props> | null = null;
export const provideArticleBody = (component: ComponentType<Props>) => {
  Eager = component;
};

const Lazy = lazy(() => import("./ArticleBody"));

export default function LazyArticleBody(props: Props) {
  if (Eager) return <Eager {...props} />;
  return (
    <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
      <Lazy {...props} />
    </Suspense>
  );
}

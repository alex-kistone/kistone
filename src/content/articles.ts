import type { BlogPost } from "@/lib/blog";
import { COMPARISON, PLAYERS } from "@/content/comparison";

/**
 * Ressources éditées dans le code (en plus des articles de la base) : elles apparaissent
 * dans la liste /ressources, sur l'accueil et dans « À lire aussi ».
 */
const base = (p: Partial<BlogPost> & Pick<BlogPost, "id" | "slug" | "title" | "excerpt" | "content" | "published_at">): BlogPost => ({
  seo_title: "",
  seo_description: "",
  tags: [],
  faq: [],
  vertical: null,
  cover_url: null,
  cover_alt: "",
  brief: {},
  status: "published",
  created_at: p.published_at!,
  updated_at: p.published_at!,
  ...p,
});

const FRACTIONAL_STUDY = `Il y a dix ans, un directeur financier indépendant était souvent perçu comme un cadre « entre deux postes ». En 2026, de plus en plus de dirigeants choisissent délibérément de travailler pour deux ou trois entreprises à la fois. Entre les deux, le marché du travail des cadres dirigeants a profondément changé.

Nous avons compilé dix ans de données (Urssaf, PEPS, France Transition, Malt, Revelio Labs…) pour comprendre ce qui se joue. Voici ce que nous en retenons.

## 1. Le freelancing est devenu un choix, pas une solution d'attente

Le nombre de freelances en prestations intellectuelles est passé d'environ **830 000 en 2016 à plus de 1,3 million en 2025**. Sur la même période, le portage salarial, porte d'entrée naturelle des cadres seniors vers l'indépendance, a plus que doublé : d'environ 17 000 salariés portés en 2015 à plus de 43 000 en 2022, dont plus de 80 % de cadres.

Surtout, la motivation a changé. Près de 9 freelances sur 10 déclarent avoir choisi ce statut. Chez les seniors, plus de 6 sur 10 l'ont choisi délibérément. Le freelancing de haut niveau n'est plus un accident de carrière : c'est une manière d'exercer.

## 2. Depuis 2023, le marché se polarise

Le volume n'a pas baissé, mais la dynamique s'est retournée. Depuis début 2023, les missions IT se raréfient et les TJM sont sous pression. Les grands intermédiaires le confirment : la croissance organique est quasi nulle, et certains reculent en France en 2025.

L'IA accentue le mouvement. Les missions courtes et standardisables reculent, tandis que le conseil et la stratégie maintiennent des tarifs nettement plus élevés.

**Ce qui résiste, c'est la responsabilité.** Les profils qui prennent en charge un résultat, une équipe, une fonction, s'en sortent mieux que ceux qui vendent des jours d'exécution.

## 3. Le management de transition a environ triplé en dix ans

Le management de transition est le marché historique des dirigeants indépendants. Il pesait de l'ordre de 250 M€ à la fin des années 2010 ; il dépasse **800 M€ en 2023**, avec une croissance de 16 % par an depuis 2019. Le TJM moyen atteint désormais **environ 1 330 € HT**.

Sa nature a aussi changé :

- la gestion de crise ne représente plus qu'environ **9 % des missions** ;
- le management relais (remplacer un dirigeant en attendant un recrutement) reste majoritaire mais recule ;
- les missions de **transformation** progressent et pèsent près d'un quart du marché.

Mais 2026 marque un durcissement : **62 % des managers de transition estiment que l'accès aux missions s'est dégradé** sur les douze derniers mois. Les talents sont là ; c'est la rencontre avec le bon besoin, au bon moment, qui devient rare.

## 4. Le « Fractional » s'impose comme une catégorie à part entière

Le temps partagé existe en France depuis les années 1980. Ce qui est nouveau, c'est son échelle et son public.

- **Côté entreprises**, la correction des marchés de capitaux de 2022-2024 a changé l'équation des startups et scaleups : impossible de financer un comité de direction complet à temps plein avant la Série B, mais impossible aussi de s'en passer.
- **Côté dirigeants**, une nouvelle génération construit volontairement un portefeuille de deux ou trois entreprises, sans intention de revenir au salariat. L'âge moyen des cadres en temps partagé est passé de 54 à 45 ans en une décennie.
- **Côté marché**, les données internationales sont nettes : la part des offres de postes de direction proposées en format fractional est passée de **9 à 24 pour 1 000 en cinq ans**. Le **CFO** est la fonction la plus demandée (20 % des offres), devant le marketing et les opérations.

En France, aucune statistique officielle ne mesure encore ce phénomène : il se disperse entre portage, micro-entreprise, SASU et missions de transition. La catégorie est réelle, mais pas encore nommée.

## 5. Ce que cela change pour les entreprises

Pour un dirigeant de startup, de scaleup ou d'ETI, ces tendances se traduisent par trois questions très concrètes :

1. **De quel niveau de leadership ai-je besoin, et pendant combien de temps ?** Une fonction Finance qui doit structurer un reporting avant une levée n'a pas besoin d'un CFO à temps plein ; elle a besoin d'un CFO, deux jours par semaine.
2. **Mission, fractional ou recrutement ?** Les formats convergent : management relais, temps partagé, intérim de direction et contract-to-hire répondent à des besoins proches. Le bon choix dépend du contexte, pas du statut juridique.
3. **Comment accéder vite au bon profil ?** Dans un marché où l'offre de talents est abondante mais hétérogène, la valeur se déplace vers la qualification : comprendre le besoin, évaluer le track record, et proposer le bon profil rapidement.

## Notre conviction chez Kistone

Les dix dernières années ont installé le freelancing ; les prochaines installeront le **fractional leadership** comme un mode normal de construction des équipes de direction.

C'est la raison d'être de **Kistone**, la plateforme freelance des Fractional leaders Tech & Digital : des dirigeants RH, Finance, Sales & Marketing, Tech, Data & IA et Product pour les startups, scaleups et ETI. Chaque besoin est qualifié par un référent métier, chaque profil est évalué sur son parcours réel, et nous nous engageons à proposer **un profil en 48h**, en format fractional, mission, intérim ou contract-to-hire.

Vous réfléchissez à renforcer votre comité de direction sans recruter à temps plein ? **[Échangeons 30 minutes](https://calendly.com/alexandre-kistone/30mins-call).**

---

*Sources : Urssaf ; PEPS / INSEE (rapport de branche du portage salarial) ; OFCE ; Malt / Ouishare (2017) ; Malt x BCG ; Malt Trends Seniors ; Datastorm / ENSAI pour Freelance.com ; résultats Freelance.com 2024-2025 ; baromètres France Transition et FNMT ; Option Finance ; Robert Walters ; baromètre Morgan Philips 2026 ; Revelio Labs (Financial Times, septembre 2026) ; FNATPP. Certaines données sur le fractional proviennent de marchés anglo-saxons et sont présentées comme indicatives pour la France.*
`;

/** Texte du comparatif à plat : sert au temps de lecture affiché sur la carte. */
function comparisonText(): string {
  const flat = (v: unknown): string[] =>
    typeof v === "string" ? [v] : Array.isArray(v) ? v.flatMap(flat) : v && typeof v === "object" ? Object.values(v).flatMap(flat) : [];
  return [...flat(COMPARISON), ...flat(PLAYERS)].join(" ");
}

export const STATIC_POSTS: BlogPost[] = [
  base({
    id: "static-fractional-leaders-10-ans",
    slug: "fractional-leaders-10-ans-freelancing-france",
    title: "Fractional leaders : ce que 10 ans de freelancing en France disent de l'avenir des comités de direction",
    excerpt: "Freelancing, management de transition, temps partagé : 10 ans de données montrent l'émergence d'une nouvelle catégorie de dirigeants. Analyse et enseignements pour les startups, scaleups et ETI.",
    seo_title: "Fractional leaders : 10 ans de freelancing en France (étude 2026)",
    seo_description: "Freelancing, management de transition, temps partagé : 10 ans de données montrent l'émergence d'une nouvelle catégorie de dirigeants. Analyse et enseignements pour les startups, scaleups et ETI.",
    tags: ["Étude", "Fractional", "Freelancing", "C-Level", "Temps partagé"],
    content: FRACTIONAL_STUDY,
    published_at: "2026-10-12T12:00:00.000Z",
  }),
  // Le comparatif a sa propre page (/ressources/comparatif-plateformes-freelance-ia) ; cette entrée l'affiche dans la liste.
  base({
    id: "static-comparatif-acteurs",
    slug: COMPARISON.slug,
    title: COMPARISON.title,
    excerpt: COMPARISON.lead,
    tags: ["Comparatif"],
    content: comparisonText(),
    published_at: `${COMPARISON.date}T11:00:00.000Z`,
  }),
];

/** Fusionne les articles de la base et ceux du code, du plus récent au plus ancien. */
export function withStaticPosts(posts: BlogPost[]): BlogPost[] {
  const slugs = new Set(posts.map((p) => p.slug));
  return [...posts, ...STATIC_POSTS.filter((p) => !slugs.has(p.slug))].sort(
    (a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""),
  );
}

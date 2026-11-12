import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/KistoneHeader";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";

/**
 * Conditions générales d'utilisation (version 2026-11-12, TERMS_VERSION dans src/lib/terms.ts).
 * Brouillon à faire relire par un avocat ; les crochets sont à compléter. Changer le texte
 * de fond impose de changer TERMS_VERSION, ce qui redemande l'acceptation à tous.
 */
export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Conditions générales d'utilisation"
        description="Conditions d'utilisation de Kistone : réseau gratuit qui met en relation les entreprises et les recruteurs freelance, profils, visios et données."
        path="/cgu"
      />
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <Button asChild variant="ghost" size="sm" className="mb-6 gap-2 text-muted-foreground">
          <Link to="/"><ArrowLeft className="h-4 w-4" />Retour</Link>
        </Button>

        <h1 className="mb-2 text-3xl font-bold text-foreground">Conditions générales d'utilisation</h1>
        <p className="mb-8 text-sm text-muted-foreground">Version du 12 novembre 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground/90">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Objet</h2>
            <p>
              Kistone SAS, [Adresse du siège], immatriculée sous le numéro [SIREN] (ci-après « Kistone »), édite le site kistone.fr et ses
              espaces connectés (ci-après « le Service »). Le Service met en relation des entreprises qui recrutent (ci-après « les Clients »)
              et des recruteurs indépendants (ci-après « les Freelances »).
            </p>
            <p>
              Les présentes conditions générales d'utilisation (ci-après « les CGU ») fixent les règles d'utilisation du Service. Elles
              s'appliquent à tout utilisateur qui crée un compte. La création d'un compte suppose leur acceptation expresse, en cochant la case
              prévue à cet effet.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Gratuité</h2>
            <p>
              Le Service est aujourd'hui gratuit pour les Clients et pour les Freelances. Kistone pourra proposer à l'avenir des offres
              payantes. Elles seront présentées à l'avance et ne s'appliqueront qu'aux utilisateurs qui les auront souscrites.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Compte</h2>
            <p>
              L'utilisateur fournit des informations exactes et à jour, et garde ses identifiants confidentiels. Le compte est personnel. Kistone
              peut suspendre ou supprimer un compte qui ne respecte pas les CGU, après en avoir informé son titulaire, sauf en cas d'urgence
              ou d'usage frauduleux.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Profil du Freelance et visibilité</h2>
            <p>
              En acceptant les CGU, le Freelance accepte que son profil soit consultable par les Clients connectés au Service, sous réserve
              qu'il soit complet et que le Freelance soit disponible ou le devienne dans les 90 jours. Sont alors visibles : le prénom, la
              photo, l'intitulé de poste, les années d'expérience, les spécialités, les secteurs, les clients et missions déclarés, les
              langues, le TJM, la disponibilité, le rythme de travail, la localisation et la préférence de télétravail.
            </p>
            <p>
              Ne sont jamais affichés aux Clients : le nom de famille, l'adresse email, le numéro de téléphone, les informations de la
              société du Freelance et ses documents administratifs.
            </p>
            <p>
              Le Freelance garantit l'exactitude de son profil. Il s'assure de pouvoir citer les clients et missions qu'il y mentionne, sans
              enfreindre d'obligation de confidentialité. Il peut modifier son profil à tout moment, indiquer qu'il n'est pas disponible (son
              profil n'est alors plus visible au-delà de 90 jours) ou supprimer son compte.
            </p>
            <p>
              Le Freelance peut en outre activer une page publique (kistone.fr/profil/…), accessible sans compte, qu'il peut partager
              notamment sur LinkedIn. Il peut la désactiver à tout moment depuis son espace.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Utilisation des profils par le Client</h2>
            <p>
              Le Client consulte les profils pour ses propres besoins de recrutement. Il s'interdit de les copier, de les extraire de façon
              automatisée ou en masse, de les revendre, de les transmettre à des tiers ou de contacter les Freelances à d'autres fins que
              ses recrutements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Demandes de visio</h2>
            <p>
              Le Client peut proposer une visio à un Freelance en indiquant plusieurs créneaux. Le Freelance est libre d'accepter un créneau ou
              de refuser la demande. Lorsqu'il accepte, le Service crée un lien de visio et l'envoie aux deux parties ; le prénom, le nom et
              l'adresse email de chacun sont alors communiqués à l'autre pour l'invitation.
            </p>
            <p>
              Kistone ne participe pas à la visio et n'en enregistre pas le contenu. Kistone conserve l'historique des demandes (dates,
              créneaux, statut) pour le suivi du Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Missions</h2>
            <p>
              Le Service facilite la rencontre entre Clients et Freelances. Une mission, quand elle est confiée, fait l'objet d'un contrat
              distinct qui en fixe les conditions (durée, prix, comptes rendus d'activité, facturation). Kistone n'est pas partie à ce contrat,
              sauf stipulation contraire de celui-ci.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">8. Responsabilité</h2>
            <p>
              Kistone fournit le Service avec diligence mais ne garantit ni son fonctionnement sans interruption, ni la conclusion d'une
              mission. Kistone ne vérifie pas l'intégralité des informations publiées par les utilisateurs, qui en restent responsables.
              Kistone n'est pas responsable des échanges entre Clients et Freelances, ni des décisions prises à leur issue.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">9. Données personnelles</h2>
            <p>
              Le traitement des données personnelles est décrit dans la{" "}
              <Link to="/privacy" className="underline">politique de confidentialité</Link>. Chaque utilisateur peut exercer ses droits
              d'accès, de rectification, d'effacement et d'opposition à l'adresse [Email de contact RGPD].
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">10. Modification des CGU</h2>
            <p>
              Kistone peut modifier les CGU. La nouvelle version est présentée à l'utilisateur à sa connexion suivante et doit être acceptée
              pour continuer à utiliser son espace. L'utilisateur qui la refuse peut supprimer son compte.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">11. Droit applicable</h2>
            <p>
              Les CGU sont soumises au droit français. À défaut d'accord amiable, tout litige relève des tribunaux compétents de [Ville du
              siège].
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

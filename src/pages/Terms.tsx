import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import TrLayout from "@/components/transition/TrLayout";

/**
 * Conditions générales d'utilisation (version 2026-11-17, TERMS_VERSION dans src/lib/terms.ts).
 * Brouillon à faire relire par un avocat ; les crochets sont à compléter. Changer le texte
 * de fond impose de changer TERMS_VERSION, ce qui redemande l'acceptation à tous.
 */
export default function Terms() {
  return (
    <TrLayout>
      <SEO
        title="Conditions générales d'utilisation"
        description="Conditions d'utilisation de Kistone, cabinet de management de transition : comptes, profils des managers, missions et données."
        path="/cgu"
      />
      <div className="wrap job-body" style={{ gridTemplateColumns: "minmax(0, 760px)" }}>
        <div className="doc">
          <section>
            <span className="kicker">Version du 17 novembre 2026</span>
            <h1 style={{ marginTop: 18 }}>Conditions générales d'utilisation</h1>
          </section>

          <section>
            <span className="s-num">01</span><h2>Objet</h2>
            <p>
              Kistone SAS, [Adresse du siège], immatriculée sous le numéro [SIREN] (ci-après « Kistone »), édite le site kistone.fr et ses
              espaces connectés (ci-après « le Service »). Kistone est un cabinet de management de transition : il met à la disposition
              d'entreprises (ci-après « les Clients ») des managers de transition indépendants (ci-après « les Managers »).
            </p>
            <p>
              Les présentes conditions générales d'utilisation (ci-après « les CGU ») fixent les règles d'utilisation du Service. Elles
              s'appliquent à tout utilisateur qui crée un compte. La création d'un compte suppose leur acceptation expresse, en cochant la
              case prévue à cet effet.
            </p>
          </section>

          <section>
            <span className="s-num">02</span><h2>Gratuité</h2>
            <p>
              La création d'un compte et l'utilisation du Service sont gratuites pour les Managers. Kistone pourra proposer à l'avenir des
              offres payantes : elles seront présentées à l'avance et ne s'appliqueront qu'aux utilisateurs qui les auront souscrites.
            </p>
          </section>

          <section>
            <span className="s-num">03</span><h2>Compte</h2>
            <p>
              L'utilisateur fournit des informations exactes et à jour, et garde ses identifiants confidentiels. Le compte est personnel.
              Kistone peut suspendre ou supprimer un compte qui ne respecte pas les CGU, après en avoir informé son titulaire, sauf en cas
              d'urgence ou d'usage frauduleux.
            </p>
          </section>

          <section>
            <span className="s-num">04</span><h2>Profil du Manager</h2>
            <p>
              Le Manager renseigne son profil : métier, TJM, disponibilité, niveau d'anglais et présentation de son parcours. Il peut faire
              réécrire sa présentation par un outil d'intelligence artificielle ; il en relit le résultat et reste responsable du texte
              enregistré.
            </p>
            <p>
              Le profil est consulté par les associés du cabinet. Kistone peut le présenter à un Client dans le cadre d'une short-list :
              prénom, métier, présentation, TJM, disponibilité et niveau d'anglais. Le nom, l'adresse email, le numéro de téléphone, les
              informations de la société du Manager et ses documents administratifs ne sont transmis au Client qu'avec l'accord du Manager.
            </p>
            <p>
              Le Manager garantit l'exactitude de son profil. Il s'assure de pouvoir citer les entreprises et missions qu'il mentionne, sans
              enfreindre d'obligation de confidentialité. Il peut modifier son profil à tout moment ou supprimer son compte.
            </p>
          </section>

          <section>
            <span className="s-num">05</span><h2>Utilisation des profils par le Client</h2>
            <p>
              Le Client utilise les profils qui lui sont présentés pour ses propres besoins. Il s'interdit de les copier, de les revendre, de
              les transmettre à des tiers ou de contacter les Managers à d'autres fins que la mission envisagée.
            </p>
          </section>

          <section>
            <span className="s-num">06</span><h2>Missions</h2>
            <p>
              Une mission, quand elle est confiée, fait l'objet d'un contrat distinct (contrat tripartite et lettre de mission) qui en fixe
              les conditions : durée, objectifs, prix, comptes rendus d'activité et facturation.
            </p>
          </section>

          <section>
            <span className="s-num">07</span><h2>Responsabilité</h2>
            <p>
              Kistone fournit le Service avec diligence mais ne garantit ni son fonctionnement sans interruption, ni la conclusion d'une
              mission. Les utilisateurs restent responsables des informations qu'ils publient.
            </p>
          </section>

          <section>
            <span className="s-num">08</span><h2>Données personnelles</h2>
            <p>
              Le traitement des données personnelles est décrit dans la <Link to="/privacy" style={{ textDecoration: "underline" }}>politique
              de confidentialité</Link>. Chaque utilisateur peut exercer ses droits d'accès, de rectification, d'effacement et d'opposition à
              l'adresse [Email de contact RGPD].
            </p>
          </section>

          <section>
            <span className="s-num">09</span><h2>Modification des CGU</h2>
            <p>
              Kistone peut modifier les CGU. La nouvelle version est présentée à l'utilisateur à sa connexion suivante et doit être acceptée
              pour continuer à utiliser son espace. L'utilisateur qui la refuse peut supprimer son compte.
            </p>
          </section>

          <section>
            <span className="s-num">10</span><h2>Droit applicable</h2>
            <p>
              Les CGU sont soumises au droit français. À défaut d'accord amiable, tout litige relève des tribunaux compétents de [Ville du
              siège].
            </p>
          </section>
        </div>
      </div>
    </TrLayout>
  );
}

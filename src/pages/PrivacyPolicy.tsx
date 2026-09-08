import Header from "@/components/KistoneHeader";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Politique de confidentialité — Kistone"
        description="Comment Kistone collecte, utilise et protège vos données personnelles : cookies, finalités, droits d'accès et de rectification."
        path="/privacy"
      />
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <Button asChild variant="ghost" size="sm" className="mb-6 gap-2 text-muted-foreground">
          <Link to="/"><ArrowLeft className="h-4 w-4" />Retour</Link>
        </Button>

        <h1 className="mb-2 text-3xl font-bold text-foreground">Politique de Confidentialité</h1>
        <p className="mb-8 text-sm text-muted-foreground">Dernière mise à jour : 17 mars 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground/90">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Responsable du traitement</h2>
            <p>Connect2 SAS est responsable du traitement des données personnelles collectées via la plateforme Connect2 (ci-après « la Plateforme »).</p>
            <p>Pour toute question relative à la protection de vos données, vous pouvez nous contacter à l'adresse : <a href="mailto:contact@connect2.fr" className="text-primary hover:underline">contact@connect2.fr</a></p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Données collectées</h2>
            <p>Nous collectons les catégories de données suivantes :</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Données d'identification</strong> : nom, prénom, adresse email, numéro de téléphone</li>
              <li><strong>Données professionnelles</strong> : intitulé de poste, compétences, secteurs d'activité, expériences, TJM, disponibilité</li>
              <li><strong>Données d'entreprise</strong> : nom de l'entreprise, SIREN, forme juridique, adresse du siège</li>
              <li><strong>Données de connexion</strong> : adresse IP, logs de connexion, cookies techniques</li>
              <li><strong>Documents</strong> : attestations URSSAF, RIB, assurance RC Pro (pour les freelances)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Finalités du traitement</h2>
            <p>Vos données sont traitées pour les finalités suivantes :</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Gestion de votre compte utilisateur et authentification</li>
              <li>Mise en relation entre clients et freelances (matching)</li>
              <li>Gestion des missions et des comptes rendus d'activité (CRA)</li>
              <li>Génération de contrats</li>
              <li>Communication relative aux services de la Plateforme</li>
              <li>Amélioration de nos services et statistiques anonymisées</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Base légale</h2>
            <p>Le traitement de vos données repose sur :</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>L'exécution du contrat</strong> : nécessaire à la fourniture de nos services</li>
              <li><strong>Le consentement</strong> : pour les cookies non essentiels et les communications marketing</li>
              <li><strong>L'intérêt légitime</strong> : amélioration de nos services, prévention de la fraude</li>
              <li><strong>L'obligation légale</strong> : conservation des données de facturation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Destinataires des données</h2>
            <p>Vos données peuvent être communiquées à :</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Nos équipes internes (recrutement, administration)</li>
              <li>Les clients de la Plateforme (dans le cadre du matching, sous forme anonymisée puis nominative après accord)</li>
              <li>Nos sous-traitants techniques (hébergement, envoi d'emails)</li>
            </ul>
            <p>Nous ne vendons jamais vos données à des tiers.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Durée de conservation</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Données de compte</strong> : conservées pendant la durée de votre inscription, puis 3 ans après votre dernière activité</li>
              <li><strong>Données contractuelles</strong> : 5 ans après la fin du contrat (obligations légales)</li>
              <li><strong>Logs de connexion</strong> : 12 mois</li>
              <li><strong>Cookies</strong> : 13 mois maximum</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Vos droits</h2>
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Droit d'accès</strong> : obtenir une copie de vos données personnelles</li>
              <li><strong>Droit de rectification</strong> : corriger des données inexactes</li>
              <li><strong>Droit à l'effacement</strong> : demander la suppression de vos données (bouton « Supprimer mon compte » disponible dans votre profil)</li>
              <li><strong>Droit à la portabilité</strong> : exporter vos données dans un format structuré (bouton « Exporter mes données » disponible dans votre profil)</li>
              <li><strong>Droit d'opposition</strong> : vous opposer au traitement de vos données</li>
              <li><strong>Droit de limitation</strong> : demander la limitation du traitement</li>
            </ul>
            <p>Pour exercer ces droits, contactez-nous à <a href="mailto:contact@connect2.fr" className="text-primary hover:underline">contact@connect2.fr</a>.</p>
            <p>Vous pouvez également introduire une réclamation auprès de la <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">CNIL</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">8. Cookies</h2>
            <p>La Plateforme utilise des cookies pour :</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Cookies essentiels</strong> : authentification, sécurité, préférences de session</li>
              <li><strong>Cookies analytiques</strong> : mesure d'audience anonymisée (soumis à votre consentement)</li>
            </ul>
            <p>Vous pouvez gérer vos préférences de cookies à tout moment via le bandeau de consentement.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">9. Sécurité</h2>
            <p>Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données : chiffrement des données en transit (TLS), isolation des données par politique de sécurité au niveau des lignes (RLS), authentification sécurisée via JWT.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">10. Hébergement</h2>
            <p>Vos données sont hébergées au sein de l'Union Européenne, conformément aux exigences du RGPD.</p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;

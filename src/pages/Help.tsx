import { Lightbulb, ListChecks, Users } from "lucide-react";
import React from "react";
import ReactMarkdown from "react-markdown";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Separator } from "../components/ui/separator";

const helpContent = `
Bienvenue dans la section d'aide de l'administration de BudgetApp. Cette page vous fournit un aperçu des outils disponibles pour gérer les données essentielles de votre application.
`;

const referentielsContent = `
La section **Référentiels** centralise la gestion des listes de données utilisées pour organiser vos informations financières.

### Familles

Les familles sont des catégories de haut niveau pour regrouper vos enseignes. Chaque enseigne doit être associée à une famille.

*   **Actions** : Création, modification et suppression de familles.
*   **Champs** :
    *   **Nom** : Nom unique de la famille (ex: "Services de Streaming", "Transports", "Alimentation").
    *   **Couleur** : Une couleur visuelle pour identifier la famille dans les graphiques.
*   **Note importante** : Une famille ne peut pas être supprimée si des enseignes y sont encore rattachées. Vous devrez d'abord réaffecter ou supprimer ces enseignes.

### Enseignes

Les enseignes représentent les commerces ou services auprès desquels vous effectuez des transactions (ex: "Netflix", "EDF", "Carrefour"). Elles sont toujours liées à une famille.

*   **Actions** : Création, modification et suppression d'enseignes.
*   **Champs** :
    *   **Nom** : Nom de l'enseigne.
    *   **Famille** : Sélection de la famille associée (choix parmi vos familles définies).
    *   **Domaine de l'organisme (optionnel)** : Domaine web (ex: "netflix.com"). Utilisé pour la récupération automatique du logo.

### Types de Compte

Gérez les différentes natures de comptes financiers que vos utilisateurs peuvent enregistrer (ex: "Compte Courant", "Livret A", "Carte de Crédit").

*   **Actions** : Création, modification et suppression de types de compte.
*   **Champs** :
    *   **Nom** : Nom du type de compte.

### Catégories de Charges

Définissez des catégories spécifiques pour classer vos charges récurrentes (ex: "Loyer", "Électricité", "Abonnements").

*   **Actions** : Création, modification et suppression de catégories de charges.
*   **Champs** :
    *   **Nom** : Nom de la catégorie.
    *   **Couleur** : Une couleur visuelle pour la catégorie.
`;

const usersContent = `
La section **Gestion des Utilisateurs** vous offre une vue d'ensemble et des outils pour administrer les comptes utilisateurs de l'application.

*   **Liste des utilisateurs** : Visualisez tous les utilisateurs inscrits.
*   **Modification des rôles** : Attribuez ou retirez des rôles (par exemple, rendre un utilisateur administrateur).
*   **Suppression d'utilisateurs** : Supprimez définitivement un compte utilisateur.
*   **Tableau de bord Admin** : Accédez à des statistiques clés sur l'utilisation de l'application, comme le nombre total d'utilisateurs et les tendances d'inscription.
`;

const Help: React.FC = () => {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center">
            <Lightbulb className="inline-block mr-2" /> Aide - Administration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ReactMarkdown
            components={{
              h1: ({ ...props }) => (
                <h1 className="text-4xl font-extrabold mb-4" {...props} />
              ),
              h2: ({ ...props }) => (
                <h2 className="text-3xl font-bold mt-6 mb-3" {...props} />
              ),
              h3: ({ ...props }) => (
                <h3 className="text-2xl font-semibold mt-4 mb-2" {...props} />
              ),
              ul: ({ ...props }) => (
                <ul className="list-disc pl-5 mb-4" {...props} />
              ),
              li: ({ ...props }) => <li className="mb-1" {...props} />,
              strong: ({ ...props }) => (
                <strong className="font-bold" {...props} />
              ),
              p: ({ ...props }) => <p className="mb-2" {...props} />,
            }}
          >
            {helpContent}
          </ReactMarkdown>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center">
            <ListChecks className="inline-block mr-2" /> Gestion des
            Référentiels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ReactMarkdown
            components={{
              h2: ({ ...props }) => (
                <h2 className="text-3xl font-bold mt-6 mb-3" {...props} />
              ),
              h3: ({ ...props }) => (
                <h3 className="text-2xl font-semibold mt-4 mb-2" {...props} />
              ),
              ul: ({ ...props }) => (
                <ul className="list-disc pl-5 mb-4" {...props} />
              ),
              li: ({ ...props }) => <li className="mb-1" {...props} />,
              strong: ({ ...props }) => (
                <strong className="font-bold" {...props} />
              ),
              p: ({ ...props }) => <p className="mb-2" {...props} />,
            }}
          >
            {referentielsContent}
          </ReactMarkdown>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center">
            <Users className="inline-block mr-2" /> Gestion des Utilisateurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ReactMarkdown
            components={{
              h2: ({ ...props }) => (
                <h2 className="text-3xl font-bold mt-6 mb-3" {...props} />
              ),
              ul: ({ ...props }) => (
                <ul className="list-disc pl-5 mb-4" {...props} />
              ),
              li: ({ ...props }) => <li className="mb-1" {...props} />,
              strong: ({ ...props }) => (
                <strong className="font-bold" {...props} />
              ),
              p: ({ ...props }) => <p className="mb-2" {...props} />,
            }}
          >
            {usersContent}
          </ReactMarkdown>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      <p className="text-center text-muted-foreground">
        N'hésitez pas à explorer ces sections pour maintenir vos données de
        référence à jour et assurer le bon fonctionnement de BudgetApp.
      </p>
    </div>
  );
};

export default Help;

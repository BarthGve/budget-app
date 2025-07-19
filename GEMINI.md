## Contexte du Projet : Budget App

Cette application est une application de gestion de budget personnel développée avec React, TypeScript et Vite.

### Technologies Clés

-   **Framework Frontend** : React avec Vite
-   **Langage** : TypeScript (strict)
-   **Style** : Tailwind CSS
-   **Composants UI** : shadcn/ui
-   **Backend & Base de données** : Supabase
-   **Icônes de logos** : Logokit

### Conventions de Développement

-   **Langue** : Le code (variables, fonctions, commentaires) doit être en français.
-   **Qualité du code** :
    -   Utiliser des types et interfaces TypeScript stricts. Éviter `any`.
    -   Respecter les conventions ESLint et Prettier configurées.
-   **Composants** :
    -   L'utilisation des composants de `shadcn/ui` est obligatoire.
    -   Les alertes, en particulier, doivent utiliser le composant `Alert` de shadcn/ui.
-   **Responsive Design** :
    -   Utiliser une approche "mobile-first" avec les classes responsives de Tailwind CSS.
-   **Performance** :
    -   Utiliser `React.lazy()` pour le code-splitting des routes ou des composants lourds.
    -   Optimiser les images.

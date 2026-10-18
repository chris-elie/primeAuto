# primeAuto

**Application complète de gestion de véhicules** : entretiens, revenus et recettes, avec un suivi au quotidien des entrées et des sorties.

**Démo en ligne : [prime-auto-psi.vercel.app](https://prime-auto-psi.vercel.app)**

**Compte de démonstration :** `test@primeauto.com` / `Demo2026!`

---

## À quoi sert le projet

primeAuto est un outil pour gérer une flotte de véhicules au même endroit. Il permet de voir et de contrôler, jour après jour, tout ce qui se passe : l'état des véhicules, les entretiens, et l'argent qui entre et qui sort.

## Ce que l'application permet de faire

- **Gérer les véhicules** : suivre chaque véhicule, son kilométrage, son statut (en bon état, en entretien, en panne) et sa dernière révision.
- **Suivre les entretiens** : planifier les entretiens à venir, noter ceux qui sont faits et leur coût.
- **Suivre les revenus et les recettes** : enregistrer chaque recette et la rattacher à un véhicule.
- **Contrôler les entrées et les sorties** : avoir une vue claire, au quotidien, de ce qui rentre (recettes) et de ce qui sort (coûts d'entretien).
- **Consulter un tableau de bord** : véhicules actifs, entretiens à venir, alertes et recette de la semaine, avec un graphique hebdomadaire.
- **Gérer les accès** : deux rôles, gestionnaire et employé, avec connexion sécurisée.
- **Exporter des rapports** en Excel et PowerPoint.

L'interface est entièrement en français.

## Technologies utilisées

- **Front-end** : React, TypeScript, Vite, Tailwind CSS
- **Base de données et authentification** : Supabase (PostgreSQL, Auth)
- **Déploiement** : Vercel
- **Versionnement** : Git / GitHub

## Lancer le projet en local

Il faut Node.js (version 18 ou plus) et un projet Supabase.

```bash
git clone https://github.com/Chris-Elie/primeAuto.git
cd primeAuto/Client
npm install
npm run dev
```

Crée ensuite un fichier `.env` dans le dossier `Client` avec les informations de ton projet Supabase :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon
```

L'application s'ouvre sur `http://localhost:5173`.

## Historique du projet

La première version utilisait une base MySQL locale et une API Express. Le projet a ensuite été migré vers Supabase pour pouvoir être déployé en ligne, avec une authentification intégrée. Le dossier `serveur` et le dossier `Archives` contiennent cette ancienne version.

## Auteur

**Christ Elie NDA**, développeur junior à Montréal
GitHub : [@Chris-Elie](https://github.com/Chris-Elie)


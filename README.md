# Sites Faciles Mali — Boilerplate & Template

Ce dépôt contient le projet **Sites Faciles Mali**, une solution Jamstack institutionnelle basée sur [Astro](https://astro.build) et le **DSML** (Design System Mali).

## Architecture

Le projet est structuré sous forme de monorepo npm :

- `packages/core` (`@malihub/sites-core`) : Le package réutilisable contenant les layouts Astro, composants UI avec annotations in-line CMS binding, et schémas Zod.
- `template` : Le site vitrine exemple / boilerplate réutilisable pour instancier de nouveaux sites (Consulat, Ministères, Agences public, etc.).

## Lancement en développement

Pour lancer le site modèle/boilerplate en local :

```bash
# Installation des dépendances à la racine
npm install

# Lancement du serveur de développement Astro du template
npm run dev
```

## Structure des pages du Starter Template

- `/` : Accueil avec Hero, accès rapide aux démarches, actualités récentes et FAQ.
- `/services` : Catalogue des démarches administratives (carte consulaire, passeport, actes d'état civil, etc.).
- `/actualites` : Fil d'actualités et communiqués officiels.
- `/faq` : Foire aux questions filtrable par catégories.
- `/contact` : Informations de contact, horaires et accès.
- `/mentions-legales` : Mentions légales et politique de confidentialité modèle.
- `/accessibilite` : Déclaration d'accessibilité (conforme DSML).

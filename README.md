# Sites Faciles Mali — Architecture Hybride Core & Boilerplate

Ce dépôt contient la solution **Sites Faciles Mali**, conçue pour la création rapide et la maintenance unifiée des sites web institutionnels maliens (Consulats, Ministères, Agences publiques, etc.).

Elle repose sur une architecture dual-track :
1. **Un package NPM upstream (`@malihub/sites-core`)** : Contient les layouts Astro conformes au DSML, les composants UI partagés et les schémas Zod. Les mises à jour de ce package permettent de déployer les évolutions d'accessibilité et de style sur tous les sites consommateurs sans casser leur code spécifique.
2. **Un Starter Kit / Boilerplate (`template`)** : Projet de départ autonome et personnalisable via `site.config.json` évitant de démarrer depuis zéro.

---

## Structure du Monorepo

- `packages/core` (`@malihub/sites-core`) : Package réutilisable (layouts, composants UI, schémas de validation).
- `template` : Site exemple / modèle clé en main prêt à être copié pour instancier un nouveau projet.

---

## Guide Développeur : Démarrer un projet

### 1. En développement dans ce monorepo (Interne)

```bash
# Se placer dans le dossier sites
cd sites

# Instancier un nouveau site depuis le template
cp -r template my-new-site

# Ajouter le workspace dans sites/package.json
# "workspaces": ["packages/*", "template", "my-new-site"]

# Personnaliser l'identité institutionnelle dans my-new-site/site.config.json

# Lancer en développement
npm run dev --workspace=my-new-site
```

### 2. Importer les éléments du package Core dans Astro

Grâce aux exports nommés du package `@malihub/sites-core`, vous pouvez importer soit via les sous-paths soit directement depuis la racine du package :

```astro
---
import { BaseLayout, Header, Footer, Hero, ServiceCard } from '@malihub/sites-core';
import siteConfig from '../site.config.json';
---

<BaseLayout title={siteConfig.title}>
  <Header slot="header" title={siteConfig.title} />
  ...
</BaseLayout>
```

---

## Compilation et Vérification

```bash
# Installer toutes les dépendances
npm install

# Lancer le build complet des packages et du template
npm run build
```

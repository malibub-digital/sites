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

---

## Flux d'Édition Inline & Publication Continu (Git Trigger & Dokploy)

Sites Faciles Mali intègre un moteur d'édition inline dynamique et headless. Contrairement aux CMS traditionnels reliés à une base de données SQL, les données (config JSON et fichiers Markdown) sont directement éditées sur le serveur et versionnées sur Git.

```
+------------------+         +--------------------+         +-------------------+         +--------------------+
|  Agent Admin UI  | ------> | API /api/cms/save  | ------> | fs (fichiers disk) | ------> | Git push (origin)  |
|  (Barre admin)   |         | (Astro Node Server)|         | site.config.json  |         | branch: $GIT_...   |
+------------------+         +--------------------+         +-------------------+         +--------------------+
                                                                                                | (Git Push Trigger)
                                                                                                v
                                                                                      +--------------------+
                                                                                      | Dokploy / PaaS     |
                                                                                      | Re-build Container |
                                                                                      +--------------------+
```

### 1. Variables d'Environnement Requises

Pour piloter le comportement de la sauvegarde et du déploiement, configurez les variables d'environnement suivantes dans votre conteneur ou sur le serveur d'hébergement :

| Variable | Type | Valeur par défaut | Description |
| :--- | :--- | :--- | :--- |
| `CMS_ADMIN_SECRET` | `string` | `admin123` | Secret d'administration pour déverrouiller le mode édition et l'API. |
| `CMS_GIT_ENABLED` | `boolean` | `false` | Activer ou désactiver l'exécution des commandes Git lors de la sauvegarde. |
| `CMS_GIT_BRANCH` | `string` | *(Aucune)* | **Obligatoire si `CMS_GIT_ENABLED=true`**. Branche cible pour le `git push` (ex: `prod` ou `main`). |

---

### 2. Fonctionnement des Modes de Sauvegarde

#### A. Mode Développement / Brouillon Local (`CMS_GIT_ENABLED=false` ou non défini)
- Les modifications de texte issues de l'interface d'édition sont envoyées à l'API `/api/cms/save`.
- Le serveur API écrit immédiatement les modifications dans `site.config.json` et les fichiers Markdown frontmatter (`gray-matter`).
- **Aucune commande Git n'est exécutée**. Le fichier reste modifié uniquement sur le système de fichiers local du conteneur/serveur.

#### B. Mode Publication Automatique Git (`CMS_GIT_ENABLED=true`)
- **Vérification de la Branche Cible** : Le serveur API vérifie la présence de `CMS_GIT_BRANCH`. **Si la branche n'est pas configurée, le commit est refusé et l'API retourne une erreur 400**.
- **Execution des Commandes Git** :
  1. Écriture physique des fichiers sur le disque (`site.config.json` et `.md`).
  2. `git add <fichiers_modifiés>`
  3. `git commit -m "cms(publish): mise à jour automatique du contenu via l'éditeur"`
  4. `git push origin <CMS_GIT_BRANCH>`

---

### 3. Déploiement Continu CI/CD (PaaS / Docker / Dokploy / Coolify)

Pour préserver l'indépendance du projet vis-à-vis des solutions d'hébergement (*no vendor lock-in*), aucun webhook propriétaire n'est appelé par l'API. Le ré-assemblage du site est géré de manière universelle via le **Git Push Trigger** offert par la majorité des serveurs d'hébergement (Dokploy, Coolify, GitHub Actions, Vercel, etc.) :

1. **Sur votre plateforme d'hébergement** (ex: Dokploy, Coolify ou VPS Docker) :
   - Dans le tableau de bord de votre application, configurez les variables d'environnement :
     ```env
     CMS_ADMIN_SECRET=votre_secret_securise
     CMS_GIT_ENABLED=true
     CMS_GIT_BRANCH=prod
     ```
   - Réglez la branche à écouter sur `prod` et activez l'option de déclenchement automatique sur push (**Auto Deploy / Git Push Trigger**).
2. **Cycle complet** :
   Lorsqu'un agent enregistre ses modifications depuis le site, le serveur web commite et pousse les changements sur la branche `prod`. La plateforme d'hébergement détecte ce push Git et redéploie le conteneur mis à jour sans intervention humaine.

---

### 4. Authentification Git / GitHub & Assistant Clé SSH

Pour que le serveur web (Node.js/Astro) puisse exécuter `git push origin <CMS_GIT_BRANCH>` depuis le serveur ou le conteneur Docker, Git doit disposer des droits d'écriture sur le dépôt distant.

#### 🛠️ Option A (Recommandée) : Assistant Automatique de Clé SSH Deploy Key
Pour simplifier la configuration par les développeurs et administrateurs de sites, un script d'assistance est fourni dans le dépôt :

```bash
# Lancer le script d'assistance depuis le dossier sites
./scripts/setup-git-key.sh
```

Le script va :
1. Générer automatiquement une paire de clés SSH dédiée (`~/.ssh/id_sites_faciles_deploy`).
2. Afficher la clé publique à copier-coller dans GitHub/GitLab sous **Settings ➔ Deploy Keys ➔ Add deploy key**.
3. Rappeler de **cocher la case "Allow write access"**.
4. Indiquer la ligne de volume à ajouter dans votre Docker Compose / Dokploy (`~/.ssh/id_sites_faciles_deploy:/root/.ssh/id_ed25519:ro`).

#### Option B : Jeton d'Accès Personnel (PAT) via URL Remote HTTPS
1. Sur GitHub : **Settings ➔ Developer Settings ➔ Personal Access Tokens (Fine-grained)**.
2. Créer un jeton avec la permission **Contents: Read & Write** sur le dépôt.
3. Injecter le jeton dans l'URL du dépôt distant dans le conteneur :
   `git remote set-url origin https://<TOKEN>@github.com/organisation/depot.git`




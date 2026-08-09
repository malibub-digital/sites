# Documentation Sites Faciles Mali

Moteur de sites web institutionnels et démarches publiques pour les administrations du Mali, articulé autour du Design System Mali (DSML).

---

## 1. Guide Développeur & Création de Projet

### 1.1 Les 3 méthodes de création et d'installation

Selon votre flux de travail et vos besoins d'intégration, trois approches équivalentes sont à votre disposition :

#### Méthode 1 — Cloner / Copier l'intégralité du dépôt `sites`
Idéal si vous souhaitez contribuer directement au moteur, personnaliser en profondeur les composants de `@malihub/sites-core` ou conserver un monorépo autonome.

1. **Cloner le dépôt** :
   ```bash
   git clone https://github.com/malibub-digital/sites.git mon-site-institutionnel
   cd mon-site-institutionnel
   ```
2. **Installer les dépendances du monorépo** :
   ```bash
   npm install
   ```
3. **Lancer le site de démonstration / starter** :
   ```bash
   npm run dev
   ```

---

#### Méthode 2 — Copier le dossier template d'amorçage (`sites/template`)
Idéal pour créer un projet autonome sans conserver l'historique du monorépo, en bénéficiant de toutes les pages d'exemple, des schémas JSON et des fiches Markdown préconfigurés.

1. **Copier le dossier `template`** dans votre nouveau dossier de projet :
   ```bash
   cp -r sites/template mon-site-institutionnel
   cd mon-site-institutionnel
   ```
2. **Installer les dépendances** :
   ```bash
   npm install
   ```
3. **Personnaliser `site.config.json`** à la racine de votre projet :
   ```json
   {
     "title": "Ministère de la Santé",
     "institution": "RÉPUBLIQUE DU MALI",
     "logoUrl": "/images/logo-sante.svg",
     "contact": {
       "email": "contact@sante.gouv.ml",
       "phone": "+223 20 22 00 00",
       "address": "Bamako, Mali"
     },
     "navigation": {
       "links": [
         { "label": "Accueil", "href": "/" },
         { "label": "Services & Démarches", "href": "/services" },
         { "label": "Actualités", "href": "/actualites" },
         { "label": "Contact", "href": "/contact" }
       ]
     }
   }
   ```
4. **Lancer le serveur de développement** :
   ```bash
   npm run dev
   ```

---

#### Méthode 3 — Installer le package `@malihub/sites-core` dans un projet Astro existant
Idéal si vous avez déjà une application Astro existante et souhaitez y intégrer le moteur CMS et la charte graphique DSML.

1. **Installer le package cœur et le Design System Mali** :
   ```bash
   npm install @malihub/sites-core @malihub/dsml-core
   ```
2. **Créer le fichier `site.config.json`** à la racine de votre projet.
3. **Créer vos pages Astro** (ex: `src/pages/index.astro`) en important les composants cœurs :
   ```astro
   ---
   import { BaseLayout, Header, Footer, Hero, ServiceCard } from '@malihub/sites-core';
   import siteConfig from '../site.config.json';
   ---

   <BaseLayout title={siteConfig.title} description="Portail officiel">
     <Header
       slot="header"
       title={siteConfig.title}
       institution={siteConfig.institution}
       navItems={siteConfig.navigation.links}
     />

     <main id="main-content" class="py-12">
       <Hero
         title="Portail Officiel du Ministère"
         subtitle="Accédez aux démarches administratives en ligne"
       />

       <div class="ml-container mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
         <ServiceCard
           title="Demande de Carte Consulaire"
           summary="Démarche en ligne pour les citoyens résidant à l'étranger."
           category="État Civil"
           cost="5 000 FCFA"
           processingTime="48h"
           href="/services/carte-consulaire"
           cmsSlug="carte-consulaire"
         />
       </div>
     </main>

     <Footer
       slot="footer"
       institution={siteConfig.institution}
       contact={siteConfig.contact}
     />
   </BaseLayout>
   ```

---

### 1.2 Structure des dossiers d'un projet Sites Faciles

Un projet complet s'appuyant sur `@malihub/sites-core` est structuré ainsi :

```
mon-site-institutionnel/
├── public/                     # Favicons, logos, images statiques et uploads CMS
│   └── uploads/                # Images téléversées via l'éditeur visuel
├── src/
│   ├── content/                # Contenus Markdown (Collections Astro)
│   │   ├── actualites/         # Articles d'actualités (*.md avec frontmatter)
│   │   └── services/           # Fiches démarches & services (*.md avec frontmatter)
│   ├── data/
│   │   └── pages/              # Contenus verbeux de page (home.json, faq.json...)
│   └── pages/                  # Pages Astro (/index.astro, /services/index.astro...)
├── site.config.json            # Configuration globale (institution, footer, alerte)
├── astro.config.mjs            # Configuration Astro (adapter Node.js en mode hybrid)
└── package.json
```

---

### 1.3 Composants certifiés DSML exportés par `@malihub/sites-core`

Le package `@malihub/sites-core` fournit l'ensemble des éléments prêts à l'emploi :

| Composant | Import | Description & Props principales |
| :--- | :--- | :--- |
| **`BaseLayout`** | `import { BaseLayout } from '@malihub/sites-core'` | Layout HTML5 universel avec styles DSML, SEO et script CMS embarqué. |
| **`Header`** | `import { Header } from '@malihub/sites-core'` | En-tête institutionnel républicain. Props: `title`, `institution`, `logoUrl`, `navItems`. |
| **`Footer`** | `import { Footer } from '@malihub/sites-core'` | Pied de page institutionnel. Props: `institution`, `contact`, `footerLinks`. |
| **`Hero`** | `import { Hero } from '@malihub/sites-core'` | Bannière d'accueil avec titre, sous-titre, badge et pastilles d'accès rapide. |
| **`ServiceCard`** | `import { ServiceCard } from '@malihub/sites-core'` | Carte de présentation de démarche. Props: `title`, `summary`, `cost`, `processingTime`, `cmsSlug`. |
| **`EmergencyBanner`** | `import { EmergencyBanner } from '@malihub/sites-core'` | Bandeau d'alerte urgente sticky (info, warning, danger). Configuré via `siteConfig.emergencyNotice`. |
| **`AdminToolbar`** | `import { AdminToolbar } from '@malihub/sites-core'` | Barre supérieure d'administration pour basculer en mode édition et publier. |
| **`CollectionAddButton`** | `import { CollectionAddButton } from '@malihub/sites-core'` | Bouton d'ajout d'élément dans une collection mutable en mode édition. |
| **`CollectionItemControls`** | `import { CollectionItemControls } from '@malihub/sites-core'` | Outillage pour déplacer (monter/descendre) ou supprimer un élément d'une collection. |

---

## 3. Moteur CMS & Édition Inline

Le projet inclut un moteur d'édition visuelle en temps réel permettant aux agents autorisés de modifier le contenu des pages directement depuis leur navigateur.

### Architecture de stockage du contenu

Le moteur CMS route chaque sauvegarde vers le bon fichier selon le préfixe `data-cms-bind` :

| Préfixe | Fichier cible | Contenu |
| :--- | :--- | :--- |
| `siteConfig.*` | `site.config.json` | Config globale (institution, nav, footer, alerte) |
| `src/data/pages/<p>.json::champ` | JSON arbitraire | Contenu de page (Hero, sections) |
| `src/content/**/*.md::champ` | Markdown + gray-matter | Articles, fiches démarches |

### Composants éditables

| Composant | Éléments éditables | Collections mutables |
| :--- | :--- | :--- |
| `Header` | Institution, titre du site | Navigation gérée par le code/développeur |
| `Footer` | Adresse, email, téléphone, libellés et URL de liens (`data-cms-bind-href`) | Colonnes de liens (`siteConfig.footerLinks[i].links`) |
| `Hero` | Titre, sous-titre, badge, CTA | Pastilles d'accès rapide (`home.json::quickLinks`) |
| `ServiceCard` | Titre, résumé, coût, délai, catégorie | — (prop `cmsSlug` requis) |
| `EmergencyBanner` | Message, libellé CTA | — |

---

## 4. Guide de Configuration Pas à Pas (Dokploy / GitHub)

Pour activer la publication automatique des contenus modifiés sur le site depuis le bandeau d'administration vers GitHub et votre hébergement (Dokploy/Coolify) :

### Étape 1 : Créer le Token d'Accès API (`GIT_TOKEN`) sur GitHub

1. Connectez-vous à votre compte GitHub.
2. Allez dans **Settings** > **Developer Settings** > **Personal access tokens** (Fine-grained tokens).
3. Sélectionnez le dépôt `sites` avec la permission **Contents: Read and Write**.
4. Copiez le token généré.

### Étape 2 : Configurer les Variables d'Environnement dans Dokploy (ou `.env`)

```env
CMS_ADMIN_SECRET=votre_mot_de_passe_admin_securise
CMS_GIT_ENABLED=true
CMS_GIT_BRANCH=prod
GIT_PROVIDER=github
GIT_OWNER=malibub-digital
GIT_REPO=sites
GIT_TOKEN=ghp_votre_token_securise
```

---

## 5. Récapitulatif des Variables d'Environnement

| Variable | Type | Valeur par défaut | Description |
| :--- | :--- | :--- | :--- |
| `CMS_ADMIN_SECRET` | `string` | `admin123` | Secret d'administration pour déverrouiller le mode édition et l'API. |
| `CMS_GIT_ENABLED` | `boolean` | `false` | Activer ou désactiver la publication Git. |
| `CMS_GIT_BRANCH` / `GIT_DEPLOY_BRANCH` | `string` | *(Aucune)* | **Obligatoire si `CMS_GIT_ENABLED=true`**. Branche cible pour la publication API (ex: `prod` ou `main`). |
| `GIT_PROVIDER` | `string` | `github` | Provider Git API (`github`, `gitlab`, `gitea`). |
| `GIT_OWNER` | `string` | `malibub-digital` | Nom du compte ou de l'organisation sur la forge Git. |
| `GIT_REPO` | `string` | `sites` | Nom du dépôt sur la forge Git. |
| `GIT_TOKEN` | `string` | *(Aucune)* | **Obligatoire si `CMS_GIT_ENABLED=true`**. Token d'accès API avec droits d'écriture sur le dépôt. |

---

## 6. Protocole pour Assistants de Code & LLM (`AI_RULES.md` & `llms.txt`)

Le projet inclut un protocole d'assistance IA pour faciliter le développement assisté (Cursor, Windsurf, Copilot, Antigravity, Claude Code...) :

- **`AI_RULES.md`** : Directives d'architecture, règles strictes de binding CMS `data-cms-bind` et exemples d'intégration IDE (`.cursorrules`, `.github/copilot-instructions.md`).
- **`/llms.txt`** : Guide compilé automatiquement accessible à la racine de tout site déployé, listant l'inventaire des composants cœurs `@malihub/sites-core` et le protocole de stockage CMS.
- **Regénération** : Le fichier `llms.txt` est regénéré automatiquement à chaque build (`npm run build:llms`).



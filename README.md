# Documentation Sites Faciles

Projet de moteur de sites web institutionnels et démarches publiques pour le Mali.

## 1. Moteur CMS & Édition Inline

Le projet inclut un moteur d'édition visuelle en temps réel permettant aux agents autorisés de modifier le contenu des pages directement depuis leur navigateur.

### Architecture de stockage du contenu

Le moteur CMS route chaque sauvegarde vers le bon fichier selon le préfixe `data-cms-bind` :

| Préfixe | Fichier cible | Contenu |
| :--- | :--- | :--- |
| `siteConfig.*` | `site.config.json` | Config globale (institution, nav, footer, alerte) |
| `src/data/pages/<p>.json::champ` | JSON arbitraire | Contenu de page (Hero, sections) |
| `src/content/**/*.md::champ` | Markdown + gray-matter | Articles, fiches démarches |

### Composants éditables (Chantier 3)

| Composant | Éléments éditables | Collections mutables |
| :--- | :--- | :--- |
| `Header` | Institution, titre du site | Navigation gérée par le code/développeur |
| `Footer` | Adresse, email, téléphone, libellés et URL de liens (`data-cms-bind-href`) | Colonnes de liens (`siteConfig.footerLinks[i].links`) |
| `Hero` | Titre, sous-titre, badge, CTA | Pastilles d'accès rapide (`home.json::quickLinks`) |
| `ServiceCard` | Titre, résumé, coût, délai, catégorie | — (prop `cmsSlug` requis) |
| `EmergencyBanner` | Message, libellé CTA | — |

### Édition de Liens & Type de Champ

- **Lien de page (`data-cms-bind-href`)** : Permet d'éditer l'URL cible (`href`) en plus du libellé du texte lors du clic sur un lien éditables (ex: liens du Footer).
- **Format de saisie adaptatif** : L'éditeur affiche un simple `<input type="text">` pour les champs d'une seule ligne (titres, libellés, emails, téléphones, URL) et un `<textarea>` pour les contenus multi-lignes. Possibilité de forcer le type via `data-cms-type="text"` ou `data-cms-type="multiline"`.

### Composant `EmergencyBanner`

Bandeau sticky configurable via `siteConfig.emergencyNotice` dans `site.config.json` :

```json
{
  "emergencyNotice": {
    "enabled": true,
    "type": "warning",
    "message": "Le consulat sera fermé du 10 au 15 août.",
    "ctaLabel": "Voir les permanences",
    "ctaHref": "/actualites"
  }
}
```

- `type` : `"info"` (bleu) · `"warning"` (ambre) · `"danger"` (rouge)
- Rendu conditionnel côté serveur : si `enabled: false`, aucun HTML n'est généré
- En mode édition, `message` et `ctaLabel` sont éditables inline

---


## 2. Guide de Configuration Pas à Pas (ex: GitHub + Dokploy)

Pour activer la publication automatique des contenus modifiés sur le site depuis le bandeau d'administration vers GitHub et votre hébergement (Dokploy/Coolify) :

### Étape 1 : Créer le Token d'Accès API (`GIT_TOKEN`) sur GitHub

1. Connectez-vous à votre compte GitHub.
2. Allez dans **Settings** (Paramètres de votre compte) > **Developer Settings**.
3. Dans le menu latéral de gauche, développez **Personal access tokens** :
   - **Option A — Tokens (classic)** : Cliquez sur *Tokens (classic)* > *Generate new token (classic)*. Donnez un nom (ex: `MaliHub Sites CMS`) et cochez la portée **`repo`**.
   - **Option B — Fine-grained tokens (Recommandé)** : Cliquez sur *Fine-grained tokens* > *Generate new token*. Sélectionnez le dépôt `sites` (Repository access: *Only select repositories* > `sites`), puis sous **Repository permissions**, recherchez **`Contents`** et définissez-la sur **Access: Read and Write** (aucune autre permission n'est requise).
4. Cliquez sur **Generate token** et **copiez immédiatement la clé générée** (`ghp_...` ou `github_pat_...`).

### Étape 2 : Configurer les Variables d'Environnement dans Dokploy (ou `.env`)

Dans votre projet sur Dokploy (ou dans le fichier `.env` du conteneur) :

```env
# Secret d'administration pour la connexion au mode édition
CMS_ADMIN_SECRET=votre_mot_de_passe_admin_securise

# Activation de la publication Git
CMS_GIT_ENABLED=true
CMS_GIT_BRANCH=prod

# Configuration du dépôt distant GitHub
GIT_PROVIDER=github
GIT_OWNER=malibub-digital
GIT_REPO=sites
GIT_TOKEN=ghp_votre_token_securise_copie_a_l_etape_1
```

### Étape 3 : Configurer l'Auto-Déploiement sur Dokploy

1. Dans Dokploy, ouvrez l'application **Sites Faciles**.
2. Dans l'onglet **General / Git**, assurez-vous que la branche écoutée est `prod`.
3. Activez l'option **Auto Deploy** (Webhooks / Push Trigger).
4. Désormais, dès qu'un administrateur clique sur **Publier** dans le site, le CMS crée un commit via l'API GitHub sur la branche `prod`, et Dokploy redéploie automatiquement le site en zéro-downtime !

---

## 3. Récapitulatif des Variables d'Environnement

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

## 4. Architecture de Publication API REST

Le flux de publication n'utilise pas de commandes CLI shell locales ni de dossier `.git` dans le container. 
Lors du clic sur **Publier** dans le bandeau d'administration :

1. L'API du serveur Astro identifie l'ensemble des fichiers Markdown/JSON modifiés.
2. Le `GitProvider` effectue un commit et met à jour la branche de production (`prod`) directement via l'API REST de la forge Git (GitHub / GitLab / Gitea).
3. Dokploy (ou toute autre plateforme CI/CD) détecte le nouveau commit sur la branche `prod` via son webhook natif et déclenche le redéploiement zéro-downtime.

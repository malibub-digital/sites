# Documentation Sites Faciles

Projet de moteur de sites web institutionnels et démarches publiques pour le Mali.

## 1. Moteur CMS & Édition Inline

Le projet inclut un moteur d'édition visuelle en temps réel permettant aux agents autorisés de modifier le contenu des pages directement depuis leur navigateur.

## 2. Variables d'Environnement

Pour piloter le comportement de la sauvegarde et du déploiement Git, configurez les variables d'environnement suivantes dans votre conteneur ou sur le serveur d'hébergement :

| Variable | Type | Valeur par défaut | Description |
| :--- | :--- | :--- | :--- |
| `CMS_ADMIN_SECRET` | `string` | `admin123` | Secret d'administration pour déverrouiller le mode édition et l'API. |
| `CMS_GIT_ENABLED` | `boolean` | `false` | Activer ou désactiver la publication Git. |
| `CMS_GIT_BRANCH` / `GIT_DEPLOY_BRANCH` | `string` | *(Aucune)* | **Obligatoire si `CMS_GIT_ENABLED=true`**. Branche cible pour la publication API (ex: `prod` ou `main`). |
| `GIT_PROVIDER` | `string` | `github` | Provider Git API (`github`, `gitlab`, `gitea`). |
| `GIT_OWNER` | `string` | `malibub-digital` | Nom du compte ou de l'organisation sur le provider Git. |
| `GIT_REPO` | `string` | `sites` | Nom du dépôt sur le provider Git. |
| `GITHUB_TOKEN` / `GIT_TOKEN` | `string` | *(Aucune)* | **Obligatoire si `CMS_GIT_ENABLED=true`**. Token d'accès API avec droits d'écriture sur le dépôt. |

---

## 3. Déploiement Continu CI/CD & Publication API REST

Le flux de publication n'utilise pas de commandes CLI shell local ni de dossier `.git` dans le container. 
Lors du clic sur **Publier** dans le bandeau d'administration :

1. L'API du serveur Astro identifie l'ensemble des fichiers Markdown/JSON modifiés.
2. Le `GitProvider` effectue un commit et met à jour la branche de production (`prod`) directement via l'API REST de la forge Git (GitHub / GitLab / Gitea).
3. Dokploy (ou toute autre plateforme CI/CD) détecte le nouveau commit sur la branche `prod` via son webhook natif et déclenche le redéploiement zéro-downtime.

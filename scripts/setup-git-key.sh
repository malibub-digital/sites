#!/usr/bin/env bash
# ==============================================================================
# Script de Génération & Assistant Clé Deploy SSH pour Sites Faciles Mali
# ==============================================================================
set -e

KEY_PATH="${HOME}/.ssh/id_sites_faciles_deploy"

echo "============================================================"
echo "  Assistant de Configuration Clé Git Deploy (Sites Faciles) "
echo "============================================================"
echo ""

if [ -f "$KEY_PATH" ]; then
  echo "✔ Une clé SSH de déploiement existe déjà sous : $KEY_PATH"
else
  echo "🔑 Génération d'une nouvelle clé SSH Ed25519 sans passphrase..."
  mkdir -p "${HOME}/.ssh"
  ssh-keygen -t ed25519 -C "sites-faciles-cms@malihub.digital" -f "$KEY_PATH" -N ""
  echo "✔ Clé SSH générée avec succès !"
fi

echo ""
echo "------------------------------------------------------------"
echo "  ÉTAPE 1 : Ajouter la clé publique sur GitHub / GitLab"
echo "------------------------------------------------------------"
echo "1. Allez sur votre dépôt GitHub -> Settings -> Deploy keys -> Add deploy key."
echo "2. Donnez un titre (ex: 'Dokploy / Prod Server - Sites Faciles')."
echo "3. Collez la clé publique ci-dessous :"
echo ""
cat "${KEY_PATH}.pub"
echo ""
echo "⚠️  IMPORTANT : Cochez IMPÉRATIVEMENT la case 'Allow write access' !"
echo ""

echo "------------------------------------------------------------"
echo "  ÉTAPE 2 : Monter la clé privée dans Docker / Dokploy"
echo "------------------------------------------------------------"
echo "Sur votre serveur d'hébergement (Dokploy, Coolify ou Docker Compose) :"
echo "Montez le fichier de clé privée comme volume :"
echo "  - ${KEY_PATH}:/root/.ssh/id_ed25519:ro"
echo ""
echo "Ou ajoutez cette clé privée dans les variables secrètes de votre conteneur."
echo "============================================================"

# Directives d'intégration IA pour Sites Faciles Mali (`sites`)

Ce document fournit des règles et instructions agnostiques d'assistance IA (Cursor, Windsurf, Copilot, Claude Code, Antigravity, ChatGPT...) pour la création et la modification de sites institutionnels avec **Sites Faciles Mali**.

---

## 🏛️ Règles Générales pour l'Assistant IA

1. **Architecture Monorepo & Paquets :**
   - **`@malihub/sites-core`** (`packages/core/`) : Contient les composants Astro certifiés DSML, le layout de base `BaseLayout`, ainsi que le moteur CMS visuel (handlers, stores, modales).
   - **`sites-template`** (`template/`) : Projet exemple/starter pour créer un site institutionnel.

2. **Règles de Stockage & Bindings CMS (`data-cms-bind`) :**
   - **`siteConfig.*`** : Réservé exclusivement à la configuration globale (`site.config.json` : institution, nom du site, contact, liens footer, alerte d'urgence). NE JAMAIS stocker du contenu spécifique de page dans `siteConfig`.
   - **`src/data/pages/<page>.json::champ`** : Pour les contenus verbeux de page (Hero, titres de sections, pastilles d'accès rapide).
   - **`src/content/**/*.md::champ`** : Pour les articles d'actualités et fiches démarches au format Markdown + gray-matter.
   - **Syntaxe obligatoire** : Toujours utiliser le format qualifié `fichier.json::champ` ou `siteConfig.champ`. Jamais de namespace flottant.

3. **Utilisation des Composants Cœurs DSML :**
   - Importer les composants depuis `@malihub/sites-core` : `BaseLayout`, `Header`, `Footer`, `Hero`, `ServiceCard`, `EmergencyBanner`, `AdminToolbar`.
   - Respecter les classes de tokens CSS DSML (`var(--ml-color-*)`, `ml-container`, `ml-card`, `font-title`).

4. **Collections et Listes Éditables :**
   - Pour chaque collection dynamique (ex: FAQ, cartes d'accès rapide, actualités) :
     - Envelopper chaque item avec `data-cms-collection` et `data-cms-item-index`.
     - Intégrer `<CollectionItemControls />` pour déplacer ou supprimer un élément.
     - Ajouter `<CollectionAddButton />` en bas de liste pour insérer de nouveaux éléments.

5. **Accessibilité & SEO :**
   - Conserver la hiérarchie sémantique HTML (`<h1>` unique par page, `<main id="main-content">`, `<nav>`).
   - Assurer le contraste des couleurs et les contours de focus pour le mode édition inline.

---

## 📋 Exemples de configuration selon votre IDE

### 1. Cursor (`.cursorrules`)
Créez un fichier `.cursorrules` à la racine de votre projet client et collez :
```markdown
# Rules for Sites Faciles Mali
- Use @malihub/sites-core components (BaseLayout, Header, Footer, Hero, ServiceCard, EmergencyBanner).
- Respect CMS bindings: siteConfig.* for global layout, src/data/pages/*.json::field for page content, src/content/**/*.md::field for markdown.
- Never place page-specific text inside site.config.json.
- Always include ARIA roles and visible focus indicators.
```

### 2. Windsurf (`.windsurfrules`) / Copilot (`.github/copilot-instructions.md`)
Utilisez les consignes ci-dessus pour guider le générateur de code.

### 3. Claude Code / Antigravity (`AGENTS.md`)
Référez-vous aux règles d'architecture CMS et de stockage décrites dans `AI_RULES.md`.

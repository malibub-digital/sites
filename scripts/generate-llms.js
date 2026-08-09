import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const coreDir = path.join(rootDir, 'packages/core/src');
const aiRulesPath = path.join(rootDir, 'AI_RULES.md');
const outputPathRoot = path.join(rootDir, 'llms.txt');
const outputPathTemplate = path.join(rootDir, 'template/public/llms.txt');

let llmsContent = `# Sites Faciles Mali — Guide pour LLM & Agents IA

> Moteur de sites web institutionnels et démarches publiques pour les administrations du Mali.
> Basé sur Astro, le Design System Mali (DSML) et un moteur CMS inline zéro-dossier-admin.

---

## 1. Composants Cœurs Disponibles (\`@malihub/sites-core\`)

Importation standard dans une page Astro :
\`\`\`astro
---
import { BaseLayout, Header, Footer, Hero, ServiceCard, EmergencyBanner } from '@malihub/sites-core';
import siteConfig from '../site.config.json';
---
\`\`\`

### Liste des Composants Exportés
- \`BaseLayout\` : Layout principal incluant la charte DSML, les balises SEO et le script d'édition CMS.
- \`Header\` : En-tête institutionnel avec logo, titre du site et navigation responsive.
- \`Footer\` : Pied de page standardisé avec coordonnées, liens institutionnels et crédits.
- \`Hero\` : En-tête de page d'accueil avec titre, sous-titre, badge et pastilles d'accès rapide.
- \`ServiceCard\` : Carte de présentation d'une démarche ou d'un service (titre, résumé, tarif, délai).
- \`EmergencyBanner\` : Bandeau d'alerte prioritaire configurable via \`siteConfig.emergencyNotice\`.
- \`AdminToolbar\` : Barre d'outils supérieure pour l'activation du mode édition et la publication.
- \`CollectionAddButton\` & \`CollectionItemControls\` : Outillage pour les collections dynamiques.

---

## 2. Architecture de Binding CMS (\`data-cms-bind\`)

| Préfixe Binding | Fichier Cible | Usage |
| :--- | :--- | :--- |
| \`siteConfig.*\ | \`site.config.json\` | Configuration globale (institution, navigation, footer, alerte) |
| \`src/data/pages/<page>.json::champ\` | JSON arbitraire | Contenus textuels de la page (Hero, titres, textes) |
| \`src/content/**/*.md::champ\` | Fichier Markdown | Articles d'actualité, fiches démarches détaillées |

### Exemple de liaison sur un composant :
\`\`\`html
<h1 data-cms-bind="src/data/pages/home.json::hero.title">Titre éditables</h1>
<p data-cms-bind="siteConfig.contact.email">contact@institution.ml</p>
\`\`\`

---

`;

if (fs.existsSync(aiRulesPath)) {
  const aiRulesContent = fs.readFileSync(aiRulesPath, 'utf8');
  llmsContent += `---\n\n## 3. Directives & Règles IA (Source : AI_RULES.md)\n\n${aiRulesContent}\n`;
}

fs.writeFileSync(outputPathRoot, llmsContent, 'utf8');
console.log(`✅ Génération réussie de ${outputPathRoot}`);

const templatePublic = path.dirname(outputPathTemplate);
if (!fs.existsSync(templatePublic)) {
  fs.mkdirSync(templatePublic, { recursive: true });
}
fs.writeFileSync(outputPathTemplate, llmsContent, 'utf8');
console.log(`✅ Génération réussie de ${outputPathTemplate}`);

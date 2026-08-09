import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();
const CORE_DIR = path.join(ROOT_DIR, 'packages/core');

function run(cmd, cwd = ROOT_DIR) {
  console.log(`\n> ${cmd} (dans ${path.relative(ROOT_DIR, cwd) || '.'})`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

try {
  console.log('🚀 Début du processus de publication de @malihub/sites-core');

  // 1. Vérification de l'authentification NPM
  console.log('\n🔍 1. Vérification de la connexion NPM...');
  try {
    const user = execSync('npm whoami', { encoding: 'utf-8' }).trim();
    console.log(`   Connecté en tant que: ${user}`);
  } catch (err) {
    console.error('❌ Vous n\'êtes pas connecté à NPM. Veuillez exécuter `npm login` avant de continuer.');
    process.exit(1);
  }

  // 2. Vérification des builds et tests
  console.log('\n⚙️ 2. Validation du projet et des tests...');
  run('npm run test', CORE_DIR);
  run('npm run build');

  // 3. Dry-run du packaging
  console.log('\n📦 3. Vérification du tarball (npm pack --dry-run)...');
  run('npm pack --dry-run', CORE_DIR);

  // 4. Publication NPM
  console.log('\n🌐 4. Publication sur le registre NPM...');
  run('npm publish --access public', CORE_DIR);

  console.log('\n✅ @malihub/sites-core a été publié avec succès sur NPM !');
} catch (error) {
  console.error('\n❌ Échec de la publication :', error.message);
  process.exit(1);
}

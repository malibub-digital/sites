import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface GitInitOptions {
  projectRoot: string;
  targetBranch: string;
  execOptions: { cwd: string; env: Record<string, string | undefined> };
}

export async function ensureGitRepositoryInitialized({
  projectRoot,
  targetBranch,
  execOptions,
}: GitInitOptions): Promise<void> {
  const gitDir = path.join(projectRoot, '.git');
  if (fs.existsSync(gitDir)) {
    return;
  }

  const repoUrl = process.env.GIT_REPO_URL || 'git@github.com:malibub-digital/sites.git';
  const gitUserName = process.env.GIT_USER_NAME || 'CMS Publisher';
  const gitUserEmail = process.env.GIT_USER_EMAIL || 'cms@malibub.digital';

  console.log(`[CMS Git Init] Dépôt .git non trouvé dans ${projectRoot}. Initialisation en cours...`);

  await execAsync('git init', execOptions);
  await execAsync(`git config user.name "${gitUserName}"`, execOptions);
  await execAsync(`git config user.email "${gitUserEmail}"`, execOptions);
  await execAsync(`git remote add origin ${repoUrl}`, execOptions);

  try {
    await execAsync(`git fetch origin ${targetBranch}`, execOptions);
    await execAsync(`git checkout -B ${targetBranch} origin/${targetBranch}`, execOptions);
  } catch (err: any) {
    console.warn(`[CMS Git Init Warning] Impossible de checkout origin/${targetBranch}: ${err.message}`);
    await execAsync(`git checkout -b ${targetBranch}`, execOptions);
  }
}

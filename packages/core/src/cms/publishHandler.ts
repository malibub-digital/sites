import { exec } from 'child_process';
import { promisify } from 'util';
import { hashSha256 } from '../utils/auth.js';

const execAsync = promisify(exec);

export interface CmsPublishOptions {
  projectRoot?: string;
  adminSecret?: string;
  gitEnabled?: boolean;
  gitBranch?: string;
}

export interface CmsPublishResult {
  success: boolean;
  message: string;
  gitPushed?: boolean;
  errors?: string[];
}

export async function processCmsPublishRequest(
  request: Request,
  options: CmsPublishOptions = {}
): Promise<Response> {
  const authHeader = request.headers.get('authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/(?:^|; )cms_admin_token=([^;]*)/);
    if (match) {
      token = decodeURIComponent(match[1]);
    }
  }

  const rawSecret = options.adminSecret || process.env.CMS_ADMIN_SECRET || 'admin123';
  const expectedHash = await hashSha256(rawSecret);

  if (!token || token !== expectedHash) {
    return new Response(
      JSON.stringify({ success: false, message: 'Non autorisé: authentification invalide ou manquante.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const isGitEnabled = options.gitEnabled !== undefined
    ? options.gitEnabled
    : (process.env.CMS_GIT_ENABLED === 'true' || process.env.CMS_GIT_ENABLED === '1');

  if (!isGitEnabled) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Publication Git non activée (CMS_GIT_ENABLED=false).',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const targetBranch = options.gitBranch || process.env.CMS_GIT_BRANCH;
  if (!targetBranch) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Flux Git activé mais la branche cible (CMS_GIT_BRANCH) n\'est pas configurée.',
        errors: ['Branche Git cible non définie. Publication annulée.'],
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const projectRoot = options.projectRoot || process.cwd();

  try {
    const extraEnv: Record<string, string> = {};
    const deployKey = process.env.GIT_DEPLOY_KEY;
    if (deployKey && deployKey.trim().length > 0) {
      const fs = await import('fs');
      const path = await import('path');
      const os = await import('os');
      const keyPath = path.join(os.tmpdir(), 'cms_git_deploy_key');
      fs.writeFileSync(keyPath, deployKey.trim() + '\n', { mode: 0o600 });
      extraEnv.GIT_SSH_COMMAND = `ssh -i "${keyPath}" -o StrictHostKeyChecking=no`;
    }

    const execOptions = { cwd: projectRoot, env: { ...process.env, ...extraEnv } };

    try {
      await execAsync(`git fetch origin ${targetBranch}`, execOptions);
      await execAsync(`git pull --rebase origin ${targetBranch}`, execOptions);
    } catch (pullErr: any) {
      console.warn(`[CMS Git Warning] Impossible d'effectuer le git pull --rebase: ${pullErr.message}`);
    }

    await execAsync('git add .', execOptions);

    const { stdout: statusOutput } = await execAsync('git status --porcelain', execOptions);
    if (!statusOutput.trim()) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Aucune modification locale à publier sur GitHub.',
          gitPushed: false,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await execAsync(`git commit -m "cms(publish): mise à jour du contenu via l'éditeur"`, execOptions);
    await execAsync(`git push origin ${targetBranch}`, execOptions);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Modifications publiées sur GitHub sur la branche '${targetBranch}'.`,
        gitPushed: true,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (gitErr: any) {
    return new Response(
      JSON.stringify({
        success: false,
        message: `Erreur lors de la publication Git sur GitHub: ${gitErr.message}`,
        errors: [gitErr.message],
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

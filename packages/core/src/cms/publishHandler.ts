import { hashSha256 } from '../utils/auth.js';
import { getGitProvider, GitFileChange } from './gitProvider.js';
import fs from 'fs';
import path from 'path';

export interface CmsPublishOptions {
  projectRoot?: string;
  adminSecret?: string;
  gitEnabled?: boolean;
  gitBranch?: string;
  gitProvider?: string;
  gitToken?: string;
  gitOwner?: string;
  gitRepo?: string;
}

export interface CmsPublishResult {
  success: boolean;
  message: string;
  gitPushed?: boolean;
  errors?: string[];
}

async function ensureEnvLoaded(projectRoot: string) {
  try {
    const candidates = [
      path.join(projectRoot, '.env'),
      path.join(projectRoot, '..', '.env'),
      path.join(process.cwd(), '.env'),
      path.join(process.cwd(), '..', '.env'),
    ];

    for (const envPath of candidates) {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const [k, ...v] = trimmed.split('=');
            const key = k.trim();
            let val = v.join('=').trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!(key in process.env)) {
              process.env[key] = val;
            }
          }
        }
      }
    }
  } catch {}
}

function findModifiedContentFiles(dir: string, baseDir: string = dir): GitFileChange[] {
  const changes: GitFileChange[] = [];
  if (!fs.existsSync(dir)) return changes;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== '.astro' && entry.name !== 'dist') {
        changes.push(...findModifiedContentFiles(fullPath, baseDir));
      }
    } else if (entry.isFile()) {
      if (entry.name.endsWith('.json') || entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
        const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
        const content = fs.readFileSync(fullPath, 'utf-8');
        changes.push({ path: relPath, content });
      }
    }
  }
  return changes;
}

export async function processCmsPublishRequest(
  request: Request,
  options: CmsPublishOptions = {}
): Promise<Response> {
  const projectRoot = options.projectRoot || process.cwd();
  await ensureEnvLoaded(projectRoot);

  const authHeader = request.headers.get('authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/(?:^|; )cms_admin_token=([^;]*)/);
    if (match) {
      token = decodeURIComponent(match[1]);
    }
  }

  const rawSecret = options.adminSecret || process.env.CMS_ADMIN_SECRET || (import.meta as any).env?.CMS_ADMIN_SECRET || 'admin123';
  const expectedHash = await hashSha256(rawSecret);

  if (!token || token !== expectedHash) {
    return new Response(
      JSON.stringify({ success: false, message: 'Non autorisé: authentification invalide ou manquante.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const envGitEnabled = process.env.CMS_GIT_ENABLED ?? (import.meta as any).env?.CMS_GIT_ENABLED;
  const envDeployBranch = process.env.GIT_DEPLOY_BRANCH ?? process.env.CMS_GIT_BRANCH ?? (import.meta as any).env?.GIT_DEPLOY_BRANCH ?? (import.meta as any).env?.CMS_GIT_BRANCH;

  const isGitEnabled = options.gitEnabled !== undefined
    ? options.gitEnabled
    : (
        String(envGitEnabled).toLowerCase() === 'true' ||
        String(envGitEnabled) === '1' ||
        (envGitEnabled !== 'false' && envGitEnabled !== '0' && Boolean(envDeployBranch))
      );

  if (!isGitEnabled) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Publication Git non activée (CMS_GIT_ENABLED=false).',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const targetBranch = options.gitBranch || process.env.CMS_GIT_BRANCH || process.env.GIT_DEPLOY_BRANCH || (import.meta as any).env?.CMS_GIT_BRANCH || (import.meta as any).env?.GIT_DEPLOY_BRANCH;
  if (!targetBranch) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Flux Git activé mais la branche cible (CMS_GIT_BRANCH ou GIT_DEPLOY_BRANCH) n\'est pas configurée.',
        errors: ['Branche Git cible non définie. Publication annulée.'],
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const gitToken = options.gitToken || process.env.GIT_TOKEN || (import.meta as any).env?.GIT_TOKEN;
  if (!gitToken) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Token de publication Git manquant (GIT_TOKEN non défini).',
        errors: ['Token API Git manquant (GIT_TOKEN). Publication impossible.'],
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const gitOwner = options.gitOwner || process.env.GIT_OWNER || (import.meta as any).env?.GIT_OWNER || 'malibub-digital';
  const gitRepo = options.gitRepo || process.env.GIT_REPO || (import.meta as any).env?.GIT_REPO || 'sites';
  const providerType = options.gitProvider || process.env.GIT_PROVIDER || (import.meta as any).env?.GIT_PROVIDER || 'github';

  try {
    const srcDir = path.join(projectRoot, 'src', 'content');
    const templateSrcDir = path.join(projectRoot, 'template', 'src', 'content');
    const contentDir = fs.existsSync(srcDir) ? srcDir : (fs.existsSync(templateSrcDir) ? templateSrcDir : projectRoot);

    const modifiedFiles = findModifiedContentFiles(contentDir, projectRoot);

    if (modifiedFiles.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Aucun fichier de contenu (.json/.md) à publier.',
          gitPushed: false,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const provider = getGitProvider(providerType);
    const result = await provider.publish({
      owner: gitOwner,
      repo: gitRepo,
      branch: targetBranch,
      commitMessage: "cms(publish): mise à jour du contenu via l'éditeur",
      files: modifiedFiles,
      token: gitToken,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: result.message,
        gitPushed: true,
        commitSha: result.commitSha,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (gitErr: any) {
    return new Response(
      JSON.stringify({
        success: false,
        message: `Erreur lors de la publication API sur ${providerType}: ${gitErr.message}`,
        errors: [gitErr.message],
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { exec } from 'child_process';
import { promisify } from 'util';
import { cmsSavePayloadSchema } from '../schemas/index.js';
import { hashSha256 } from '../utils/auth.js';

const execAsync = promisify(exec);

export interface CmsSaveOptions {
  projectRoot?: string;
  adminSecret?: string;
  gitEnabled?: boolean;
  gitBranch?: string;
}

export interface CmsSaveResult {
  success: boolean;
  message: string;
  updatedFiles?: string[];
  gitPushed?: boolean;
  errors?: string[];
}

export async function processCmsSaveRequest(
  request: Request,
  options: CmsSaveOptions = {}
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

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, message: 'Payload JSON invalide.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const parseResult = cmsSavePayloadSchema.safeParse(body);
  if (!parseResult.success) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Structure de données invalide.',
        errors: parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      }),
      { status: 422, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { drafts } = parseResult.data;
  const draftKeys = Object.keys(drafts);

  if (draftKeys.length === 0) {
    return new Response(
      JSON.stringify({ success: true, message: 'Aucune modification à enregistrer.', updatedFiles: [] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const projectRoot = options.projectRoot || process.cwd();
  const targetProjectRoot = fs.existsSync(path.join(projectRoot, 'template', 'site.config.json'))
    ? path.join(projectRoot, 'template')
    : projectRoot;

  const updatedFilesSet = new Set<string>();
  const errors: string[] = [];

  const siteConfigDrafts: Record<string, string> = {};
  const markdownDraftsByFile: Record<string, Record<string, string>> = {};

  for (const [key, value] of Object.entries(drafts)) {
    if (key.startsWith('siteConfig.')) {
      const configPath = key.replace('siteConfig.', '');
      siteConfigDrafts[configPath] = value;
    } else if (key.includes('::')) {
      const [relPath, fieldKey] = key.split('::');
      if (!markdownDraftsByFile[relPath]) {
        markdownDraftsByFile[relPath] = {};
      }
      markdownDraftsByFile[relPath][fieldKey] = value;
    }
  }

  if (Object.keys(siteConfigDrafts).length > 0) {
    const siteConfigPath = path.join(targetProjectRoot, 'site.config.json');
    try {
      if (fs.existsSync(siteConfigPath)) {
        const rawContent = fs.readFileSync(siteConfigPath, 'utf-8');
        const configObj = JSON.parse(rawContent);

        for (const [propPath, val] of Object.entries(siteConfigDrafts)) {
          setDeepProperty(configObj, propPath, val);
        }

        fs.writeFileSync(siteConfigPath, JSON.stringify(configObj, null, 2), 'utf-8');
        updatedFilesSet.add('site.config.json');
      } else {
        errors.push(`Fichier de configuration introuvable: ${siteConfigPath}`);
      }
    } catch (err: any) {
      errors.push(`Erreur lors de la mise à jour de site.config.json: ${err.message}`);
    }
  }

  for (const [relPath, fields] of Object.entries(markdownDraftsByFile)) {
    const fullPath = path.join(projectRoot, relPath);
    try {
      if (fs.existsSync(fullPath)) {
        const fileContent = fs.readFileSync(fullPath, 'utf-8');
        const parsed = matter(fileContent);

        for (const [fieldKey, value] of Object.entries(fields)) {
          if (fieldKey === 'content' || fieldKey === 'body') {
            parsed.content = value;
          } else {
            setDeepProperty(parsed.data, fieldKey, value);
          }
        }

        const updatedMarkdown = matter.stringify(parsed.content, parsed.data);
        fs.writeFileSync(fullPath, updatedMarkdown, 'utf-8');
        updatedFilesSet.add(relPath);
      } else {
        errors.push(`Fichier Markdown introuvable: ${relPath}`);
      }
    } catch (err: any) {
      errors.push(`Erreur lors de la mise à jour du fichier Markdown ${relPath}: ${err.message}`);
    }
  }

  const updatedFiles = Array.from(updatedFilesSet);
  if (errors.length > 0) {
    return new Response(
      JSON.stringify({
        success: false,
        message: `Sauvegarde effectuée avec ${errors.length} erreur(s).`,
        updatedFiles,
        errors,
      }),
      { status: 207, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: `${updatedFiles.length} fichier(s) mis à jour localement sur le disque.`,
      updatedFiles,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

function setDeepProperty(obj: any, propPath: string, value: any) {
  const parts = propPath.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
}

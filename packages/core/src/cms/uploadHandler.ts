import fs from 'fs';
import path from 'path';
import { hashSha256 } from '../utils/auth.js';

export interface CmsUploadOptions {
  projectRoot?: string;
  adminSecret?: string;
}

export async function processCmsUploadRequest(
  request: Request,
  options: CmsUploadOptions = {}
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

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const subDir = (formData.get('dir') as string) || 'images';

    if (!file) {
      return new Response(
        JSON.stringify({ success: false, message: 'Aucun fichier fourni.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const projectRoot = options.projectRoot || process.cwd();
    const targetProjectRoot = fs.existsSync(path.join(projectRoot, 'template', 'site.config.json'))
      ? path.join(projectRoot, 'template')
      : projectRoot;

    const publicDir = path.join(targetProjectRoot, 'public', subDir);
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const originalName = file.name || 'upload';
    const ext = path.extname(originalName) || '.png';
    const baseName = path.basename(originalName, ext).toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const timestamp = Date.now();
    const fileName = `${baseName}-${timestamp}${ext}`;

    const filePath = path.join(publicDir, fileName);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/${subDir}/${fileName}`;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Fichier téléchargé avec succès.',
        url: publicUrl,
        fileName,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, message: `Erreur d'upload: ${err.message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

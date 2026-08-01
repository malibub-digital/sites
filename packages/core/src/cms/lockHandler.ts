import { cmsLockPayloadSchema } from '../schemas/index.js';
import { hashSha256 } from '../utils/auth.js';

export interface LockEntry {
  resourceId: string;
  holderToken: string;
  holderName: string;
  lockedAt: number;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL
const lockStore = new Map<string, LockEntry>();

export function cleanExpiredLocks(): void {
  const now = Date.now();
  for (const [key, entry] of lockStore.entries()) {
    if (now > entry.expiresAt) {
      lockStore.delete(key);
    }
  }
}

export function resetLockStore(): void {
  lockStore.clear();
}

export async function processCmsLockRequest(
  request: Request,
  options: { adminSecret?: string; ttlMs?: number } = {}
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

  const parseResult = cmsLockPayloadSchema.safeParse(body);
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

  cleanExpiredLocks();
  const { resourceId, action, holderName } = parseResult.data;
  const ttlMs = options.ttlMs || DEFAULT_TTL_MS;
  const existing = lockStore.get(resourceId);
  const now = Date.now();

  if (action === 'check') {
    if (!existing || now > existing.expiresAt) {
      return new Response(
        JSON.stringify({ success: true, isLocked: false }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const isOwner = existing.holderToken === token;
    return new Response(
      JSON.stringify({
        success: true,
        isLocked: true,
        isOwner,
        holderName: existing.holderName,
        expiresInSeconds: Math.ceil((existing.expiresAt - now) / 1000),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (action === 'acquire') {
    if (existing && now <= existing.expiresAt && existing.holderToken !== token) {
      return new Response(
        JSON.stringify({
          success: false,
          isLocked: true,
          message: `Ressource actuellement verrouillée par un autre administrateur.`,
          holderName: existing.holderName,
          expiresInSeconds: Math.ceil((existing.expiresAt - now) / 1000),
        }),
        { status: 423, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const newEntry: LockEntry = {
      resourceId,
      holderToken: token,
      holderName: holderName || 'Agent Administrateur',
      lockedAt: now,
      expiresAt: now + ttlMs,
    };
    lockStore.set(resourceId, newEntry);

    return new Response(
      JSON.stringify({
        success: true,
        isLocked: true,
        isOwner: true,
        message: `Verrou obtenu pour ${resourceId}.`,
        expiresInSeconds: Math.ceil(ttlMs / 1000),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (action === 'release') {
    if (existing && existing.holderToken === token) {
      lockStore.delete(resourceId);
    }
    return new Response(
      JSON.stringify({ success: true, message: `Verrou libéré pour ${resourceId}.` }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: false, message: 'Action inconnue.' }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  );
}
